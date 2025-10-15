// @ts-ignore
import { ref } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import { toByteArray } from '../src-fw/base64'
import { Crypt } from '../src-fw/crypt'

export enum modes { SYNC, INCOGNITO, PLANE }

export const useSessionStore = defineStore('session', () => {
  function b64ToU8 (b64: string) : Uint8Array {
    if (!b64) return null
    const diff = b64.length % 4
    let x = b64
    if (diff) {
      const pad = '===='.substring(0, 4 - diff)
      x = b64 + pad
    }
    return new Uint8Array(toByteArray(x.replace(/-/g, '+').replace(/_/g, '/')))
  }
  
  // Gestion des opérations ************************************************
  const opEncours = ref('')
  const opDialog = ref(false)
  const opSpinner = ref(0)
  const opSignal = ref(false)
  let opTimer = null
  let opTimer2 = null

  function opCount () {
    if (opTimer) clearTimeout(opTimer)
    opTimer = setTimeout(() => {
      opSpinner.value += 2
      opCount()
    }, 2000)
  }

  function opStart (op: any) {
    opEncours.value = op
    opSpinner.value = 0
    opSignal.value = true
    opDialog.value = true
    opCount()
    if (opTimer2) clearTimeout(opTimer2)
  }

  function opEnd () {
    if (opTimer) clearTimeout(opTimer)
    opEncours.value = null
    opSpinner.value = 0
    opDialog.value = false
    opTimer2 = setTimeout(() => { opSignal.value = false }, 1000)
  }

  // Gestion du SW ******************************************************
  const registration = ref(null)
  const newVersionReady = ref(false)
  const newVersionDialog = ref(false)
  const subJSON = ref('')
  const sessionId = ref('')

  function saveRegistration (_registration) {
    registration.value = _registration
  }

  async function setRegistration (vapidPK) {
    // @ts-ignore
    const pm = registration.value.pushManager
    if (!pm) {
      subJSON.value = '??? Souscription non obtenue - pushManager non accessible'
      return
    }
    try {
      const sub = await pm.getSubscription()
      if (sub) {
        subJSON.value = JSON.stringify(sub)
        sessionId.value = Crypt.shaS(sub.endpoint)
      } else {
        const opt = { userVisibleOnly: true, applicationServerKey: b64ToU8(vapidPK) }
        try {
          const nsub = pm.subscribe(opt)
          subJSON.value = JSON.stringify(nsub)
          sessionId.value = Crypt.shaS(nsub.endpoint)
          console.log('subJSON: ' + subJSON.value.substring(0, 200))
        } catch(e) {
          subJSON.value = '??? Souscription non obtenue - ' + e.message
          console.log('subJSON: ' + subJSON.value)
        }
      }
    } catch(e) {
      subJSON.value = '??? Souscription non obtenue - ' + e.message
      console.log('subJSON: ' + subJSON.value)
    }
  }

  function setAppUpdated () {
    newVersionReady.value = true
    newVersionDialog.value = true
  }

  const swMessage = ref(null)

  function onSwMessage (m: any) {
    swMessage.value = m
  }

  function callSW (data: any) {
    if (registration.value) registration.value.active.postMessage(data)
  }

  // Gestion des permissions *********************************************
  const permState = ref('') // granted denied prompt
  const permDialog = ref(false)
  const permChange = ref(false)

  // La permission de notification avait été accordée.
  // le service-worker est enregistré.
  // Si elle l'est toujours, rien ne change
  // Sinon il faut informer l'utilisateur et SORTIR ou RECHARGER l'application.

  function changePerm (p: string) {
    permState.value = p
    if (p === 'granted') {
      permDialog.value = false
      permChange.value = false
    } else {
      permDialog.value = true
      permChange.value = true
    }
  }

  function askForPerm (p: string) {
    permState.value = p
    permDialog.value = true
  }

  const dbName = ref()
  const setDbName = (name: string) => { dbName.value = name }

  const mode = ref(modes.SYNC)
  const setMode = (m: modes) => { mode.value = m }
  const hasIDB = () => mode.value === modes.SYNC || mode.value === modes.INCOGNITO
  const hasNet = () => mode.value !== modes.PLANE

  const phase: Ref<number> = ref(0)
  // 0 : session en phase d'initialisation
  // 1 : session running (initialisée)
  const setPhase = (p: number) => { phase.value = p}

  return {  
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    registration, saveRegistration, setRegistration, setAppUpdated, subJSON, sessionId,
    callSW, swMessage, onSwMessage, newVersionDialog, newVersionReady,
    permState, permDialog, changePerm, askForPerm, permChange,
    dbName, setDbName, phase, setPhase, mode, setMode, hasIDB, hasNet
    // focus, getFocus, lostFocus, closingApp
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
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot));
}

/*
 const focus = ref(true)

  function getFocus () {
    focus.value = true
    callSW({ type: 'FOCUS', arg: true})
  }

  function lostFocus () {
    focus.value = false
    callSW({ type: 'FOCUS', arg: false})
  }

  function closingApp () {
    callSW({ type: 'CLOSING'})
  }
*/