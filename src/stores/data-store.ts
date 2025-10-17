/* TODO
- Forcer la resynchronisation (synchrone) des souscriptions:
  - pour une org / classe. En dataSt et en IDB:
    - interruption de queue et suppression des defs en queue
    - suppression des documents de la classe
    - remise à 0 dans les subs de la version détenue en session
    - restart de la queue
  - pour une org: sur itération sur ses classes
  - totale : sur itération sur les orgs
*/

// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { isSameSet } from '../src-fw/util'
import { Document, Subscription, Subs, versions } from '../src-fw/document'
import { Sync } from '../src-fw/operations'
import { IDB } from '../src-fw/idb'

/* Le store "data" mémorise trois collections:
documents: une triple Map par org / clazz / pk qui détient pour chaque document, son "docInfo",
  - l'objet document (compilé)
  - le set des "définitions" (relatives à sa classe) dont le document fait partie.

  getOrgs() : retourne la liste des organisations ayant des documents stockés
  getClDocs() : retourne la liste des documents stockés d'une classe donnée
  getDocInfo() : retourne le docInfo (doc, defs) du document dans la stucture
  getColl() : retourne une sous-collection d'une organisation, la liste des documents stockés 

  setDoc() : range un document dans la structure documents

*******************************************************************************
subscriptions: une Map par org donnant l'objet "Suscriptions" contenant "defs",
  la liste des définitions des subscriptions de la classe.
  - Subscription ne dit rien l'état effectif des abonnements élémentaires.

  setSubscription() : enregistrement en phase 0 de la souscription d'une organisation
  getSubscription() : retourne un clone de la subscription enregistrée en vue d'édition
  getOrgsSubscription() : retourne la liste des organisations ayant une souscription

*******************************************************************************
allSubs: une double Map par org / classe donnant "l'état de synchronisation" de 
  chaque subscription élémentaire de la classe selon trois maps:
  - '0' : subscription à la classe
  - 'pk' : N1 subscriptions, une par pk de document
  - 'colName/colValue' : N2 subscriptions, une par sous-collection colName/colValue.
  Un état de synchronisation d'une sous-collection est fixé par deux versions:
    - celle détenue sur le serveur (du moins la dernière "notifiée à la session")
    - celle détenue effectivement en store "data" (et IDB sauf modes.INCOGNITO)

  initDefs() : enregistre en phase 0 l'état courant des souscriptions d'une class (Subs)
  setDefLoc() : enregistre la version détenue en "locale" d'une souscription élémentaire 
    - retour de Sync
    - fin d'édition locale d'une souscription
  delDefLoc() : à la fin de l'édition locale d'une souscription, suppression d'une souscription élémentaire

*******************************************************************************
La "queue" des synchronisations en attente ou en cours est décrite par:
- syncRunning: booléen indiquant si la queue de synchro est active et lance en
  séquence les synchronisations demandées et en attente.
- qOrder: un numéro d'ordre pour assurer un épuisement de la queue en FOFO.
- syncQueue: la map des synchros en attente:
  - clé: org / def
  - valeur: subsToSync (org, def, version détenue en session, numéro d'ordre dans la queue)

queueForSync() : enregistre une souscription à synchroniser au plus tôt
nextToSync() : retourne la prochaine synchronisation à traiter de la queue
startSyncQueue() : active le démon de synchronisation s'il ne l'était pas

syncAll() : synchronisation initaile "synchrone" de toutes les souscriptions (phase 0 de session)

retSync() : handler de traitement de retour d'une synchrisation
  - range les documents
  - met à jour les versions détenues en session

onNotif() : handler de traitement des notifications reçues (souscriptions ayant changé)
*/

export type subsToSync = {
  org: string, 
  def: string, // définition à synchroniser - clazz class/pk clazz/colName/colValue
  v: number, // version de la sous-collection détenue en session
  order?: number // numéro ordre d'entrée dans la queue de synchro
}

type docInfo = {
  doc: Document // son objet document
  defs: Set<string> 
  /* le set des souscriptions qui incluent ce document:
  '0': par convention, souscription de la collection de la classe
  'pk': souscription au document pk
  'colName/colValue': souscription d'une sous-collection 
  */
}

export const useDataStore = defineStore('data', () => {

  /* Map des documents hiérarchisée par org / clazz / pk */
  const documents: Ref<Map<string, Map<string, Map<string, Document>>>> 
    = ref(new Map<string, Map<string, Map<string, Document>>>())

  /* Map des subscriptions hiérarchisée par org */
  const subscriptions: Ref<Map<string, Subscription>>
    = ref(new Map<string, Subscription>())

  /* Map des états de synchronisation des souscriptions hiérarchisée par org / classe */
  const allSubs: Ref<Map<string, Map<string, Subs>>> 
    = ref(new Map<string, Map<string, Subs>>())

  const syncRunning: Ref<boolean> = ref(false)
  const qOrder: Ref<number> = ref(0)
  const syncQueue: Ref<Map<string, subsToSync>> = ref(new Map<string, subsToSync>())

  /* setDoc() : range un document dans la structure documents
  S'il y existait déjà ne remplace le document que si celui 
  en arguments est plus récent.
  Supprime le document si doc est "deleted".
  Retourne le document "stocké" (le nouveau ou l'ancien)
  ou null s'il a été supprimé
  */
  const setDoc = (org: string, doc: Document) : docInfo => {
    let eorg = documents.value.get(org);
    if (!eorg) {
      eorg = new Map<string, Map<string, Map<string, Document>>>()
      documents.value.set(org, eorg)
    }
    let ecl = eorg.get(doc._clazz)
    if (!ecl) {
      ecl = new Map<string, Map<string, Document>>()
      eorg.set(doc._clazz, ecl)
    }
    let docInfo = ecl.get(doc._pk)
    if (docInfo && docInfo.doc.v >= doc.v) return docInfo
    if (doc.deleted) {
      ecl.delete(doc._pk)
      if (ecl.size === 0) eorg.delete(doc._clazz)
      if (eorg.size === 0) eorg.delete(org)
      return null
    }
    const defs = deflocsOfDoc(org, doc)
    if (defs.size) { // le document est "utile", référencé dans des souscriptions
      ecl.set(doc._pk, { doc, defs })
      return docInfo
    }
    // Le document n'est plus utile, jamais référencé par une souscription
    ecl.delete(doc._pk)
    if (ecl.size === 0) eorg.delete(doc._clazz)
    if (eorg.size === 0) eorg.delete(org)
    if (eorg.size === 0) documents.value.delete(org)
    return null
  }

  /* Retourne le Set des "defloc" de sa classe dont le document doc fait.
  - '0' : fait partie de 'clazz'
  - 'pk' : fait partie de 'clazz/pk'
  - 'colName/colValue' : fait partie de 'clazz/colName/colValue'
  */
  const deflocsOfDoc = (org: string, doc: Document) : Set<string> => {
    const defs = new Set<string>()
    const eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) return defs
    const subs: Subs = eorg.get(doc._clazz)
    if (!subs) return defs
  
    if (subs.vdef0) defs.add('0')
    if (subs.vdef1.has(doc._pk)) defs.add(doc._pk)
    for (const [nv,] of subs.vdef2) {
      const i = nv.indexOf('/')
      const colName = nv.substring(0, i)
      const colValue = nv.substring(i + 1)
      const cv = doc[colName]
      if (cv) {
        if (Array.isArray(cv)) {
          if (cv.indexOf(colValue) !== -1) defs.add(nv)
        } else if (cv === colValue) defs.add(nv)
      }
    }
    return defs
  }

  /* Supprime le document donné par sa classe et sa pk
  const deleteDoc = (org: string, clazz: string, pk: string) => {
    let eorg = documents.value.get(org)
    if (!eorg) return
    let ecl = eorg.get(clazz)
    if (!ecl) return
    ecl.delete(pk)
    if (ecl.size === 0) eorg.delete(clazz)
    if (eorg.size === 0) eorg.delete(org)
  }
  */

  /* getDocInfo() : retourne le docInfo (doc, defs) du document dans la stucture 
  ou null s'il n'y est pas */
  const getDocInfo = (org: string, clazz: string, pk: string) : docInfo => {
    let eorg = documents.value.get(org)
    if (!eorg) return null
    let ecl = eorg.get(clazz)
    if (!ecl) return null
    return ecl.get(pk) || null
  }

  /* getClDocs() : retourne la liste des documents stockés d'une classe donnée */
  const getClDocs = (org: string, clazz: string)
    : Document[] => {
    const r: Document[] = []
    let eorg = documents.value.get(org)
    if (!eorg) return r
    let ecl = eorg.get(clazz)
    if (!ecl) return r
    for(const [, { doc, defs }] of ecl) r.push(doc)
    return r
  }

  /* PRIVATE: Remet à jour les docInfo des documents d'une classe donnée.
  Supprime les documents "inutiles"
  */
  const updateDocInfosCl = (org: string, clazz: string) => {
    let eorg = documents.value.get(org)
    if (!eorg) return
    let ecl = eorg.get(clazz)
    if (!ecl) return
    const toDel: string[] = []
    for(const [pk, { doc, defs }] of ecl) {
      const ndefs = deflocsOfDoc(org, doc)
      if (!isSameSet(defs, ndefs)) {
        if (ndefs.size) ecl.set(pk, { doc, ndefs })// document "utile"
        else toDel.push(doc._pk)
      }
    }
    for (const pk of toDel) ecl.delete(pk)
    if (ecl.size === 0) eorg.delete(clazz)
    if (eorg.size === 0) documents.value.delete(org)
  }

  /* getOrgs() : retourne la liste des organisations ayant des documents stockés */
  const getOrgs = (org: string) : string[] => {
    return Array.from(documents.value.keys())
  }

  /* getColl() : retourne une sous-collection d'une organisation, la liste des documents stockés 
  dont la propriété colName contient (ou a) la valeur colValue
  */
  const getColl = (org: string, clazz: string, colName: string, colValue: string)
    : Document[] => {
    const r: Document[] = []
    let eorg = documents.value.get(org)
    if (!eorg) return r
    let ecl = eorg.get(clazz)
    if (!ecl) return r
    for(const [, { doc, defs }] of ecl) {
      if (defs.has(colName + '/' + colValue)) r.push(doc)
    }
    return r
  }

  /* setSubscription() : enregistrement en phase 0 de la souscription d'une organisation */
  const setSubscription = (org: string, subscription: Subscription) => {
    subscriptions.set(org, subscription)
  }

  /* getOrgsSubscription() : retourne la liste des organisations ayant une souscription */
  const getOrgsSubscription = () : string[] => {
    return Array.from(subscriptions.keys())
  }

  /* getSubscription() : retourne un clone de la subscription enregistrée en vue d'édition */
  const getSubscription = (org: string) : Subscription => {
    const s = subscriptions.get(org)
    return !s ? null : Subscription.fromSerial(s.serial())
  }

  /* initDefs() : enregistre en phase 0 l'état courant des souscriptions d'une class (Subs) 
  */
  const initDefs = (org: string, clazz: string, subs: Subs) => {
    let eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) { eorg = new Map<string, Subs>();  allSubs.value.set(org, eorg) }
    eorg.set(clazz, subs)
  }

  /* PRIVATE : Retourne la Subs existante (ou la créé vide) */
  const getSubs = (org: string, clazz: string) : Subs => {
    let eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) { eorg = new Map<string, Subs>();  allSubs.value.set(org, eorg) }
    let subs: Subs = eorg.get(clazz)
    if (!subs) { subs = new Subs(); eorg.set(clazz, subs)}
    return subs
  }

  /* setDefLoc() : enregistre la version détenue en "locale" d'une souscription élémentaire 
  - retour de Sync
  - fin d'édition locale d'une souscription
  La version "serveur" est inchangée (si elle existait) sinon mise à 0
  Retourne [clazz, Subs] qui contient le def
  */
  const setDefLoc = (org: string, def: string, v: number): [string, Subs] => {
    const s = def.split('/')
    const clazz = s[0]
    const subs: Subs = getSubs(org, clazz)
    let versions: versions
    let defloc: string
    switch (s.length - 1) {
      case 0 : { 
        versions = subs.vdef0
        if (!versions) { defloc = '0'; versions = [0, 0]; subs.vdef0 = versions }
        versions[1] = v
        break 
      }
      case 1 : { 
        const pk = s[1]
        versions = subs.vdef1.get(pk)
        if (!versions) { defloc = pk; versions = [0, 0];  subs.vdef1.set(pk, versions)}
        versions[1] = v
        break 
      }
      case 2 : { 
        const nv = s[1] + '/' + s[2]
        versions = subs.vdef2.get(nv)
        if (!versions) { defloc = nv; versions = [0, 0];  subs.vdef2.set(nv, versions)}
        versions[1] = v
        break 
      }
    }
    updateDocInfosCl(org, clazz)
    if (versions[1] < versions[0]) queueForSync({ org, def, v: versions[1] })
    return [clazz, subs]
  }

  /* PRIVATE: met à jour sur notification la version "serveur" d'une souscription élémentaire
  La version "locale" est conservée.
  Retourne [clazz, subs] le Subs qui contient le def
  */
   const setDefSrv = (org: string, def: string, v: number): [string, Subs] => {
    const s = def.split('/')
    const clazz = s[0]
    const eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) return [clazz, null]
    const subs: Subs = eorg.get(clazz)
    if (!subs) return [clazz, null]

    let versions: versions
    switch (s.length - 1) {
      case 0 : { 
        versions = subs.vdef0
        if (!versions) return [clazz, null]
        versions[0] = v
        break 
      }
      case 1 : { 
        const pk = s[1]
        versions = subs.vdef1.get(pk)
        if (!versions) return [clazz, null]
        versions[0] = v
        break 
      }
      case 2 : { 
        const nv = s[1] + '/' + s[2]
        versions = subs.vdef2.get(nv)
        if (!versions) return [clazz, null]
        versions[0] = v
        break 
      }
    }
    if (versions[1] < versions[0]) queueForSync({ org, def, v: versions[1] })
    return [clazz, subs]
  }

  /* delDefLoc() : à la fin de l'édition locale d'une souscription, suppression d'une souscription élémentaire
  Recalcule pour chaque document concerné de son docInfo.defs
  et si "inutile" le supprime
  Retourne le Subs qui contenait le def
  */
  const delDefLoc = (org: string, def: string): [string, Subs]  => {
    const eorg = allSubs.value.get(org)
    if (!eorg) return
    const s = def.split('/')
    const clazz = s[0]
    const subs: Subs = eorg.get(clazz)
    if (!subs) return [clazz, null]

    switch (s.length - 1) {
      case 0 : { subs.vdef0 = null; break }
      case 1 : { subs.vdef1.delete(s[1]); break }
      case 2 : { subs.vdef2.delete(s[1] + '/' + s[2]); break }
    }
    updateDocInfosCl(org, clazz)
    if (!subs.hasRefs) eorg.delete(clazz)
    if (eorg.size === 0) allSubs.value.delete(org)
    return [clazz, subs]
  }

  /***********************************************************************
  Gestion des synchronisations
  ***********************************************************************/

  /* queueForSync : enregistre une souscription à synchroniser au plus tôt */
  const queueForSync = (subsToSync: subsToSync) => {
    const qo = qOrder.value + 1
    qOrder.value = qo
    subsToSync.order = qo
    let sts = syncQueue.value.get(subsToSync.org + '/' + subsToSync.def)
    if (!sts) {
      subsToSync.order = qo
      syncQueue.value.set(subsToSync.org + '/' + subsToSync.def, subsToSync)
    } else {
      // déjà en queue: la version détenue en session est "possiblement" avancée
      // SSI la souscription n'est pas DEJA en synchro
      if (!sts.order && (sts.v < subsToSync.v)) sts.v = subsToSync.v
    }
    if (stores.session.phase === 1) startSyncQueue()
  }

  /* nextToSync() : retourne la prochaine synchronisation à traiter de la queue */
  const nextToSync = () : subsToSync => {
    let sts = null
    for (const [, s] of syncQueue.value)
      if (!sts || s.order < sts.order) sts = s
    return sts
  }

  /* startSyncQueue() : active le démon de synchronisation s'il ne l'était pas
  Le démon s'interrompt lorsque la "queue" est épuisée. 
  Il est relancé dès que la "queue" a à nouveau au moins une synchronisation à traiter.
  */
  const startSyncQueue = () => {
    if (syncRunning.value) return
    syncRunning.value = true
    let sts = nextToSync()
    while (sts) {
      setTimeout(async () => {
        sts.order = 0
        // syncOp
        await new Sync().run(sts)
        syncQueue.value.delete(sts.org + '/' + sts.def)
        sts = nextToSync()
      }, 1)
    }
    syncRunning.value = false
  }

  /* Sync : synchronise les abonnements cités *************************
  - toSync = subsToSync[]
  subsToSync = {
    def: string, 
    v: number - version 'vs' la plus récente détenue en session
  }
  Pour chaque 'def' retourne la sous-collection 'clazz/colName/colValue' des documents (par exemple: Article/auteurs/Zola)
  - si vs est absent: connue actuellement (à now)
  - changements (documents ajoutés ou partis de la sous-collection ou zombifiés) depuis la version vs
      de la sous-collection connue en session.
  - { def0: [Uint8Array], def1: Uint8array, def2: { pk: data | v ... }}
    Pour les 'def2', un objet { pk: data | v ... }
    - v: version du document si n'est PLUS dans la collection
    - data: data du document s'il est dans la collection
  */

  /* Synchronisation INITIALE en séquence de toutes les souscriptions
  const allSubs: Ref<Map<string, Map<string, Subs>>> = ref(new Map<string, Map<string, Subs>>())
  class Subs {
    vdef0 : versions // versions de la collection de tous les documents de la classe
    vdef1 : Map<string, versions> // versions pour chaque pk
    vdef2 : Map<string, versions> // pour chaque collection colName/colValue
  */
  const syncAll = async () => {
    for(const [org, eorg] of allSubs) {
      for(const [clazz, subs] of eorg) {
        if (subs.vdef0) {
          await new Sync().run({ org, def: clazz, v: subs.vdef0[1]})
        }
        if (subs.vdef1.size) for(const [pk, versions] of subs.vdef1) {
          await new Sync().run({ org, def: clazz + '/' + pk, v: versions[1]})
        }
        if (subs.vdef2.size) for(const [nv, versions] of subs.vdef2) {
          await new Sync().run({ org, def: clazz + '/' + nv, v: versions[1]})
        }
      }
    }
  }

  /* retSync() : retour de sync de la collection des documents d'une classe: enregistrement des documents
  */
  const retSync = async (opTime: number, org: string, def: string, x: Uint8Array[] | Uint8Array) => {
    const [clazz, subs] = setDefLoc(org, def, opTime)

    const binDocs: Map<string, Uint8Array> = new Map<string, Uint8Array>()
    const delPks: string[] = []
    if (Array.isArray(x)) for (const data of x) {
      const doc = await Document.compile(clazz, data)
      const docInfo: docInfo = setDoc(org, doc)
      if (docInfo) binDocs.set(doc._pk, data) // document utile et existant
      else delPks.push(doc._pk)
    } else {
      const doc = await Document.compile(clazz, x)
      const docInfo: docInfo = setDoc(org, doc)
      if (docInfo) binDocs.set(doc._pk, x) // document utile et existant
      else delPks.push(doc._pk)
    }

    if (binDocs.size || delPks ) { // Maj en IDB
      await IDB.idb.retSync(org, clazz, subs, binDocs, delPks)
    }
    
  }

  /***************************************************************************
  onNotif() : tTraitement des notifications reçues (souscriptions ayant changé) defs reçues:
  - par web-push
  - retour d'opération
  Enregistre les souscriptions reçues en notification (si postérieure à celle connue)
  - si sa version détenue est plus ancienne que la version du serveur,
    l'inscrit en queue pour synchronisation.
    N'est jamais invoquée en mode AVION
  ******************************************************************************/
  const onNotif = async (now: number, org: string, defs: string[]) => {
    const session = stores.session
    if (defs) for(const def of defs) {
      const [clazz, subs] = setDefSrv(org, def, now)
      if (subs && session.hasIDB)
        await IDB.idb.updSubs(org, clazz, subs) // Maj de subs en IDB
    }
  }

  const cpt: Ref<number> = ref(0)
  const setCpt = (v: number) => cpt.value = v

  return { 
    setDoc, getDocInfo, getColl, getClDocs, getOrgs,
    setSubscription, getSubscription, getOrgsSubscription,
    initDefs, setDefLoc, delDefLoc,
    queueForSync, startSyncQueue, syncAll,
    retSync, onNotif,
    setCpt, cpt // Pour test
  }
})


/*
https://pinia.vuejs.org/cookbook/hot-module-replacement.html
Pinia supports Hot Module replacement so you can edit your stores 
and interact with them directly in your app without reloading the page, 
allowing you to keep the existing state, add, or even remove state, actions, and getters.
*/
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
