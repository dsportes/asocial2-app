/* Module de gestion de "dsStores" de stockage BRUT de $Document.
UN "store" par couple (svc, org)
Stockage par clazz / pk : quand une classe n'a pas de document elle n'apparaît pas.

Voir: https://alexop.dev/tils/dynamic-pinia-dsStores/
*/

// @ts-ignore
import { reactive } from 'vue'
// @ts-ignore
import { defineStore } from 'pinia'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { useSessionStore } from '../stores/session-store'
import { useSafeStore } from '../stores/safe-store'
import { $Document, Registry } from '../src-fw/registry'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { $DCData } from 'src/src-fw/subscription'
import { AppExc } from '../src-fw/log'

// Si IDB a une lat plus ancienne il faut rafraîchir sa lat
const MAXLATDELAY = 3 * 3600 * 1000

export type IDocStore = {
  readonly svc
  readonly org
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

  initDocFromIDB (def: string) : Promise<$DocItem>
  initCollFromIDB (def: string) : Promise<$CollItem>

  getRowIDB (def: string) : Promise<IDBrow>
  setDataIDB (def: string, idbrow: IDBrow) : Promise<void>
  updLatIDB (def: string, idbrow: IDBrow) : Promise<void>
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

export interface $DCItem {
  def: string
  /* sat : service assert time. Le service affirme la collection 
  avait bien cette valeur à la date-heure sat */
  sat: number 
  sv: number // version de la collection détenue en store (et en service)
  lat: number // En IDB, la valeur est assertée à lat
  lv: number // version locale détenue en IDB
}

export interface $CollItem extends $DCItem {
  pks: Set<string> // Set des pk des documents de la collection
}

export interface $DocItem extends $DCItem {
  doc: $Document // Document compilé
}

type row = {
  _pk: string
  v: number
}

const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const svc = id.substring(0, id.indexOf('/'))
    const org = id.substring(id.indexOf('/') + 1)
    const session = useSessionStore()
    const hasIDB = session.hasIDB
    const hasNet = session.hasNet
    const sf = useSafeStore()

    const docs = reactive({  })

    const getDCItem = (def: string) : $DCItem => docs[def]

    const getDoc = (cl: string, pk: string) : $Document => {
      const item = docs[cl + '/' + pk]
      return item ? item.doc : null
    }

    /* Deux formes de collections selon leur def:
      0: Auteur : tous les auteurs
      2: Article/auteur/pkauteur : les messages dont l'auteur est pkauteur
      value: CollItem
    */
    const colls = reactive({  })

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
          await setDataIDB(def, { lat: sat, v: cd.v, data })
        } else await setLatIDB(item)
      }

      async function setLatIDB (item: $DCItem) {
        if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
          item.lat = sat
          await updLatIDB(def, { lat: sat, v: cd.v })
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
        const defd = doc._clazz + '/' + doc._pk
        let itemd = docs[defd] as $DocItem
        // Si itemd n'existait pas on EN CREE UN
        if (!itemd) {
          itemd = { def: defd, sat, lat: 0, sv: row.v, lv: 0, doc }
          docs[def] = itemd
        } else {
          itemd.sat = sat
          itemd.sv = row.v
          itemd.doc = doc
        }
        if (hasIDB) await setIDB(itemd, data)
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

      } else { // Colections

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
              item = { def, sat, lat: sat, sv: cd.v, lv: cd.v, pks }
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

    const initDocFromIDB = async (def: string) : Promise<$DocItem> => {
      const idf = idef(def)
      const r: IDBrow = await getRowIDB(def)
      if (!r) return null
      let item: $DocItem = colls[def]
      if (item) return item
      item = { def, sat: r.lat, sv: r.v, lat: r.lat, lv: r.v, doc: null}
      try {
        const obj = decode(r.data)
        const doc = await Registry.compile(svc, idf.cl, org, obj)
        return item
      } catch (e) {
        console.error(e.toString)
        return null
      }
    }

    const initCollFromIDB = async (def: string) : Promise<$CollItem> => {
      const idf = idef(def)
      const r: IDBrow = await getRowIDB(def)
      if (!r) return null
      let item: $CollItem = colls[def]
      if (item) return item
      item = { def, sat: r.lat, sv: r.v, lat: r.lat, lv: r.v, pks: null}
      try {
        const x = decode(r.data)
        item.pks = new Set(x)
        const cl = idf.type === 2 ? idf.anxCl : idf.cl
        for(const pk of x)
          await initDocFromIDB(cl + '/' + pk)
        return item
      } catch (e) {
        console.error(e.toString)
        return null
      }
    }

    const getRowIDB = async (def: string) : Promise<IDBrow> => {
      // TODO
      return null
    }
    const setDataIDB = async (def: string, idbrow: IDBrow) : Promise<void> => {
      // TODO
    }
    const updLatIDB = async (def: string, idbrow: IDBrow) : Promise<void> => {
      // TODO idbrow. data est absent et ignoré
    }

    return { 
      svc, org, idef, getDCItem, getCollItem,
      classes, collections, hasDocs, getDoc,
      storeDocColl,
      initCollFromIDB, initDocFromIDB,
      getRowIDB, setDataIDB, updLatIDB
    } as IDocStore
  })()
