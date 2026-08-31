/* Module de gestion de "dsStores" de stockage BRUT de $Document.
UN "store" par couple (svc, org)
Stockage par clazz / pk : quand une classe n'a pas de document elle n'apparaît pas.

Voir: https://alexop.dev/tils/dynamic-pinia-dsStores/
*/

// @ts-ignore
import { Ref, ref, reactive, watch } from 'vue'
// @ts-ignore
import { defineStore } from 'pinia'
// @ts-ignore
import cloneDeep from 'lodash.clonedeep'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { useSessionStore } from '../stores/session-store'
import { useConfigStore } from '../stores/config-store'

import { keyFromB64 } from '../src-fw/b64'
import { $Perimeter, $Def } from '../src-fw/subscription'
import { $Document, Registry } from '../src-fw/registry'
import { FW$Sync, $SubsGenerator } from 'src/src-fw/subscription'
import { sleep } from '../src-fw/util'
// import { AppExc } from '../src-fw/log'
import { idb } from '../src-fw/idb'

// Si IDB a une lat plus ancienne il faut rafraîchir sa lat
const MAXLATDELAY = 3 * 3600 * 1000

type MsgNotif = {
  svc: string
  org: string // 'demo'
  now: number // dh de l'opération ayant publié le message
  title: string // 'myApp - demo', 
  body: string // 'Chat reçu',
  url: string // 'http...'
  defs: string // liste de def séparés par un espace
}

/* Traitement des notifications reçues:
- sur retour d'opération,
- sur web-push,
*/
export async function onPushMsg (payload: string) {
  const config = useConfigStore()
  const session = useSessionStore()
  const messageNotif =  decode(keyFromB64(payload)) as MsgNotif
  const st = getStore(messageNotif.svc, messageNotif.org, true)
  if (st && messageNotif.defs && messageNotif.defs.length) {
    const l: string[] = messageNotif.defs.split(' ')
    const defs: $Def[] = []
    for(const x of l) defs.push(new $Def(x))
    await st.onNotif(defs, messageNotif.now)
  }
  if (messageNotif.body) {
    // if (config.K.myDebug) console.log('Show notif EXPLICITE from app')
    const options = { body: messageNotif.body }
    // @ts-ignore
    if (messageNotif.url) options.data = { url: messageNotif.url || config.location }
    const t = messageNotif.title || (config.K.APPNAME + ' - ' + messageNotif.org)
    // @ts-ignore
    await session.registration.showNotification(t, options)
  }
}

export type IDocStore = {
  readonly svc: string
  readonly org: string
  getXref (def: $Def) : Set<string> 
  
  fetch (lp: $Perimeter[], waiting?: boolean, force?: number) : Promise<void>
  waitNextSync (p: $Perimeter) : Promise<void>
  forcedResync (p?: $Perimeter) : void
  getLastSyncTime (p: $Perimeter) : number
  getApstate (pid: string) : APState
  removeActiveP (id: string) : void

  getItem (def: $Def, create?: boolean) : $DCItem
  getDoc (cl: string, pk: string) : $Document
  getColl (cl: string, pk: string) : Set<string>
  activePerimsIds () : Set<string>

  onNotif (defs: $Def[], dh: number) : Promise<void>
  storeDC (item: $DCItem, now: number, dcdata: $DCData) : Promise<void>
  checkResolves () : void
}

const dsStores = {}

/* Retourne le "store" dédié à ce service et cette organisation.
S'il n'existe pas le CREE vide (sauf si noforce  (optionel) est true)
*/
export const getStore = (svc: string, org: string, noforce?: boolean)
  : IDocStore => {
  const k = svc + '/' + org
  let st = dsStores[k]
  if (!st) {
    if (noforce) return undefined
    st = useStore(k)
    dsStores[k] = st
  }
  return st
}

export const resetDocStores = () => {
  for(const k in dsStores)
    dsStores[k].$patch({
      docs: {},
      colls: {}
    })
  for(const k in dsStores) delete dsStores[k] // ?
}

export type IDBrow = {
  lat: number
  v: number
  data?: Uint8Array
}

export abstract class $DCItem {
  /*
   0: sync ni en queue, ni posté
   1: sync en queue, 
   2: sync posté pas revenu,
   3: posté, revenu
   4: changement notifié, à resync
  */
  syncSt: number = 0
  def: $Def
  /* sat : service assert time. Le service affirme que le document / collection 
  avait bien cette valeur à la date-heure de l'opération sync */
  sat: number = 0 // service assertion time
  sv: number = 0 // version du document / collection en service
  lat: number = 0 // local assertion time - (détenue en IDB)
  lv: number = 0 // version locale (détenue en IDB)

  constructor (def: $Def) { this.def = def }
}

export class $CollItem extends $DCItem {
  pks: Set<string> = new Set() // Set des pk des documents de la collection
  constructor (def: $Def) { super(def)}
}

export class $DocItem extends $DCItem {
  doc: $Document = null // Document compilé
  constructor (def: $Def) { super(def) }
}

// Decode d'un Document sérialisé
type Row = {
  _pk: string
  v: number
  // etc.
}

type APState = {
  /* 
    1: inscrit, pas encore abonné
    2: actif, abonné
    3: synchro demandée au moins une fois
    (l'état de synchronisation effective est donné par lastSync)
  */
  status: number
  lastSync: number // si non 0, dh de dernière synchro complète
  perimeter: $Perimeter
  resolves: Function[]
}

interface $DCData {
  v: number
  incr?: boolean
}

interface $DocData extends $DCData{
  data?: Uint8Array
}

interface $CollData extends $DCData{
  datas?: Uint8Array[]
  moved?: Uint8Array[]
  deleted?: [string, number][]
}

export class SyncQueue {
  std: IDocStore
  svc: string
  org: string
  items: $DCItem[] = [] // items en queue ou en sync
  syncRunning: boolean = false
  runningItems: Map<string, $DCItem> = new Map()
  sync: FW$Sync

  constructor (svc: string, org: string) {
    this.svc = svc
    this.org = org
    this.std = getStore(svc, org)
  }

  /* Pousse en queue de synchronisation les items de la liste, SAUF,
    - ceux n'étant plus / pas référencés par un périmètre ACTIF (2)
    - ceux déjà en cours de sync.
    FORCE: resync même s'il a été posté, est revenu et qu'aucune notification
      ne l'a concerné (cad théoriquement à jour)
    Leur statut devient 1
      0: sync ni en queue, ni posté
      1: sync en queue, 
      2: sync posté pas revenu,
      3: posté, revenu
      4: changement notifié, à resync
  */
  push (items: $DCItem[], force?: boolean) {
    for(const item of items) {
      if (item.syncSt === 1 || item.syncSt === 2) continue // en cours
      if (force || item.syncSt === 0 || item.syncSt === 4) {
        for(const pid of this.std.getXref(item.def)) {
          const apstate = this.std.getApstate(pid)
          if (apstate && apstate.status >= 2) {
            this.items.push(item)
            item.syncSt = 1 // pushed en queue, pas posté (prévient mise en q multiple)
            break
          }
        }
      }
    }
    if (this.syncRunning || !this.items.length) return
    this.syncRunning = true
    this.peakItemsToRun()
    const self = this
    setTimeout(async () => {
      await self.doSyncs()
    }, 1)
  }

  peakItemsToRun () {
    this.runningItems.clear()
    if (this.items.length === 0) return
    this.sync = new FW$Sync(this.svc, this.org)
    let n = 10
    while (this.items.length) {
      const item = this.items.shift()
      this.runningItems.set(item.def.definition, item)
      this.sync.addDef(item.def, item.lv)
      if (!item.def.isColl) n--
      else { if (item.lv) n--; else break }
      if (n === 0) break
    }
  }

  async doSyncs () {
    while (this.runningItems.size !== 0) {
      for(const [,item] of this.runningItems) item.syncSt = 2
      const [sat, syncs] = await this.sync.post()
      if (sat !== 0) { 
        for(const definition in syncs) {
          const dcdata = syncs[definition] as $DCData
          const item = this.runningItems.get(definition)
          item.syncSt = 3
          await this.std.storeDC(item, sat, dcdata)
        }
        this.std.checkResolves()
        this.runningItems.clear()
      } else { // échec: nouvelle tentative (quand l'utilisateur aura validé l'erreur)
        await sleep(3000)
      }
      if (this.runningItems.size === 0)
        this.peakItemsToRun()
    }
    this.syncRunning = false
  }
}

/* Les DocStore sont créés en début de session pour héberger les documents
et collections de la session pour chauqe couple svc / org.
Ils sont détruits en fin de session.
*/ 
const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const session = useSessionStore()

    /* State *********************************************/
    const svc = id.substring(0, id.indexOf('/'))
    const org = id.substring(id.indexOf('/') + 1)
    let hasLocal = session.hasLocal
    let hasNet = session.hasNet

    const syncQueue = new SyncQueue(svc, org)

    const subsOK: Ref<boolean>= ref(false)

    const docs: Ref<reactive> = reactive({  })

    /* Deux formes de collections selon leur def:
      0: Auteur : tous les auteurs
      2: Article/auteur/pkauteur : les messages dont l'auteur est pkauteur
      value: CollItem
    */
    const colls = reactive({  })

    const getXref = (def: $Def) : Set<string> => {
      return session.getXref(svc, org, def)
    }
    
    const upd = (item: $DCItem) => {
      if (item.def.type === 1) {
        delete docs[item.def.definition]
        docs[item.def.definition] = item
      } else {
        delete colls[item.def.definition]
        colls[item.def.definition] = item
      }
    }

    const getItem = (def: $Def, create?: boolean) => {
      let item = def.isColl ? colls[def.definition] : docs[def.definition]
      if (!item && create) {
        item = def.isColl ? new $CollItem(def) : new $DocItem(def)
        docs[def.definition] = item
      }
      return item
    }

    const activePerims = reactive({  })
    const activePerimsIds = () : Set<string> => {
      const s = new Set<string>()
      for(const x in activePerims) s.add(x)
      return s
    }
    const removeActiveP = (id: string) : void => {
      delete activePerims[id]
    }
    const getApstate = (pid: string) : APState => {
      return activePerims[pid]
    }
    /************************************************/

    const getDoc = (cl: string, pk: string) : $Document => {
      const item = docs[cl + '/' + pk]
      return item ? item.doc : null
    }

    const getColl = (cl: string, pk: string) : Set<string> => {
      const item = colls[cl + '/' + pk]
      return item ? item.pks : new Set()
    }

    // Avis de mises à jour de documents / collections - A RESYNCHRONISER
    const onNotif = async (defs: $Def[], dh: number) => {
      const items: $DCItem[] = []
      for(const def of defs) {
          const item = getItem(def)
          if (item) {
            item.syncSt = 4
            items.push(item)
          }
        }
      if (items.length) syncQueue.push(items)
    }

    /* Ces documents sont modifiés mais SURTOUT NE SONT PLUS dans la collection
    Les documents de la collection ont une classe différente pour un type 2 ou 3
    */
    async function movedDatas (item: $DCItem, sat: number, datas: Uint8Array[]) 
    : Promise<Set<string>> {
      const pks = new Set<string>()
      const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
      if (!docCl) return pks
      for(const data of datas) {
        const doc = await getDocument(docCl, data)
        const v = doc.v
        pks.add(doc._pk)
        const def = new $Def(docCl + '/' + doc._pk)
        let itemd = getItem(def) as $DocItem
        // Si itemd n'existait pas on N'EN CREE PAS
        if (itemd && itemd.sat < sat) {
          itemd.doc = doc
          await manageData(itemd, sat, v, data)
        }
      }
    }

    /* Ces documents sont ajoutés ou modifiés mais SONT dans la collection
    Les documents de la collection ont une classe différente pour un type 2 ou 3
    */
    async function manageDatas (item: $CollItem, sat: number, datas: Uint8Array[]) 
      : Promise<Set<string>> {
      const pks = new Set<string>()
      const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
      if (!docCl) return pks
      for(const data of datas) {
        const doc = await getDocument(docCl, data)
        const v = doc.v
        pks.add(doc._pk)
        const def = new $Def(docCl + '/' + doc._pk)
        let itemd = getItem(def, true) as $DocItem
        itemd = new $DocItem(def)
        if (itemd.sat < sat) {
          itemd.doc = doc
          await manageData(itemd, sat, v, data)
        }
      }
      return pks
    }

    async function  getDocument(docCl: string, data: Uint8Array) : Promise<$Document> {
      try {
        const row = decode(data) as Row
        return await Registry.compile(svc, docCl, org, row)
      } catch (e) {
        console.log(e)
        return null
        // TODO
      }
    }

    async function manageData (item: $DCItem, sat: number, v: number, data: Uint8Array) {
      item.sat = sat
      item.sv = v
      upd(item)
      if (hasLocal && item.lv <= v) {
        if (item.lv < v) {
          item.lat = sat
          item.lv = v
          upd(item)
          await idb.setDC(svc, org, item.def.definition, sat, v, data)
        }
        if ((item.lv === v) && (sat - item.lat > MAXLATDELAY)) {
          item.lat = sat
          upd(item)
          await idb.updLV(svc, org, item.def, sat, v)
        }
      }
    }

    async function deleteDoc (def: $Def, sat: number, pk: string, v: number) {
      const defd = new $Def(def.docCl + '/' + pk)
      const item = getItem(defd) as $DocItem
      // Si item n'existait pas on N'EN CREE PAS
      if (item && item.sat < sat) { // créé un Zombi
        item.doc = Registry.buildZombi(svc, def.docCl, org, v, pk)
        await manageData(item, sat, v, null)
      }
    }

    const storeDC = async (item: $DCItem, now: number, dcdata: $DCData) => {
      if (item.def.type === 1) await storeDoc(item as $DocItem, now, dcdata as $DocData)
      else await storeColl(item as $CollItem, now, dcdata as $CollData)
    }

    /* 
    INTEGRAL
    - le document n'existe PAS : v == 0, data: absent
    - le document existe : v: sa version data: son contenu
    INCREMENTAL
    - document ayant disparu DEPUIS vs: v version de disparition, data: ZOMBI
    - document ayant changé (pas disparu): v est sa version, data: son contenu
    - document inchangé: v: 0    
    */
    const storeDoc = async (item: $DocItem, sat: number, cd: $DocData) : Promise<void> => {
      const v  = cd.v
      const data = cd['data']
      if (cd.v === -1) { // credential NON accepté
        // TODO
        return
      }
      if (!cd.incr) { // INREGRAL
        if (v === 0) { // n'existe pas / plus - enregistré comme deleted
          if (item.sv === 0) return // n'existait pas, n'existe toujours pas
          if (item.sat < sat) {
            item.doc = Registry.buildZombi(svc, item.def.docCl, org, item.sv, item.def.pk)
            await manageData(item, sat, v, null)
          }
        } else { // Le document existe
          const doc = await getDocument(item.def.docCl, data)
          if (item.sat < sat) {
            item.doc = doc
            await manageData(item, sat, v, data)
          }
        }
      } else { // INCREMENTAL
        if (v === 0) { // document inchangé
          item.sat = sat
          upd(item)
          if (hasLocal && (sat - item.lat > MAXLATDELAY)) {
            item.lat = sat
            item.lv = v
            upd(item)
            await idb.updLV(svc, org, item.def, sat, v)
          }
        } else {
          if (!data) { // Existait, n'existe plus: enregistré comme deleted
            if (item.sat < sat) {
              item.doc = Registry.buildZombi(svc, item.def.docCl, org, item.sv, item.def.pk)
              await manageData(item, sat, v, null)
            }
          } else { // Existe toujours mais a changé
            const doc = await getDocument(item.def.docCl, data)
            if (item.sat < sat) {
              item.doc = doc
              await manageData(item, sat, v, data)
            }
          }
        }
      }
    }

    /* 
    INTEGRAL
    - la collection est vide : v == 0 (datas moved deleted sont absents)
    - la collection n'est PAS vide:
      - datas : liste des contenus des documents
      - v : version du document le plus récent de datas
    INCREMENTAL, liste des changements depuis vs:
    - collection inchangée: v == 0
    - collection changée: v != 0 et 1 à 3 listes datas, moved, deleted
      - v : version du changement le plus récent
      - datas : [Uint8Array]
        - documents AJOUTES à la collection depuis vs avec leur data complète
        - documents qui étaient et sont toujours dans la collection 
          et ONT CHANGE depuis vs avec data complète
      - moved : [Uint8Array] type 3 seulement
        - ceux AYANT QUIITE la collection depuis vs avec leur data complète
      - deleted : couples des [pk, v] des documents qui étaient dans la collection
        et ONT ETE SUPPRIME: document ZOMBI où v est leur dh de supression
    */
    const storeColl = async (item: $CollItem, sat: number, cd: $CollData) : Promise<void> => {
      const v = cd.v
      if (v === -1) { // credential NON accepté
        // TODO
        return
      }
      if (!cd.incr) { // INTEGRAL
        if (v === 0 && item.sv === 0) return // n'existait pas, n'existe toujors pas
        if (v === 0) { // collection vide
          if (item.sat < sat) {
            item.pks = new Set()
            await manageData(item, sat, v, null)
          }
        } else { // La collection n'est pas vide
          const pks: Set<string> = await manageDatas(item, sat, cd.datas)
          if (item.sat < sat) {
            item.pks = pks
            const data = encode(Array.from(pks))
            await manageData(item, sat, v, data)
          }
        }
      } else { 
        if (v === 0) { // la collection est inchangée - item EXISTE - rafraichissement de sat
          item.sat = sat
          upd(item)
          if (hasLocal && (sat - item.lat > MAXLATDELAY)) {
            item.lat = sat
            upd(item)
            await idb.updLV(svc, org, item.def, sat, v)
          }
        } else { 
          /* La collection a changé
          cd.v : est sa version
          datas et deleted : A AJOUTER (s'il n'y était pas) / CHANGES (s'il y était) pour type 2 et 3
          moved : seulement pour type 3 */
          const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
          const pks = new Set(item.pks)
          let pks1: Set<string>
          let pks2: Set<string> = new Set()
          let pks3: Set<string>
          if (cd.datas) {
            pks1 = await manageDatas(item, sat, cd.datas)
          }
          if (cd.deleted) {
            for(const [pk, v] of cd.deleted) {
              pks2.add(pk)
              const defd = new $Def(docCl + '/' + pk)
              await deleteDoc(defd, sat, pk, v)
            }
          }
          if (cd.moved) {
            pks3 = await movedDatas(item, sat, cd.moved)
          }
          for(const pk of pks1) pks.add(pk)
          for(const pk of pks2) pks.delete(pk)
          for(const pk of pks3) pks.add(pk)
          if (item.sat < sat) {
            item.pks = pks
            const data = encode(Array.from(pks))
            await manageData(item, sat, v, data)            
          }
        }
      }
    }

    const initDocFromIDB = async (item: $DocItem) => {
      // Item est vierge
      const r: IDBrow = await idb.getDC(svc, org, item.def.definition)
      if (r) try {
        const obj = decode(r.data)
        const doc = await Registry.compile(svc, item.def.docCl, org, obj)
        if (item.sv < doc.v) { // sinon l'item retour de sync est plus récent
          item.doc = doc
          item.lat = r.lat
          item.lv = r.v
          upd(item)
        }
      } catch (e) {
        console.error(e.toString)
      }
    }

    const initCollFromIDB = async (item: $CollItem) => {
      // Item est vierge
      const r: IDBrow = await idb.getDC(svc, org, item.def.definition)
      if (r.v > item.sv) try { // sinon celui de retour de sync est plus récent
        const x = decode(r.data)
        item.pks = new Set(x)
        item.lat = r.lat
        item.lv = r.v
        upd(item)
        const cl = item.def.type === 3 ? item.def.colClass(svc) : item.def.docCl
        for(const pk of x) {
          const itemd = getItem(new $Def(cl + '/' + pk), true)
          await initDocFromIDB(itemd)
        }
      } catch (e) {
        console.error(e.toString)
      }
    }

    const loadFromIDB = async (p: $Perimeter) => {
      for(const def of p.defs) {
        const item = getItem(def, true)
        if (!item.sat) {
          // Chargement depuis IDB, s'il n'a jamais été ni chargé, ni synchronisé
          if (!item.def.isColl) await initDocFromIDB(item as $DocItem)
          else await initCollFromIDB(item as $CollItem)
        }
      }
    }

    const doSubs = async () => {
      const lp1: $Perimeter[] = [] // périmètres à abonner
      for(const x in activePerims) lp1.push(activePerims[x].perimeter)
      subsOK.value = false
      const pgen = Registry.newD(svc, 'SubsGenerator') as $SubsGenerator
      pgen.init(svc, org).processPerimeters(lp1)
      subsOK.value = await pgen.subs.subscribe(svc, org, false)
      if (subsOK.value) for(const p of lp1) {
        const aps = activePerims[p.id]
        if (aps.status < 2) aps.status = 2
      } else {
        // TODO
        console.log('subscription failed !')
      }
    }

    const areSubsTodo = () : boolean => {
      for(const x in activePerims)
        if (activePerims[x] < 2) return true
      return false
    }

    /* fetch rend ACTIF les périmètres de la liste lp qui ne l'étaient pas ...
    FORCE 2: a) chargement initial en syncMode, b) reprise après PAUSE de synchro
      - rend ACTIF les périmètres de la liste lp qui ne l'étaient pas
      - refait les souscriptions
      - demande une (re)synchrosition des périmètres de lp (MEME S'ILS L'ETAIENT DEJA)
    FORCE 1: a) changement des périmètres en cours de session (édition de options)
      - rend ACTIF les périmètres de la liste lp qui ne l'étaient pas
      - refait les souscriptions, si certaines manquaient
      - demande une synchronisation des périmètres de lp QUI NE L'ETAIENT PAS
    FORCE 0: demandes au fil de l'eau de l'application
      - rend ACTIF les périmètres de la liste lp qui ne l'étaient pas
      - refait les souscriptions, si certaines manquaient
      - demande une synchronisation des périmètres de lp QUI NE L'ETAIENT PAS
    SI WAITING :
      - ne retourne que quand tous les périmètres de la liste lp
      auront eu au moins une synchronisation complète.
      - si tous ont déjà eu une synchro complète, retourne maintenant.
    */
    const fetch = async (lp: $Perimeter[], waiting?: boolean, _force?: number) : Promise<void> => {
      const force = _force || 0
      for(const p of lp)
        if (!activePerims[p.id]) 
          activePerims[p.id] = { status: 0, lastSync: 0, resolves: [], perimeter: p }

      if (session.planeMode) {
        for(const p of lp) await loadFromIDB(p)
        return
      }

      const lp2: $Perimeter[] = [] // périmètres à synchroniser
      if (force  === 2 || areSubsTodo()) await doSubs()
      for(const p of lp) {
        const ap = activePerims[p.id]
        if (force === 2 || (ap.status < 3)) lp2.push(p)
      }

      if (!lp2.length) return // rien à synchroniser

      if (hasLocal) // pré chargement depuis Cache IDB (des defs jamais chargées)
        for(const p of lp2) await loadFromIDB(p)

      if (hasNet && subsOK.value) { // synchronisation demandée
        const items = []
        for(const p of lp2) {
          activePerims[p.id].status = 3
          for(const def of p.defs) items.push(getItem(def))
        }
        if (items.length) syncQueue.push(items)
      }

      if (waiting) {
        const promises = []
        for(const p of lp2) {
          const apstate = activePerims[p.id]
          if (apstate.lastSync === 0)
            promises.push(new Promise((resolve) => { 
              apstate.resolves.push(resolve) 
            }))
        }
        if (promises.length) {
          console.log('waiting ' + promises.length + ' promises')
          await Promise.all(promises)
        }
      }
    }

    /* Resynchronise un périmètre cité, ou sinon tous ceux actifs
    NORMALEMENT les notifications déclenchent les synchronisations nécessaires.
    Cependant si par superstition, ou problèmes réseau cahotiques,
    l'utilisateur veut resynchroniser des périmètres
    par crainte d'avoir perdu des "notifications",
    il peut les forcer. 
    */
    const forcedResync = (p?: $Perimeter) : void => {
      const lp1: $Perimeter[] = [] // périmètres à souscrire
      if (p && activePerims[p.id]) lp1.push(p)
      if (!p) for(const x in activePerims) lp1.push(activePerims[x])
      if (lp1.length === 0) return
      const items = []
      for(const p of lp1)
        for(const def of p.defs) items.push(getItem(def))
      if (items.length) syncQueue.push(items)
    }

    /* Retourne le time de la dernière synchronisation COMPLETE
    pour le périmètre, c'est à dire le sat (service assert time)
    le plus faible de tous ses defs.
    */
    const getLastSync = (apstate: APState) : number => {
      let lastSync = 0
      let noSync = false
      for(const def of apstate.perimeter.defs) {
        const item = getItem(def)
        if (item.sat === 0) { 
          noSync = true
          break
        }
        if (lastSync === 0) lastSync = item.sat
        else if (item.sat < lastSync) lastSync = item.sat
      }
      return lastSync
    }

    /* Retour de synchronisation:
    - check les périmètres actifs ayant fait l'objet 
      d'au moins une demande de synchro
    - resolve tous les promises en attente sur le périmètre
      1: inscrit, pas encore abonné
      2: actif, abonné
      3: synchro demandée au moins une fois
      (l'état de synchronisation effective est donné par lastSync)
    */
    const checkResolves = () => {
      for(const idp in activePerims) {
        const apstate = activePerims[idp]
        if (apstate.status === 3) {
          const ls = getLastSync(apstate)
          if (ls && ls > apstate.lastSync) {
            apstate.lastSync = ls
            if (apstate.resolves.length) {
              for(const resolve of apstate.resolves) resolve(ls)
              apstate.resolves = []
            }
          }
        }
      }
    }

    const getLastSyncTime = (p: $Perimeter) : number => {
      const apstate = activePerims[p.id]
      return apstate ? apstate.lastSync : 0
    }

    /* Attente sur un périmètre:
    - reviendra la prochaine fois qu'un périmètre aura été synchronisé
      (en totalité)
    - retourne la lastSync du périmètre
    */
    const waitNextSync = async (p: $Perimeter) : Promise<void> => {
      if (!hasNet) return
      let apstate = activePerims[p.id]
      if (!apstate && apstate.status < 2) return
      return new Promise((resolve) => { 
        apstate.resolves.push(resolve) 
      })
    } 

    return { 
      svc, org, getXref, getApstate, subsOK,
      getItem,
      onNotif, storeDC, checkResolves,
      getDoc, getColl, activePerimsIds, removeActiveP,
      fetch, waitNextSync, forcedResync, getLastSyncTime
    } as IDocStore
  })()
