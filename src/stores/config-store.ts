// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import { fromByteArray, toByteArray } from '../src-fw/base64'
import { Crypt } from '../src-fw/crypt'
import { b64ToU8 } from '../src-fw/util'

export interface localeOption { value: string, label: string, flag: string }

/*
export function u8ToB64 (u8: Uint8Array, url?: boolean) : string {
  if (!u8) return ''
  const s = fromByteArray(u8)
  return !url ? s : s.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function b64ToU8 (b64: string) : Uint8Array {
  if (!b64) return null
  const diff = b64.length % 4
  let x = b64
  if (diff) {
    const pad = '===='.substring(0, 4 - diff)
    x = b64 + pad
  }
  return new Uint8Array(toByteArray(x.replace(/-/g, '+').replace(/_/g, '/')))
}
*/
type typeK ={
  localeOptions: localeOption[]
  vapidPublicKey: string
}

export const useConfigStore = defineStore('config', () => {
  const location = ref(window.location)

  // Gestion des langues ***************************************************
  const localeMap = new Map()
  const locale: Ref<string> = ref()
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  const K = ref()
  const initK = (k: any) => {
    K.value = k
    k.localeOptions.forEach(l => { localeMap.set(l.value, l) })
    locale.value = k.localeOptions[0].value
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

  function setRegistration(_registration) {
    registration.value = _registration
    // @ts-ignore
    const pm = _registration.pushManager
    if (!pm) {
      subJSON.value = '??? Souscription non obtenue - pushManager non accessible'
      return
    }
    pm.getSubscription()
    .then((sub: any) => {
      if (sub) {
        subJSON.value = JSON.stringify(sub)
        sessionId.value = Crypt.shaS(sub.endpoint)
      } else {
        const opt = { userVisibleOnly: true, applicationServerKey: b64ToU8(K.value.vapidPublicKey) }
        pm.subscribe(opt).then((nsub) => {
          subJSON.value = JSON.stringify(nsub)
          sessionId.value = Crypt.shaS(nsub.endpoint)
          console.log('subJSON: ' + subJSON.value.substring(0, 200))
        }).catch(e => {
          subJSON.value = '??? Souscription non obtenue - ' + e.message
          console.log('subJSON: ' + subJSON.value)
        })
      }
    }).catch(e => {
      subJSON.value = '??? Souscription non obtenue - ' + e.message
      console.log('subJSON: ' + subJSON.value)
    })
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
 
  function getHelpPages () : Set<string> {
    return new Set()
  }

  return {
    location, K, initK, locale, optionLocale, setLocale,
    getHelpPages,
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    registration, setRegistration, setAppUpdated, subJSON, sessionId,
    callSW, swMessage, onSwMessage, newVersionDialog, newVersionReady,
    permState, permDialog, changePerm, askForPerm, permChange
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
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
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