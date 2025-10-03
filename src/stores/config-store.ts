// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useDataStore } from '../stores/data-store'
import { Crypt } from '../app/crypt'

import { K } from '../app/constants'
import { b64ToU8 } from '../app/util'

export const useConfigStore = defineStore('config', () => {
  const location = window.location

  // Gestion des langues ***************************************************
  const localeMap = new Map()
  K.localeOptions.forEach(l => { localeMap.set(l.value, l) })
  
  const locale: Ref<string> = ref(K.localeOptions[0].value)
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  // Gestion des stores ***************************************************
  const dataSt = computed(() => useDataStore())
  const $t = ref()

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

  function opStart (op) {
    opEncours.value = op
    opSpinner.value = 0
    opSignal.value = true
    opDialog.value = true
    opCount()
    if (opTimer2) clearTimeout(opTimer2)
  }

  function opEnd () {
    if (opTimer) clearTimeout(opTimer)
    opEncours.value = ''
    opSpinner.value = 0
    opDialog.value = false
    opTimer2 = setTimeout(() => { opSignal.value = false }, 1000)
  }

  // Gestion du SW ******************************************************
  const registration = ref(null)
  const newVersionReady = ref(false)
  const newVersionDialog = ref(false)
  const subJSON = ref('')
  const hashSub = ref('')

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
        hashSub.value = Crypt.shaS(sub.endpoint)
      } else {
        const opt = { userVisibleOnly: true, applicationServerKey: b64ToU8(K.vapidPublicKey) }
        pm.subscribe(opt).then((nsub) => {
          subJSON.value = JSON.stringify(nsub)
          hashSub.value = Crypt.shaS(nsub.endpoint)
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

  /* La permission de notification avait été accordée.
  Le service-worker est enregistré.
  Si elle l'est toujours, rien ne change
  Sinon il faut informer l'utilisateur et SORTIR ou RECHARGER l'application.
  */
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

  function getHelpPages () : Set<string> {
    return new Set()
  }

  return {
    $t,
    locale, optionLocale, setLocale,
    dataSt,
    getHelpPages,
    location,
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    registration, setRegistration, setAppUpdated, subJSON, hashSub,
    callSW, swMessage, onSwMessage, newVersionDialog, newVersionReady,
    permState, permDialog, changePerm, askForPerm, permChange,
    // focus, getFocus, lostFocus, closingApp
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
