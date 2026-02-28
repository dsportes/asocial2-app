// @ts-ignore
import { ref, computed, reactive, Ref } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { Crypt } from '../src-fw/crypt'
import { myRegistration } from '../../src-pwa/register-service-worker'


type StartContext = {
  userId: string
  pseudo: string
  profId: string
  profAboutStr: string
  incognito: boolean
  prefs: Uint8Array,
  creds: Map<string, Object>
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const useSessionStore = defineStore('session', () => {

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
  const wpReady = computed(() => permState.value === 'granted' && registration.value && sessionId.value)
  const sessionInfo = computed(() => subJSON.value.startsWith('???') ? subJSON.value : sessionId.value)

  async function setRegistration (applicationServerKey: Uint8Array, location: string, APPNAME: string) {
    registration.value = myRegistration
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
        const opt = { userVisibleOnly: true, applicationServerKey }
        try {
          const nsub = await pm.subscribe(opt)
          subJSON.value = JSON.stringify(nsub)
          sessionId.value = Crypt.shaS(nsub.endpoint)
          console.log('subJSON: ' + subJSON.value.substring(0, 200))
        } catch(e) {
          subJSON.value = '??? Souscription non obtenue - ' + e.message
          console.log('subJSON: ' + subJSON.value)
        }
      }
      registration.value.active.postMessage({ type: 'SETSTATE', location, APPNAME })
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

  const incognito = ref(false)
  const noNet = ref(false)
  const hasNet = computed(() => !noNet.value)
  const dbName = ref('')
  const setDbName = (name: string) => { dbName.value = name }
  const hasIDB = computed(() => dbName.value !== '')

  const phase: Ref<number> = ref(0)
  // 0 : session en phase d'initialisation
  // 1 : session running (initialisée)
  const setPhase = (p: number) => { phase.value = p}

  const pref = reactive({code:'', time: 0, obj: {}})
  const edPref = reactive({code:'', time: 0, obj: {}, orig: {}, diag: '', chg: false})
  const setEdPref = (code: string, time: number, obj: Object) => {
    edPref.code = code
    edPref.time = time
    edPref.obj = obj
    edPref.orig = decode(encode(obj))
    edPref.chg = false
    edPref.diag = ''
  }
  const updatePref = (code: string, time: number, obj: Object) => {
    pref.code = code; pref.time = time; pref.obj = obj
  }

  const currentOrg = ref('')
  const _userId: Ref<string> = ref('')
  const userId = computed(() => _userId.value)
  const _aboutProfile: Ref<string> = ref('')
  const aboutProfile = computed(() => _aboutProfile.value)
  const _creds: Ref<Map<string, Credential>> = null
  const creds = computed(() => _creds.value)
  const svcOrgs = ref(new Set())
  const $OP = ref('')
  const SVC = ref('')
  const org = ref('')

  const setStartContext = (
      userId: string,
      aboutProfile: string,
      creds: Map<string, Credential>) => {
    setPhase(0)
    _userId.value = userId
    _aboutProfile.value = aboutProfile
    _creds.value = creds
    $OP.value =''
    SVC.value = ''
    org.value = ''
    svcOrgs .clear()
    for(const [,c] of _creds.value) svcOrgs.value.add(c.svc + '/' + c.org)
    stores.ui.setPage('app')
  }

  const endSession = () => {
    _userId.value = ''
    _aboutProfile.value = ''
    _creds.value = null
    svcOrgs .clear()
    $OP.value =''
    SVC.value = ''
    org.value = ''
  }

  return {
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    registration, setRegistration, setAppUpdated, subJSON, sessionId, wpReady, sessionInfo,
    callSW, swMessage, onSwMessage, newVersionDialog, newVersionReady,
    permState, permDialog, changePerm, askForPerm, permChange,
    dbName, setDbName, phase, setPhase,
    hasIDB, hasNet, noNet, incognito,
    pref, edPref, setEdPref, updatePref,
    userId, currentOrg, aboutProfile, creds, setStartContext, endSession,
    SVC, $OP, org, svcOrgs
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
