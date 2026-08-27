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
import { $Perimeter, $Def } from '../src-fw/documents'
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
    if (config.K.myDebug) console.log('Show notif EXPLICITE from app')
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

  fetch (lp: $Perimeter[]) : Promise<void>
  listen (p: $Perimeter, lastTime?: number) : Promise<number>
  forcedResync (p?: $Perimeter) : void
  getDoc (cl: string, pk: string) : $Document
  getColl (cl: string, pk: string) : Set<string>

  subsOK: Ref<boolean>
  syncQueue: SyncQueue

  getItem (def: $Def, create?: boolean) : $DCItem
  getAPState (p: $Perimeter) : APState

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

  constructor (def: $Def) { super(def) }

}

export class $DocItem extends $DCItem {
  doc: $Document = null // Document compilé
  constructor (def: $Def, lat?: number, lv?: number, doc?: $Document) {
    super(def)
    if (lat) this.lat = lat
    if (lv) this.lv = lv
    this.doc = doc || null
  }
}

// Decode d'un Document sérialisé
type Row = {
  _pk: string
  v: number
  // etc.
}

type APState = {
  lastSync: number
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

  push (items: $DCItem[]) {
    for(const item of items) // N'inscrit pas ceux en cours de sync
      if (item.syncSt === 0) this.items.push(item)
    if (this.syncRunning || !this.items.length) return
    this.peakItemsToRun()
    this.syncRunning = true
    const self = this
    setTimeout(async () => {
      await self.syncList()
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
      item.syncSt = 1
      this.sync.addDef(item.def, item.lv)
      if (!item.def.isColl) n--
      else { if (item.lv) n--; else break }
      if (n === 0) break
    }
  }

  async syncList () {
    while (this.runningItems.size !== 0) {
      for(const [,item] of this.runningItems) item.syncSt = 2
      const [sat, syncs] = await this.sync.post()
      if (sat !== 0) { 
        for(const definition in syncs) {
          const dcdata = syncs[definition] as $DCData
          const item = this.runningItems.get(definition)
          item.syncSt = 0
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

    const upd = (item: $DCItem) => {
      if (item.def.type === 1) {
        delete docs[item.def.definition]
        docs[item.def.definition] = item
      } else {
        delete colls[item.def.definition]
        colls[item.def.definition] = item
      }
    }

    const activePerims = reactive({  })
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
          if (item) items.push(item)
        }
      if (items.length) syncQueue.push(items)
    }

    async function setIDB (item: $DCItem, sat: number, v: number, data: Uint8Array) {
      /* Store en IDB:
      a) si version plus récente
      b) ou si identique et que lat est "bien inférieure à" sat */
      if (item.lv !== v) {
        item.lv = v
        item.lat = sat
        await idb.setDC(svc, org, item.def.definition, sat, v, data)
      } else await setLatIDB(item, sat, v)
      upd(item)
    }

    async function setLatIDB (item: $DCItem, sat: number, v: number) {
      if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
        item.lat = sat
        upd(item)
        await idb.updLV(svc, org, item.def.definition, sat, v)
      }
    }

    /* Ces documents sont modifiés mais SURTOUT NE SONT PLUS dans la collection
    Les documents de la collection ont une classe différente pour un type 2 ou 3
    */
    async function movedDatas (item, sat, pks: Set<string>, datas: Uint8Array[]) {
      const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
      if (!docCl) return
      for(const data of datas) {
        const doc = await getDocument(docCl, data)
        pks.delete(doc._pk)
        const def = new $Def(docCl + '/' + doc._pk)
        let itemd = getItem(def) as $DocItem
        // Si itemd n'existait pas on N'EN CREE PAS
        if (itemd && hasLocal) 
          await setIDB(itemd, sat, doc.v, data)
      }
    }

    /* Ces documents sont ajoutés ou modifiés mais SONT dans la collection
    Les documents de la collection ont une classe différente pour un type 2 ou 3
    */
    async function manageDatas (item: $CollItem, sat: number, pks: Set<string>, datas: Uint8Array[]) {
      const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
      if (!docCl) return
      for(const data of datas) {
        const doc = await getDocument(docCl, data)
        pks.add(doc._pk)
        const def = new $Def(docCl + '/' + doc._pk)
        let itemd = getItem(def) as $DocItem
        if (!itemd) {
          itemd = new $DocItem(def)
          itemd.sat = sat
          itemd.sv = doc.v
          if (hasLocal) { itemd.lv = itemd.sv; itemd.lat = itemd.sat }
          itemd.doc = doc
          docs[def.definition] = itemd
        } else {
          itemd.sat = sat
          itemd.sv = doc.v
          if (hasLocal) { itemd.lv = itemd.sv; itemd.lat = itemd.sat }
          upd(itemd)
        }
        if (hasLocal) 
          await idb.setDC(svc, org, def.definition, itemd.sat, itemd.sv, data)
      }
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

    async function manageData (item: $DocItem, sat: number, data: Uint8Array) {
      item.doc = await getDocument(item.def.docCl, data)
      if (hasLocal) await setIDB(item, sat, item.doc.v, data)
      else {
        item.lv = item.doc.v
        item.lat = sat
        upd(item)
      }
      delete docs[item.def.definition]
      docs[item.def.definition] = item
    }

    async function deleteDoc (def: $Def, sat: number, pk: string, v: number) {
        const defd = new $Def(def.docCl + '/' + pk)
        let itemd = getItem(defd) as $DocItem
        // Si itemd n'existait pas on N'EN CREE PAS
        if (itemd) // créé un Zombi
          itemd.doc = Registry.buildZombi(svc, def.docCl, org, v, pk)
        if (hasLocal) await setIDB(itemd, sat, v, null)
        else {
          itemd.sat = sat
          itemd.sv = v
          upd(itemd)
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
      if (cd.v === -1) { // credential NON accepté
        // TODO
        return
      }
      if (!cd.incr) { // INREGRAL
        if (cd.v === 0) { // Existait, n'existe plus - enregistré comme deleted
          if (item.sv === 0) return // n'existait pas, n'existe toujours pas
          item.doc = Registry.buildZombi(svc, item.def.docCl, org, item.sv, item.def.pk)
          if (hasLocal) await setIDB(item, sat, cd.v, null)
          else {
            item.sat = sat
            item.sv = 0
            upd(item)
          }
        } else { // Le document existe
          await manageData(item, sat, cd['data'])
        }
      } else { // INCREMENTAL
        if (cd.v === 0) { // document inchangé
          item.sat = sat
          if (hasLocal) await setLatIDB(item, sat, cd.v)
          else upd(item)
        } else {
          const data = cd['data']
          if (!data) { // Existait, n'existe plus: enregistré comme deleted
            item.doc = Registry.buildZombi(svc, item.def.docCl, org, item.sv, item.def.pk)
            if (hasLocal) await setIDB(item, sat, cd.v, null)
            else {
              item.sat = sat
              item.sv = cd.v
              upd(item)
            }
          } else { // Existe toujours mais a changé
            await manageData(item, sat, data)
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
        if (cd.v === -1) { // credential NON accepté
          // TODO
          return
        }
        if (!cd.incr) { // INTEGRAL
          if (cd.v === 0 && item.sv === 0) return // n'existait pas, n'existe toujors pas
          if (cd.v === 0) { // collection vide
            item.pks = new Set()
            if (hasLocal) await setIDB(item, sat, cd.v, null)
            else {
              item.sat = sat
              item.sv = cd.v
              upd(item)
            }
          } else { // La collection n'est pas vide
            const pks: Set<string> = new Set()
            await manageDatas(item, sat, pks, cd.datas) // ajoute à pks
            item.pks = pks
            if (hasLocal) await setIDB(item, sat, cd.v, encode(Array.from(pks)))
            else {
              item.sat = sat
              item.sv = cd.v
              upd(item)
            }
          }
      } else { 
        if (cd.v === 0) { // la collection est inchangée - item EXISTE - rafraichissement de sat
          item.sat = sat
          if (hasLocal) await setLatIDB(item, sat, cd.v)
          else upd(item)
        } else { 
          /* La collection a changé
          cd.v : est sa version
          datas et deleted : A AJOUTER (s'il n'y était pas) / CHANGES (s'il y était) pour type 2 et 3
          moved : seulement pour type 3 */
          const docCl = item.def.type === 2 ? item.def.docCl : item.def.colClass(svc)
          const pks: Set<string> = item.pks || new Set()
          if (cd.datas)
            await manageDatas(item, sat, pks, cd.datas)
          if (cd.deleted)
            for(const [pk, v] of cd.deleted) {
              pks.delete(pk)
              const defd = new $Def(docCl + '/' + pk)
              await deleteDoc(defd, sat, pk, v)
            }
          if (cd.moved)
            await movedDatas(item, sat, pks, cd.moved)
          item.pks = pks
          item.sat = sat
          item.sv = cd.v
          upd(item)
        }
      }
    }

    const initDocFromIDB = async (item: $DocItem) => {
      // Item est vierge
      const r: IDBrow = await idb.getDC(svc, org, item.def.definition)
      if (r) try {
        const obj = decode(r.data)
        item.doc = await Registry.compile(svc, item.def.docCl, org, obj)
        item.lat = r.lat
        item.lv = r.v
        upd(item)
      } catch (e) {
        console.error(e.toString)
      }
    }

    const initCollFromIDB = async (item: $CollItem) => {
      // Item est vierge
      const r: IDBrow = await idb.getDC(svc, org, item.def.definition)
      if (r) try {
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
        // Chargement depuis IDB
        if (!item.def.isColl) await initDocFromIDB(item as $DocItem)
        else await initCollFromIDB(item as $CollItem)
      }
    }

    const getItem = (def: $Def, create?: boolean) => {
      let item = def.isColl ? colls[def.definition] : docs[def.definition]
      if (!item) {
        item = def.isColl ? new $CollItem(def) : new $DocItem(def)
        docs[def.definition] = item
      } else {
        item.sat = 0; item.lat = 0; item.sv = 0; item.lv = 0
        upd(item)
      }
      return item
    }

    const getAPState = (p: $Perimeter) : APState => {
      let x = activePerims[p.id]
      if (!x) {
        x = { lastSync: 0, resolves: [], perimeter: p }
        activePerims[p.id] = x
      }
      return x
    }

    /* fetch : pour chaque périmètre de la liste:
    - le périmètre devient actif
    - sauf avion, abonne les périmètres (et réabonne ceux déjà actifs)
    - sauf incognito, recharge les documents / collections depuis le Cache IDB
    - sauf avion demande la synchronisation des defs du périmètre 
    - faire "await listen(p)" pour "attendre" (ou non) sa première synchro complète
    */
    const fetch = async (lp: $Perimeter[]) : Promise<void> => {
      const lp1: $Perimeter[] = [] // périmètres à souscrire
      const pid: Set<string> = new Set() // périmétres déjà actifs
      for(const x in activePerims) {
        pid.add(x)
        lp1.push(activePerims[x])
      }
      const lp2: $Perimeter[] = [] // périmètres à synchroniser
      for(const p of lp) {
        if (!pid.has(p.id)) {
          activePerims[p.id] = { lastSync: 0, resolves: [], perimeter: p }
          lp2.push(p)
          lp1.push(p)
        }
      }
      if (!lp2.length) return // tous déjà chargés
      if (hasLocal) // pré chargement depuis Cache IDB
        for(const p of lp2) await loadFromIDB(p)
      if (hasNet) { // souscription + sync
        subsOK.value = false
        const pgen = Registry.newD(svc, 'SubsGenerator') as $SubsGenerator
        pgen.init(org).processPerimeters(lp2)
        subsOK.value = await pgen.subs.subscribe(svc, org, false)
        if (subsOK.value) {
          const items = []
          for(const p of lp2)
            for(const def of p.defs) items.push(getItem(def))
          if (items.length) syncQueue.push(items)
        } else {
          // TODO
          console.log('subscription failed !')
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

    /* listen sur un périmètre:
    - "attend" que le périmètre ait une lastSync postérieure à lastTime.
    - si c'est déjà le cas, revient de suite.
    - retourne la lastSync du périmètre
    */
    const listen = async (p: $Perimeter, lastTime?: number) : Promise<any> => {
      let apstate = activePerims[p.id]
      if (!apstate) return -1 // le périmètre n'a pas eu de fetch
      const ls = getLastSync(apstate)
      // le périmètre a-t-il déjà été rafraîchi après lastTime ?
      if (ls > (lastTime || 0)) return ls 
      // NON retourne une promesse qui sera satisfaite ... un jour (ou non)
      const pr = new Promise((resolve, reject) => {
        apstate.resolves.push(resolve)
      })
      return pr
    } 

    /* Retourne le time de la dernière synchronisation COMPLETE
    pour le périmètre, c'est à dire le sat (service assert time)
    le plus faible de tous ses defs.
    */
    const getLastSync = (apstate: APState) : number => {
      let lastSync = 0
      for(const def of apstate.perimeter.defs) {
        const item = getItem(def)
        if (item.sat < lastSync) lastSync = item.sat
      }
      apstate.lastSync = lastSync
      return lastSync
    }

    /* Retour de synchronisation:
    - ne checke QUE les périmètres actifs (ayant fait l'objet d'un fetch)
    */
    const checkResolves = () => {
      for(const idp in activePerims) {
        const apstate = activePerims[idp]
        if (apstate.resolves.length) {
          /* Si un périmètre a un item qui n'a jamais été synchronisé 
          il ne sera pas résolu */
          const ls = getLastSync(apstate)
          if (ls) {
            // Le périmètre peut être résolu
            for(const resolve of apstate.resolves)
              resolve(ls)
            apstate.resolves = []
          }
        }
      }
    }

    return { 
      svc, org, subsOK, syncQueue,
      getItem,
      getAPState,
      onNotif, storeDC, checkResolves,
      getDoc, getColl,
      fetch, listen, forcedResync
    } as IDocStore
  })()
