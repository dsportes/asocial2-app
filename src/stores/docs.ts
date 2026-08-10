/* Module de gestion de "dsStores" de stockage BRUT de $Document.
UN "store" par couple (svc, org)
Stockage par clazz / pk : quand une classe n'a pas de document elle n'apparaît pas.

Voir: https://alexop.dev/tils/dynamic-pinia-dsStores/
*/

// @ts-ignore
import { reactive, computed } from 'vue'
// @ts-ignore
import { defineStore } from 'pinia'
// @ts-ignore
import { decode } from '@msgpack/msgpack'
import { useSessionStore } from '../stores/session-store'
import { $Document, Registry } from '../src-fw/registry'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { AppExc } from '../src-fw/log'

// Si IDB a une lat plus ancienne il faut rafraîchir sa lat
const MAXLATDELAY = 3 * 3600 * 1000

export type IDocStore = {
  // Retourne la liste des classes ayant au moins un document ou []
  readonly classes: []

  storeCollData (def: string, incr: boolean, sat: number, 
    v: number, datas: Uint8Array[]) : Promise<void>

  // Retourne la liste des "pk" des documents stockés de cette classe
  pks (clazz: string): string[]

  // Retour ne true si la classe a des documents stockés
  hasDocs (clazz: string): boolean

  // Stocke un document selon sa classe et sa pk
  setDoc (def: string, sat: number, v: number, data: Uint8Array, doc: $Document) : Promise<$DocItem>

  // Retourne le document stocké ayant cette classe et cette pk ou undefined
  getDoc (clazz: string, pk: string) : $DocItem

  //Supprime, le document, tous les documents de la classe, tout le store
  delDoc (clazz?: string, pk?: string) : void

  setColl (def: string, sat: number, v: number, pksp: Set<string>, pksm?: Set<string>) : Promise<$CollItem>
  setCollFromIDB (def: string, v: number, pksp: Set<string>) : Promise<void>

  setDocIDB (def: string, lat: number, v: number, data: Uint8Array) : Promise<void>
  updLatIDB (def: string, lat: number, v: number) : Promise<void>
  setCollIDB (def: string, lat: number, v: number, pks: string[]) : Promise<void>
  updCollLatIDB (def: string, lat: number, v: number) : Promise<void>
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

const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const svc = id.substring(0, id.indexOf('/'))
    const org = id.substring(id.indexOf('/') + 1)
    const session = useSessionStore()

    const hasIDB = () : boolean => { 
      return session.hasIDB }
    
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

    const docs = reactive({
    })

    /* Deux formes de collections selon leur def:
      0: Auteur : tous les auteurs
      2: Article/auteur/pkauteur : les messages dont l'auteur est pkauteur
      value: CollItem
    */
    const colls = reactive({
    })

    const classes: string[] = computed(() => Object.keys(docs))
    const collections: string[] = computed(() => Object.keys(colls))

    const storeCollData = async (def: string, incr: boolean, sat: number, 
      v: number, datas: Uint8Array[]) : Promise<void> => {

      async function comp (v: number) : Promise<[$Document, Uint8Array]> {
        let doc: $Document = null
        if (datas.length)
          try {
            doc = await Registry.compile(svc, idf.cl, org, decode(datas[0]))
            return [doc, datas[0]]
          } catch (e) {
            throw new AppExc(3, 'not_compilable_document', 'storeCollData',
              [org, svc, idf.cl, idf.pk, e.message]
            )
          }
        else {
          doc = Registry.buildZombi(svc, idf.cl, org, v, idf.pk)
          return [doc, null]
        }
      }

      async function majIDB (item: $DCItem, data: Uint8Array) {
        if (!hasIDB()) return
        /* Store en IDB:
        a) si version plus récente
        b) ou si identique et que lat est "bien inférieure à" sat */
        if (item.lv !== v) {
          item.lv = v
          item.lat = sat
          await setDocIDB(def, sat, v, data)
        } else if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
          item.lat = sat
          await updLatIDB(def, sat, v)
        }
      }

      const idf = idef(def)
      // let item: $DCItem
      if (idf.type === 1) {
        let item = docs[def] as $DocItem
        if (item && item.sv > v) return // données en store plus récente
        if (item) { // données plus récentes ou de même version
          let [doc, data] = await comp(v) // peut être zombi
          if (!incr) {
            // si doc.deleted c'est une suppression
            item.sv = v
            item.sat = sat
            item.doc = doc
            majIDB(item, data)
          } else {

          }
            item.doc = doc
            upd = true
            if (hasIDB()) {
              /* Store en IDB:
              a) si version plus récente
              b) ou si identique et que lat est "bien inférieure à" sat */
              if (item.lv !== v) {
                item.lv = v
                item.lat = sat
                await setDocIDB(def, sat, v, data)
              } else if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
                item.lat = sat
                await updLatIDB(def, sat, v)
              }
            }
          } else if (hasIDB() && sat - item.lat > MAXLATDELAY) { // même version MAIS MAJ IDB si lat trop ancienne
            item.lat = sat
            await updLatIDB(def, sat, v)
          }
        } else {

        }
      } else {
        item = colls[def] as $CollItem

      }

    }

    const getColl = (def: string) : $CollItem => {
      const e = colls[def]
      return e || undefined
    }

    const setColl = async (def: string, sat: number, v: number, pksp: Set<string>, pksm?: Set<string>) 
      : Promise<$CollItem> => {
      let item: $CollItem = colls[def]
      if (item) {
        if (item.sv >= v) return item
        item.sv = v
        item.sat = sat
        for(const pk of pksp) item.pks.add(pk)
        if (pksm) for(const pk of pksm) item.pks.delete(pk)
        if (hasIDB()) {
          if (item.lv !== v) {
            item.lv = v
            item.lat = sat
            await setCollIDB(def, sat, v, Array.from(item.pks))
          } else if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
            item.lat = sat
            await updCollLatIDB(def, sat, v)
          }
        }
        return item
      } else {
        item = { def: def, sat: sat, sv: v, lat: 0, lv: 0, pks: pksp }
        colls[def] = item
        if (hasIDB()) {
            item.lv = v
            item.lat = sat
            await setCollIDB(def, sat, v, Array.from(item.pks))
        }
      }
      return item
    }

    const setCollFromIDB = async (def: string, v: number, pksp: Set<string>) 
      : Promise<$CollItem> => {
      let item: $CollItem = colls[def]
      if (item) {
        /* La version IDB ne peut plus être chargée quand la collection
        a été chargée depuis le service */
        if (item.vloc) {
          if (item.vidb < v) item.vidb = v
          return item
        }
        if (item.vidb >= v) return item
      } else item = { def: def, vloc: 0, vidb: 0, pks: null }
      item.vidb = v
      item.pks = pksp
      return item
    }


    

    const pks = (clazz: string) => {
      const e = docs[clazz]
      return e ? Object.keys(e) : []
    }

    const hasDocs = (clazz: string): boolean => docs[clazz] ? true : false



    const setDoc = async (def: string, sat: number, v: number, data: Uint8Array, doc: $Document) 
    : Promise<boolean> => {
      let upd = false
      if (!doc) {
        return false
      } else {
        const clazz = doc._clazz
        const pk = doc._pk
        let item = docs[clazz] as $DocItem
        if (!item) { 
          item = { def: def, sat: sat, sv: v, lv: 0, lat: sat, doc: doc }
          docs[clazz] = item 
          /* Normalement c'est utile, en IDB a minima lat peut être avancée */
          if (hasIDB()) {
            item.lv = v
            item.lat = sat
            await setDocIDB(def, sat, v, data)
          }
          upd = true
        } else {
          if (!item.doc || item.sv < v) { 
            item.doc = doc
            upd = true
            if (hasIDB()) {
              /* Store en IDB:
              a) si version plus récente
              b) ou si identique et que lat est "bien inférieure à" sat */
              if (item.lv !== v) {
                item.lv = v
                item.lat = sat
                await setDocIDB(def, sat, v, data)
              } else if (sat - item.lat > MAXLATDELAY) { // MAJ IDB si lat trop ancienne
                item.lat = sat
                await updLatIDB(def, sat, v)
              }
            }
          } else if (hasIDB() && sat - item.lat > MAXLATDELAY) { // même version MAIS MAJ IDB si lat trop ancienne
            item.lat = sat
            await updLatIDB(def, sat, v)
          }
        }
      }
      return upd
    }

    const getDoc = (clazz: string, pk: string) : $DocItem => {
      const e = docs[clazz]
      return !e ? undefined : e[pk]
    }

    const delDoc = (clazz?: string, pk?: string) => {
      if (pk) {
        const e = docs[clazz]
        if (e) {
          delete e[pk]
          if (Object.keys(e).length === 0) delete docs[clazz]
        } else if (clazz) {
          delete docs[clazz]
        } else {
          for(let cl in docs)
            delete docs[cl]
        }
      }
    }

    const setDocIDB = async (def: string, lat: number, v: number, data: Uint8Array) => {
      // TODO
    }

    const updLatIDB = async (def: string, lat: number, v: number) => {
      // TODO
    }

    const setCollIDB = async (def: string, lat: number, v: number, pks: string[]) => {
      // TODO
    }
  
    const updCollLatIDB = async (def: string, lat: number, v: number) => {
      // TODO
    }

    return { svc, org, classes, pks, hasDocs, setDoc, getDoc, delDoc, setColl, setCollFromIDB } as IDocStore
  })()
