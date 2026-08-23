/* Module de gestion de "dsStores" de stockage BRUT de $Document.
UN "store" par couple (svc, org)
Stockage par clazz / pk : quand une classe n'a pas de document elle n'apparaît pas.

Voir: https://alexop.dev/tils/dynamic-pinia-dsStores/
*/

// @ts-ignore
import { ref, reactive } from 'vue'
// @ts-ignore
import { defineStore } from 'pinia'
// @ts-ignore
import cloneDeep from 'lodash.clonedeep'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { useSessionStore } from '../stores/session-store'
import { useSafeStore } from '../stores/safe-store'
import { useConfigStore } from '../stores/config-store'

import { keyFromB64 } from '../src-fw/b64'
import { $Perimeter } from '../src-fw/documents'
import { $Document, Registry } from '../src-fw/registry'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { $DCData } from 'src/src-fw/subscription'
import { AppExc } from '../src-fw/log'
import { idb } from '../src-fw/idb'

/* POUR TEST */
let callBack : Function
export const setCallBack = (fn: Function) => {
  callBack = fn
}

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
  if (messageNotif.defs && messageNotif.defs.length)
    await processNotif(messageNotif)
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
  readonly svc
  readonly org
  subsOK

  // Retourne la liste des classes ayant au moins un document ou []
  classes() : string[]
  collections() : string[]

  idef (def) : Idef

  getDCItem (def) : $DCItem
  getCollItem (def) : $CollItem
  storeDocColl (def: string, sat: number, cd: $DCData) : Promise<void>

  // Retourne true si la classe a des documents stockés
  hasDocs (clazz: string): boolean

  getDoc (cl: string, pk: string) : $Document

  onNotif (defs: string[], dh: number) : Promise<void>

  initDocFromIDB (item: $DocItem) : Promise<void>
  initCollFromIDB (item: $CollItem) : Promise<void>

  addPerimeter (p: $Perimeter)
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

export const processNotif = async (m: MsgNotif) => {
  const st = getStore(m.svc, m.org)
  if (m.defs) {
    const l = m.defs.split(' ')
    await st.onNotif(l, m.now)
  }
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

export type Idef = {
  def: string
  type: number
  cl: string
  pk: string
  colName: string
  dd: DocDescriptor
  anxCl: string
}

export class $DCItem {
  // 0: jamais demandé, 1: premier sync en cours, 2: un sync s'est terminé
  state: number = 0
  get isStandBy () { return this.state === 0 }
  get isLoading () { return this.state === 1 }
  get isReady () { return this.state === 2 }

  // set des prérimètres référençant ce def
  perims: Set<string> = new Set()

  def: string
  /* sat : service assert time. Le service affirme la collection 
  avait bien cette valeur à la date-heure sat */
  sat: number // service assertion time
  sv: number // version du document / collection en service
  lat: number // local assertion time - (détenue en IDB)
  lv: number // version locale (détenue en IDB)

  constructor (def: string, sat?: number, lat?: number, sv?: number, lv?: number) {
    this.def = def
    this.sat = sat || 0
    this.lat = lat || 0
    this.sv = sv || 0
    this.lv = lv || 0
  }

  addPerimeter (p: string) {
    this.perims.add(p)
  }

}

export class $CollItem extends $DCItem {
  pks: Set<string> // Set des pk des documents de la collection
  constructor (def: string, sat?: number, lat?: number, sv?: number, lv?: number, pks?: Set<string>) {
    super(def, sat, lat, sv, lv)
    this.pks = pks || null
  }
  get isEmpty() { return this.pks === null }
}

export class $DocItem extends $DCItem {
  doc: $Document // Document compilé
  constructor (def: string, sat?: number, lat?: number, sv?: number, lv?: number, doc?: $Document) {
    super(def, sat, lat, sv, lv)
    this.doc = doc || null
  }
  get isEmpty() { return this.doc === null }
}

type row = {
  _pk: string
  v: number
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
    let hasIDB = session.hasIDB
    let hasNet = session.hasNet

    const subsOK = ref(false)

    const docs = reactive({  })

    /* Deux formes de collections selon leur def:
      0: Auteur : tous les auteurs
      2: Article/auteur/pkauteur : les messages dont l'auteur est pkauteur
      value: CollItem
    */
    const colls = reactive({  })

    /* Chaque propriété correspondant à un périmètre: sa valeur donne son état.
    - 0: stand-by - n'a pas l'objet d'un fetch
    - 1: loading - a fait l'objet d'un fetch, toutes defs abonnés et sync demandés
    - 2: ready - toutes defs ont eu au moins un sync.
    */
    const pstates = reactive({  })
    /************************************************/

    const getDCItem = (def: string) : $DCItem => docs[def]

    const getDoc = (cl: string, pk: string) : $Document => {
      const item = docs[cl + '/' + pk]
      return item ? item.doc : null
    }

    const getCollItem = (def: string) : $CollItem => colls[def]
    
    const idef = (def: string) : Idef => {
      const defx = def.split('/')
      const type = defx.length - 1
      const idf: Idef = { def, type,
        cl: defx[0],
        pk: type === 0 ? '' : (type === 1 ? defx[1] : defx[2]),
        colName: type === 2 ? defx[1] : '',
        dd: DocDescriptor.get(svc + '$' + defx[0]),
        anxCl: ''
      }
      const c = idf.dd.colls.get(idf.colName)
      if (c && c.class) idf.anxCl = c.class
      return idf
    }

    const classes = () : string[] => { return Object.keys(docs) }
    const hasDocs = (clazz: string): boolean => docs[clazz] ? true : false
    const collections = () : string[] => { return  Object.keys(colls) }

    const onNotif = async (defs: string[], dh: number) => {
      await callBack(defs)
    }

    const storeDocColl = async (def: string, sat: number, cd: $DCData) : Promise<void> => {

      async function compile (clazz: string, row: row) : Promise<$Document> {
        try {
          return await Registry.compile(svc, clazz, org, row)
        } catch (e) {
          throw new AppExc(3, 'not_compilable_document', 'storeCollData',
            [org, svc, clazz, row._pk, e.message]
          )
        }
      }

      async function setIDB (item: $DCItem, data: Uint8Array) {
        /* Store en IDB:
        a) si version plus récente
        b) ou si identique et que lat est "bien inférieure à" sat */
        if (item.lv !== cd.v) {
          item.lv = cd.v
          item.lat = sat
          await idb.setDC(svc, org, def, sat, cd.v, data)
        } else await setLatIDB(item)
      }

      async function setLatIDB (item: $DCItem) {
        if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
          item.lat = sat
          await idb.updLV(svc, org, def, sat, cd.v)
        }
      }

      function buildRow (idf: Idef, enc: Uint8Array) : row {
        try {
          return decode(enc) as row
        } catch (e) {
          throw new AppExc(3, 'not_compilable_document', 'storeCollData',
            [org, svc, idf.cl, idf.pk, e.message])
        }
      }

      async function manageDatas (pks: Set<string>) {
        for(const data of cd['datas']) {
          const pk = await manageData(data)
          pks.add(pk)
        }
      }

      async function manageData (data: Uint8Array) {
        const row = buildRow(idf, data) as row
        const doc = await compile(idf.cl, row)
        const def = doc._clazz + '/' + doc._pk
        let item = docs[def] as $DocItem
        // Si itemd n'existait pas on EN CREE UN
        if (!item) {
          item = new $DocItem(def, sat, 0, row.v, 0, doc)
          docs[def] = item
        } else {
          item.sat = sat
          item.sv = row.v
          item.doc = doc
        }
        if (hasIDB) await setIDB(item, data)
        return doc._pk
      }

      async function movedDatas (pks: Set<string>) {
        for(const data of cd['datas']) {
          const row = buildRow(idf, data) as row
          const defd = idf.cl + '/' + row._pk
          pks.delete(row._pk)
          let itemd = docs[defd] as $DocItem
          // Si itemd n'existait pas on N'EN CREE PAS
          if (itemd) {
            itemd.sat = sat
            itemd.sv = row.v
            itemd.doc = await compile(idf.cl, row)
          }
          if (hasIDB) await setIDB(itemd, data)
        }
      }

      async function deleteDoc (pk: string, v: number) {
          const defd = idf.cl + '/' + pk
          let itemd = docs[defd] as $DocItem
          // Si itemd n'existait pas on N'EN CREE PAS
          if (itemd) { // créé un Zombi
            itemd.sat = sat
            itemd.sv = v
            itemd.doc = Registry.buildZombi(svc, idf.cl, org, v, pk)
          }
          if (hasIDB) await setIDB(itemd, null)
      }

      const idf = idef(def)

      if (idf.type === 1) { // Documents

        let item = docs[def] as $DocItem
        if (!cd.incr) {
          /* INTEGRAL
          - le document n'existe PAS : v == 0, data: absent
          - le document existe : v: sa version data: son contenu
          */
          if (cd.v === 0) {
            if (!item) return // n'existait pas, n'existe toujours pas
            // Existait: enregistré comme vide
            await deleteDoc(item.doc._pk, cd.v)
          } else { // Le document existe
            await manageData(cd['data'])
          }
        } else { 
          /* INCREMENTAL
          - document ayant disparu DEPUIS vs: v version de disparition, data: null
          - document ayant changé (pas disparu): v est sa version, data: son contenu
          - document inchangé: v: 0
          */
         // Par principe de sérialisation item existe toujours
          if (cd.v === 0) { // document inchangé
            item.sat = sat
            if (hasIDB) await setLatIDB(item)
          } else {
            const data = cd['data']
            if (!data) { // Existait, n'existe plus: enregistré comme vide
              await deleteDoc(item.doc._pk, cd.v)
            } else { // Existe toujours mais a changé
              await manageData(data)
            }
          }
        }

      } else { // Collections

        let item = colls[def] as $CollItem
        if (!cd.incr) {
          /* INTEGRAL
          - la collection est vide : v == 0 (datas moved deleted sont absents)
          - la collection n'est PAS vide:
            - datas : liste des contenus des documents
            - v : version du document le plus récent de datas
          */
          if (cd.v === 0) {
            if (!item) return // n'existait pas, n'existe toujors pas
            // Existait: enregistré comme vide
            item.sat = sat
            item.sv = cd.v
            item.pks = new Set()
            if (hasIDB) await setIDB(item, null)
          } else { // La collection n'est pas vide
            const pks: Set<string> = new Set()
            await manageDatas(pks)
            if (!item) { // N'existait pas, on en créé un
              // Création de l'item pour la collection
              item = new $CollItem(def, sat, sat, cd.v, cd.v, pks)
              colls[item] = item
            } else { // la collection avait un item
              item.sat = sat
              item.sv = cd.v
              item.pks = pks
            }
            if (hasIDB) await setIDB(item, encode(Array.from(item.pks)))
          }
        } else { 
          /*
          INCREMENTAL, liste des changements depuis vs:
          - pour les types 0 et 2, 
            - collection inchangée: v: 0 (datas dels sont absents)
            - collection changée: v et 1 à 3 listes
              - v : version du changement le plus récent
              - datas : [Uint8Array]
                - ceux ajoutés à la collection depuis vs avec leur data complète
                - ceux qui sont dans la collection et ont changé depuis vs avec data complète
              - moved : [Uint8Array] type 2 seulement
                - ceux ayant quitté la collection depuis vs avec leur data complète
              - deleted : couples des [pk, v] des documents supprimés 
                où v est leur dh de supression
          */
          // Par principe même de sérialisation maj des stores item EXISTE
          if (cd.v === 0) {
            // la collection est inchangée - item EXISTE - rafraichissement de sat
            item.sat = sat
            if (hasIDB) await setLatIDB(item)
          } else { 
            /* La collection a changé
            cd.v : est sa version
            datas et deleted : toujours à traiter
            moved : seulement pour type 2 */
            const pks: Set<string> = item.pks || new Set()
            await manageDatas(pks)
            for(const [pk, v] of cd['deleted']) {
              pks.delete(pk)
              await deleteDoc(pk, v)
            }
            await movedDatas(pks)
          }
        }

      }

    }

    const initDocFromIDB = async (item: $DocItem) => {
      const idf = idef(item.def)
      const r: IDBrow = await idb.getDC(svc, org, item.def)
      if (r) try {
        const obj = decode(r.data)
        item.doc = await Registry.compile(svc, idf.cl, org, obj)
        item.lat = r.lat
        item.lv = r.v
      } catch (e) {
        console.error(e.toString)
      }
    }

    const initCollFromIDB = async (item: $CollItem) => {
      const idf = idef(item.def)
      const r: IDBrow = await idb.getDC(svc, org, item.def)
      if (r) try {
        const x = decode(r.data)
        item.pks = new Set(x)
        item.lat = r.lat
        item.lv = r.v
        const cl = idf.type === 2 ? idf.anxCl : idf.cl
        for(const pk of x) {
          const itemd = getItem(cl + '/' + pk, true)
          await initDocFromIDB(itemd)
        }
      } catch (e) {
        console.error(e.toString)
      }
    }

    const getItem = (def: string, create?: boolean) => {
      const idf = idef(def)
      const dc = idf.type === 1 ? docs : colls
      let item = dc[def]
      if (!item && create) {
        item = idf.type === 1 ? new $DCItem(def) : new $CollItem(def)
        dc[def] = item
      }
      return item
    }

    const addPerimeter = (p: $Perimeter) => {
      let state = 0
      for(const def of p.defs) {
        const item = getItem(def, true)
        item.addPerimeter(p.id)
        if (item.state < state) state = item.state
      }
      pstates[p.id] = state
    }

    return { 
      svc, org, subsOK,
      idef, getDCItem, getCollItem,
      onNotif,
      classes, collections, hasDocs, getDoc,
      storeDocColl,
      initCollFromIDB, initDocFromIDB,
      addPerimeter
    } as IDocStore
  })()
