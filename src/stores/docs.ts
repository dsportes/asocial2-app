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
  set(clazz: string, pk: string, doc: $Document) : void

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

const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const docs = reactive({
    })

    const classes: string[] = computed(() => Object.keys(docs))

    const pks = (clazz: string) => {
      const e = docs[clazz]
      return e ? Object.keys(e) : []
    }

    const hasDocs = (clazz: string): boolean => docs[clazz] ? true : false

    const set = (clazz: string, pk: string, doc: $Document) : void => {
      let e = docs[clazz]
      if (!e) { e = {} ; docs[clazz] = e }
      e[pk] = doc
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
