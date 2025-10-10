// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import { Document } from '../src-fw/document'

/* Opération Sync du serveur : synchronise les souscriptions citées ***********
- defs: { def1: t1, def2: t2 ... } - t: version détenue par la session

Retourne pour chaque 'def' les documents/pkvs nouveaux depuis t.
Si t est 0, retourne les documents sans filtre de version.
Retour: { def0: [data], def1: data, def2: [data[], pkv] ... }
- data: Uint8Array
- pkv: object { pki: ti ... } donnant pour chaque docuement ayant quitté la collection
  sa pk et sa version (la plus récente au moment du retrait de la collection) 
*/

class DocDefs {
  doc: Document // document (complié)
  // // le document est synchronisé par ...
  def0: boolean // une souscription 0 (classe): clazz
  def1: boolean // une souscription 1 (pk): clazz/pk
  def2: Set<string> // string: colName/colValue - DES souscriptions 2: clazz/colName/colValue

  constructor(_doc) {
    this.doc = _doc
    this.def0 = false
    this.def1 = false
    this.def2 = new Set()
  }

  get hasSubs () { return this.def0 || this.def1 || this.def2.size }
}

type colOrg = Map<string, colClass> // toutes les classes d'une org
type colClass = Map<string, DocDefs> // tous les documents d'une classe

/* versions d'une souscription: sur le serveur, détenue localement
si versions[0] === versions[1] la souscription est à jour en session 
*/
type versions = [number, number]

/* Pour une collection colName/colValue (par exemple auteurs/zola)
- versions de la collection (sur le serveur et en session)
- set des pk des documents de la collection
*/
type vPks = {
  v: versions
  pks: Set<string>
}

class SubsDefs {
  vdef0 : versions // versions de la collection de tous les documents de la classe
  vdef1 : Map<string, versions> // versions pour chaque pk
  vdef2 : Map<string, vPks> // pour chaque collection colName/colValue

  constructor () {
    this.vdef0 = [0, 0]
    this.vdef1 = new Map<string, versions>()
    this.vdef2 = new Map<string, vPks>()
  }
}

type subsOrg = Map<string, subsClass> // souscriptions de toutes les classes d'une org
type subsClass = Map<string, SubsDefs> // souscriptions aux documents d'une classe

type subsToSync = {
  org: string, 
  def: string, 
  v: number,
  order?: number // ordre d'entrée dans la queue de synchro : 0 si synchro en cours
}

export const useDataStore = defineStore('data', () => {
  const cpt: Ref<number> = ref(0)
  const setCpt = (v: number) => cpt.value = v

  // Documents enregistrés par org / clazz / pk avec référence de leurs souscriptions
  const documents: Ref<Map<string, colOrg>> = ref(new Map<string, colOrg>())

  /* Range un document dans la structure documents
  S'il y existait déjà ne remplace le document que si celui en arguments est plus récent
  Retourne le descriptif DocDefs donnant accès
  au Set des définitions d'abonnements le référençant.
  */
  const setDoc = (org: string, doc: Document) : DocDefs => {
    let eorg: colOrg = documents.value.get(org)
    if (!eorg) { eorg = new Map<string, colClass>(); documents.value.set(org, eorg)}
    let ecl: colClass = eorg.get(doc._clazz)
    if (!ecl) { ecl = new Map<string, DocDefs>(); eorg.set(doc._clazz, ecl)}
    let dd: DocDefs = ecl.get(doc._pk)
    if (dd) { if (dd.doc.v < doc.v) dd.doc = doc}
    else { dd = new DocDefs(doc); ecl.set(doc._pk, dd)}
    return dd
  }

  /* Retourne le DocDefs du document dans la stucture ou null s'il n'y est pas
  */
  const getDocDefs = (org: string, clazz: string, pk: string) : DocDefs => {
    let eorg: colOrg = documents.value.get(org)
    if (!eorg) return null
    let ecl: colClass = eorg.get(clazz)
    if (!ecl) return null
    return ecl.get(pk) || null
  }

  const subs: Ref<Map<string, subsClass>> = ref(new Map<string, subsClass>())

  /* Enregistre une nouvelle souscription en fixant la version détenue en session
  Cette version "peut" à la rigueur être inférieure à celle déjà connue
  (cas trouble de réinitialisation d'une collection).
  Si la souscription existait déjà et avait une version "serveur" non 0
  la version "serveur" est conservée.
  */
  const setSubs = (org: string, def: string, v: number) : versions => {
    const s = def.split('/')
    const cl = s[0]
    let eorg = subs.value.length(org)
    if (!eorg) { eorg = new Map<string, SubsDefs>(); subs.value.set(org, eorg) }
    let subsDefs: SubsDefs = eorg.get(cl)
    if (!subsDefs) { subsDefs = new SubsDefs(); eorg.set(cl, subsDefs)}
    switch (s.length - 1) {
      case 0 : { subsDefs.vdef0[1] = v; return subsDefs.vdef0 }
      case 1 : { 
        const pk = s[1]
        let vdef1 = subsDefs.vdef1.get(pk)
        if (!vdef1) { vdef1 = [0, 0]; subsDefs.vdef1.set(pk, vdef1)}
        vdef1[1] = v
        return vdef1
      }
      case 2 : { 
        const nv = s[1] + '/' + s[2] // 'colName/colValue'
        let vPks = subsDefs.vdef2.get(nv)
        if (!vPks) { 
          vPks = { v: [0, 0], pks: new Set() }; 
          subsDefs.vdef2.set(nv, vPks)
        }
        vPks.v[1] = v
        return vPks.v
      }
    }
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
    startSyncQueue()
  }

  const startSyncQueue = () => {
    if (syncRunning.value) return
    syncRunning.value = true
    let sts = nextToSync()
    while (sts) {
      setTimeout(async () => {
        sts.order = 0
        // syncOp
        syncQueue.value.delete(sts.org + '/' + sts.def)
        sts = nextToSync()
      }, 1)
    }
    syncRunning.value = false
  }
  
  return { 
    setCpt, cpt,
    setDoc, getDocDefs, setSubs, queueForSync
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
