/* Module de gestion de "stores" de stockage BRUT de $Document.
UN "store" par couple (svc, org)
Stockage par clazz / pk : quand une classe n'a pas de document elle n'apparaît pas.

Voir: https://alexop.dev/tils/dynamic-pinia-stores/
*/

// @ts-ignore
import { reactive, computed } from 'vue'
// @ts-ignore
import { defineStore } from 'pinia'
import { $Document } from '../src-fw/registry'

export type IDocStore = {
  // Retourne la liste des classes ayant au moins un document ou []
  readonly classes: []

  // Retourne la liste des "pk" des documents stockés de cette classe
  pks(clazz: string): string[]

  // Retour ne true si la classe a des documents stockés
  hasDocs(clazz: string): boolean

  // Stocke un document selon sa classe et sa pk
  set(doc: $Document) : boolean

  // Retourne le document stocké ayant cette classe et cette pk ou undefined
  get(clazz: string, pk: string) : $Document

  //Supprime, le document, tous les documents de la classe, tout le store
  del(clazz?: string, pk?: string) : void
}

const stores = {}

/* Retourne le "store" dédié à ce service et cette organisation.
S'il n'existe pas le CREE vide (sauf si noforce  (optionel) est true)
*/
export const getStore = (svc: string, org: string, noforce?: boolean)
  : IDocStore => {
  const k = svc + '/' + org
  let st = stores[k]
  if (!st) {
    if (noforce) return undefined
    st = useStore(k)
    stores[k] = st
  }
  return st
}

export type CollItem = {
  def: string
  vloc: number // version de la collection détenue en store
  vidb: number // version détenue en IDB
  pks: Set<string> // Set des pk des documents de la collection
}

const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const docs = reactive({
    })

    /* Deux formes de collections selon leur def:
      0: Auteur : tous les auteurs
      2: Article/auteur/pkauteur : les messages dont l'auteur est pkauteur
      value: CollItem
    */
    const colls = reactive({
    })

    const collections: string[] = computed(() => Object.keys(colls))

    const getColl = (def: string) => {
      const e = colls[def]
      return e || undefined
    }

    const setColl = (def: string, v: number, pksp: Set<string>, pksm?: Set<string>) 
      : CollItem => {
      let item: CollItem = colls[def]
      if (item) {
        if (item.vloc >= v) return item
        item.vloc = v
        for(const pk of pksp) item.pks.add(pk)
        if (pksm) for(const pk of pksm) item.pks.delete(pk)
        return item
      } else {
        item = { def: def, vidb: 0, vloc: v, pks: pksp }
        colls[def] = item
        return item
      }
    }

    const setCollIDB = (def: string, v: number, pksp: Set<string>) 
      : CollItem => {
      let item: CollItem = colls[def]
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


    const classes: string[] = computed(() => Object.keys(docs))

    const pks = (clazz: string) => {
      const e = docs[clazz]
      return e ? Object.keys(e) : []
    }

    const hasDocs = (clazz: string): boolean => docs[clazz] ? true : false

    const set = (doc: $Document) : boolean => {
      if (!doc) return false
      const clazz = doc._clazz
      const pk = doc._pk
      let e = docs[clazz]
      if (!e) { 
        e = {}
        e[pk] = doc
        docs[clazz] = e 
        return true
      } else {
        const d = e[pk]
        if (!d || d.V < doc.v) { e[pk] = doc; return true }
        return false
      }
    }

    const get = (clazz: string, pk: string) : $Document => {
      const e = docs[clazz]
      return !e ? undefined : e[pk]
    }

    const del = (clazz?: string, pk?: string) => {
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
    return { classes, pks, hasDocs, set, get, del } as IDocStore
  })()
