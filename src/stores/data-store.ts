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
import { ref } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { isSameSet } from '../src-fw/util'
import { $Document, Registry } from '../src-fw/registry'
import { $Subs, versions } from '../src-fw/subscription'
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
  - $Subs ne dit rien l'état effectif des abonnements élémentaires.

  set$Subs() : enregistrement en phase 0 de la souscription d'une organisation
  get$Subs() : retourne un clone de la subscription enregistrée en vue d'édition
  getOrgs$Subs() : retourne la liste des organisations ayant une souscription

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
  doc: $Document // son objet document
  defs: Set<string> 
  /* le set des souscriptions qui incluent ce document:
  '0': par convention, souscription de la collection de la classe
  'pk': souscription au document pk
  'colName/colValue': souscription d'une sous-collection 
  */
}

export const useDataStore = defineStore('data', () => {

  return { 
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
