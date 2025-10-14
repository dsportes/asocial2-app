/* TODO
Sur suppression d'une def, recalculer pour chaque document concerné
le docInfo.defs et le cas échéant supprimer le document
creation d'une def : s'abonner au serveur (si pas avion)
suppression d'une def: se désabonner au serveur (si pas avion)
*/

// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { Document } from '../src-fw/document'
import { Sync } from '../src-fw/operations'

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

/* versions d'une souscription: sur le serveur, détenue localement
si versions[0] === versions[1] la souscription est à jour en session 
*/
type versions = [number, number]

// Souscriptions d'une classe de documents pour une organisation
class Subs {
  vdef0 : versions // versions de la collection de tous les documents de la classe
  vdef1 : Map<string, versions> // versions pour chaque pk
  vdef2 : Map<string, versions> // pour chaque collection colName/colValue

  constructor () {
    this.vdef0 = null
    this.vdef1 = new Map<string, versions>()
    this.vdef2 = new Map<string, versions>()
  }

  hasRefs () { return this.vdef0 === null && this.vdef1.size === 0 && this.vdef2.size === 0}
}

export type subsToSync = {
  org: string, 
  def: string, 
  v: number,
  order?: number // ordre d'entrée dans la queue de synchro : 0 si synchro en cours
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
  const cpt: Ref<number> = ref(0)
  const setCpt = (v: number) => cpt.value = v

  /* Map des documents hiérarchisée par org / clazz / pk */
  const documents: Ref<Map<string, Map<string, Map<string, Document>>>> 
    = ref(new Map<string, Map<string, Map<string, Document>>>())

  /* Range un document dans la structure documents
  S'il y existait déjà ne remplace le document que si celui 
  en arguments est plus récent.
  Supprime le document si doc est "deleted".
  Retourne le document "stocké" (le nouveau ou l'ancien)
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
    
    const defs = new Set<string>()
    {
      const eorg: Map<string, Subs> = allSubs.value.get(org)
      if (eorg) {
        const subs: Subs = eorg.get(doc._clazz)
        if (subs) {
          if (subs.vdef0) defs.add('0')
          if (subs.vdef1) {
            for (const [pk,] of subs.vdef1) {
              if (pk === doc._pk) defs.add(pk)
            }
          }
          if (subs.vdef2) {
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
          }
        }
      }
    }
    if (defs.size) { // le document est "utile", référencé dans des souscriptions
      ecl.set(doc._pk, { doc, defs })
      return docInfo
    }
    // Le document n'est plus utile, jamais référencé par une souscription
    ecl.delete(doc._pk)
    if (ecl.size === 0) eorg.delete(doc._clazz)
    if (eorg.size === 0) eorg.delete(org)
    return null
  }

  /* Supprime le document donné par sa classe et sa pk */
  const deleteDoc = (org: string, clazz: string, pk: string) => {
    let eorg = documents.value.get(org)
    if (!eorg) return
    let ecl = eorg.get(clazz)
    if (!ecl) return
    ecl.delete(pk)
    if (ecl.size === 0) eorg.delete(clazz)
    if (eorg.size === 0) eorg.delete(org)
  }

  /* Retourne le docInfo (doc, defs) du document dans la stucture ou null s'il n'y est pas */
  const getDocInfo = (org: string, clazz: string, pk: string) : docInfo => {
    let eorg = documents.value.get(org)
    if (!eorg) return null
    let ecl = eorg.get(clazz)
    if (!ecl) return null
    return ecl.get(pk) || null
  }

  /* Retourne la liste des documents stockés d'une classe donnée */
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

  /* Retourne la liste des organisations ayant des documents stockés */
  const getOrgs = (org: string) : string[] => {
    return Array.from(documents.value.keys())
  }

  /* Retourne une sous-collection d'une organisation, la liste des documents stockés 
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

  /* Map des souscriptions hiérartchisée par org / clazz */
  const allSubs: Ref<Map<string, Map<string, Subs>>> = ref(new Map<string, Map<string, Subs>>())

  /* Enregistre une nouvelle souscription en fixant la version détenue en session
  Cette version "peut" à la rigueur être inférieure à celle déjà connue
  (cas trouble de réinitialisation d'une collection).
  Si la souscription existait déjà et avait une version "serveur" non 0
  la version "serveur" est conservée.
  */
  const setDef = (org: string, def: string, v: number) : versions => {
    const s = def.split('/')
    const cl = s[0]
    let eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) { eorg = new Map<string, Subs>();  allSubs.value.set(org, eorg) }
    let subs: Subs = eorg.get(cl)
    if (!subs) { subs = new Subs(); eorg.set(cl, subs)}
    switch (s.length - 1) {
      case 0 : { 
        if (subs.vdef0 === null) subs.vdef0 = [0, v]
        else subs.vdef0[1] = v
        return subs.vdef0 
      }
      case 1 : { 
        const pk = s[1]
        let vdef1 = subs.vdef1.get(pk)
        if (!vdef1) { vdef1 = [0, 0]; subs.vdef1.set(pk, vdef1)}
        vdef1[1] = v
        return vdef1
      }
      case 2 : { 
        const nv = s[1] + '/' + s[2] // 'colName/colValue'
        let vdef2 = subs.vdef1.get(nv)
        if (!vdef2) { vdef2 = [0, 0]; subs.vdef2.set(nv, vdef2)}
        vdef2[1] = v
        return vdef2
      }
    }
  }

  /* Met à jour la version détenue en serveur pour la def */
  const updDef = (org: string, def: string, v: number) : versions => {
    const s = def.split('/')
    const cl = s[0]
    let eorg: Map<string, Subs> = allSubs.value.get(org)
    if (!eorg) return null
    let subs: Subs = eorg.get(cl)
    if (!subs) return null
    switch (s.length - 1) {
      case 0 : { 
        if (subs.vdef0 === null) return null
        if (subs.vdef0[0] < v ) subs.vdef0[0] = v
        return subs.vdef0 
      }
      case 1 : { 
        const pk = s[1]
        let vdef1 = subs.vdef1.get(pk)
        if (!vdef1) return null
        if (vdef1[0] < v ) vdef1[0] = v
        return vdef1
      }
      case 2 : { 
        const nv = s[1] + '/' + s[2] // 'colName/colValue'
        let vdef2 = subs.vdef1.get(nv)
        if (!vdef2) return null
        if (vdef2[0] < v ) vdef2[0] = v
        return vdef2
      }
    }
  }

  const deleteDef = (org: string, def: string) => {
    /* TODO
    Sur suppression d'une def, recalculer pour chaque document concerné
    le docInfo.defs et le cas échéant supprimer le document
    */
    const eorg = allSubs.value.get(org)
    if (!eorg) return
    const s = def.split('/')
    const cl = s[0]
    const subs = eorg.get(cl)
    if (!subs) return
    switch (s.length - 1) {
      case 0 : { 
        if (subs.vdef0) {
          // TODO - gestion des documents souscrits org / clazz
        }
        subs.vdef0 = null
        break 
      }
      case 1 : { 
        const pk = s[1]
        let vdef1 = subs.vdef1.get(pk)
        if (subs.vdef1) {
          // TODO - gestion du document souscrits org / clazz / pk
        }
        subs.vdef1.delete(pk)
        break
      }
      case 2 : { 
        const colName = s[1]
        const colValue = s[2]
        const nv = colName + '/' + colName
        let vPks = subs.vdef2.get(nv)
        if (vPks) { 
          // TODO - gestion de la sous-collection souscrite org / clazz / colName / colValue
        }
        subs.vdef2.delete(nv)
        break
      }
    }
    if (!subs.hasRefs) eorg.delete(cl)
    if (eorg.size === 0) allSubs.value.delete(org)
  }

  /* Retourne la versions (serveur, session) de la souscription à la classe donnée.
  Def: clazz
  null si non souscrit */
  const subs0 = (org: string, clazz: string): versions => {
    const eorg = allSubs.value.get(org)
    if (!eorg) return null
    const subs = eorg.get(clazz)
    return !subs || !subs.vdef0 ? null : subs.vdef0
  }

  /* Retourne la versions (serveur, session) de la souscription au document
  de la classe et pk donnés.
  Def: clazz/pk
  null si non souscrit */
  const subs1 = (org: string, clazz: string, pk: string): versions => {
    const eorg = allSubs.value.get(org)
    if (!eorg) return null
    const subs = eorg.get(clazz)
    if (!subs || subs.vdef1.size === 0) return null
    return subs.vdef1.get(pk) || null
  }

  /* Retourne la Map des versions (serveur, session) des souscriptions aux sous-collections
  de la classe donnée: clé: colName/colValue.
  Defs: clazz/ * / *
  null si non souscrit 
  */
  const subs2 = (org: string, clazz: string): Map<string, versions> => {
    const eorg = allSubs.value.get(org)
    if (!eorg) return null
    const subs = eorg.get(clazz)
    return (!subs || subs.vdef2.size === 0) ? null : new Map<string, versions>()
  }

  /* Retourne la Map des versions (serveur, session) des souscriptions aux sous-collections
  de la classe donnée et de nom colName: clé: colValue.
  Defs: clazz/colName/ * 
  null si non souscrit */
  const subs2N = (org: string, clazz: string, colName: string): Map<string, versions> => {
    const r = new Map<string, versions>()
    const m = subs2(org, clazz) 
    for(const [nv, versions] of m) {
      const i = nv.indexOf('/')
      if (nv.substring(0, i) === colName) r.set(nv.substring(i + 1), versions)
    }
    return r
  }

  /* Retourne la versions (serveur, session) des souscriptions aux sous-collections
  de la classe donnée, de nom colName pour la valeur colValue.
  Def: clazz/colMame/colValue
  null si non souscrit */
  const subs2NV = (org: string, clazz: string, colName: string, colValue: string): versions => {
    const m = subs2N(org, clazz, colName)
    return m.get(colValue) || null
  }

  /* Retourne le niveau de souscription pour un document donné:
  0: souscrit au niveau de sa classe
  1: souscrit au niveau de lui-même
  2: appartenant à une collection souscrite
  -1: aucune souscription - le document est "inutile / non souscrit"
  */
  const hasSubs = (org: string, doc: Document) : number => {
    if (subs0(org, doc._clazz)) return 0
    if (subs1(org, doc._clazz, doc._pk)) return 1
    if (subs2(org, doc._clazz).size !== 0) return 2
    return -1
  }

  const syncRunning: Ref<boolean> = ref(false)
  const qOrder: Ref<number> = ref(0)
  const syncQueue: Ref<Map<string, subsToSync>> = ref(new Map<string, subsToSync>())

  const nextToSync = () : subsToSync => {
    let sts = null
    for (const [, s] of syncQueue.value)
      if (!sts || s.order < sts.order) sts = s
    return sts
  }

  /* Enregistre une souscription à synchroniser au plus tôt */
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

  /* Retour de sync de la collection des documents d'une classe: enregistrement des documents
  OU chargement initial depuis IDB
  */
  const retSync0 = (subsToSync: subsToSync, datas: Uint8Array[]) => {
    const s = subsToSync.def.split('/')
    const org = s[0]
    const clazz = s[1]
    for (const data of datas) {
      const doc = Document.compile(clazz, data)
      // TODO
    }
  }

  /* Retour de sync d'un document: enregistrement DU document
  OU chargement initial depuis IDB
  */
  const retSync1 = (subsToSync: subsToSync, data: Uint8Array) => {
    const s = subsToSync.def.split('/')
    const org = s[0]
    const clazz = s[1]
    const pk = s[2]
    const doc = Document.compile(clazz, data)
    // TODO
  }

  /* Retour de sync d'une sous-collection colName/colValue: 
  enregistrement des documents présents dans la collection ET de ceux ayant quitté la collection
  OU chargement initial depuis IDB
  */
  const retSync2 = (subsToSync: subsToSync, vds: Object) => {
    const s = subsToSync.def.split('/')
    const org = s[0]
    const clazz = s[1]
    const colName = s[2]
    const colValue = s[3]
    if (vds) for (const pk in vds) {
      const vd = vds[pk]
      if (typeof vd === 'number') {
        // TODO - document pk, version vd a quitté / été zombifié
      } else {
        const doc = Document.compile(clazz, vd)
        // TODO
      }
    }
  }

  /* Traitement des notifications reçues (souscriptions ayant changé) defs reçues:
  - par web-push
  - retour d'opération
  Enregistre les souscriptions reçues en notification (si postérieure à celle connue)
  - si sa version détenue est plus ancienne que la version du serveur,
    l'inscrit en queue pour synchronisation.
  */
  const onNotif = (now: number, org: string, defs: string[]) => {
    if (defs) for(const def of defs) {
      const versions = updDef(org, def, now)
      if (versions && versions[0] > versions[1])
        queueForSync({ org, def, v: versions[1] })
    }
  }

  return { 
    setCpt, cpt,
    setDoc, getDocInfo, deleteDoc, getColl, getClDocs, getOrgs, setDef, updDef, deleteDef,
    subs0, subs1, subs2, subs2N, subs2NV, hasSubs, 
    queueForSync, startSyncQueue, syncAll,
    retSync0, retSync1, retSync2, onNotif
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
