// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

// @ts-ignore
import { useDataStore } from '../stores/data-store.ts'

import { K } from '../app/constants'

// import { sleep } from '../app/util'

export const useConfigStore = defineStore('config', () => {
  // Gestion des langues
  const localeMap = new Map()
  K.localeOptions.forEach(l => { localeMap.set(l.value, l) })
  
  const locale: Ref<string> = ref(K.localeOptions[0].value)
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  // Gestion des stores
  const dataSt = computed(() => useDataStore())
  const $t = ref()

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

  let registration = null

  function setRegistration(_registration) {
    // await this.listenPerm()
    registration = _registration
    // if (this.permState === 'granted') await this.setSubscription()
    // console.log('SW ready. subJSON: ' + this.subJSON.substring(0, 200))
  }

  /*
  let subscription
  let subJSON
  async function subscribeWebPush () {
    const pm = registration.pushManager
    console.log('pushManager getSubscription')
    try {
      let subscription = await pm.getSubscription() // déjà faite
      if (!subscription) subscription = await pm.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToU8(this.vapid_public_key)
        })
      this.subJSON = JSON.stringify(subscription)
      console.log('subJSON: ' + this.subJSON.substring(0, 200))
    } catch (e) {
      console.log(e.toString())
      this.subJSON = '??? Souscription non obtenue - ' + e.message
    }
  }
  */

  const newVersionReady = ref(false)
  const newVersionDialog = ref(false)
  function setAppUpdated () {
    newVersionReady.value = true
    newVersionDialog.value = true
  }

  function callSW (data: any) {
    // while (!this.registration) await sleep(1000)
    if (registration) registration.active.postMessage(data)
  }

  let notificationPerm = null
  const permState = ref('') // granted denied prompt

  /*
  async function getPerm () {
    if (!notificationPerm)
      notificationPerm = await navigator.permissions.query({ name: 'notifications' })
    const p = notificationPerm.state
    if (p !== permState.value) permState.value = p
  }
  */

  async function requestPermission () {
    permState.value = await Notification.requestPermission()
    console.log('permState : ', permState.value)
  }

  async function listenPerm () {
    if (!notificationPerm)
      notificationPerm = await navigator.permissions.query({ name: 'notifications' })
    notificationPerm.onchange = async () => {
      const p = notificationPerm.state
      console.log("User decided to change his settings. New permission: " + p)
      if (p !== permState.value) permState.value = p
    }
    await requestPermission()
    return permState.value
  }

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

  const swMessage = ref(null)

  function onSwMessage (m: any) {
    swMessage.value = m
  }

  function getHelpPages () : Set<string> {
    return new Set()
  }

  return {
    $t,
    locale, optionLocale, setLocale,
    dataSt,
    getHelpPages,
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    setRegistration, callSW, swMessage, onSwMessage, setAppUpdated, newVersionDialog, newVersionReady,
    listenPerm, requestPermission, permState,
    focus, getFocus, lostFocus, closingApp
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
