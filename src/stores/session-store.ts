// @ts-ignore
import { ref, computed, reactive, Ref } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { getStore } from '../stores/docs'
import { resetDocStores } from '../stores/docs'
import { Crypt } from '../src-fw/crypt'
import { $t, sleep } from '../src-fw/util'
import { IDBsafe } from '../src-fw/idbsafe'
import { idb, IDB, Perims, Prefs, Options, StartPlane  } from '../src-fw/idb'
import { $Perimeter } from '../src-fw/documents'
import { myRegistration } from '../../src-pwa/register-service-worker'
import { AOperation } from 'src/src-fw/operation'

// const encoder = new TextEncoder()
// const decoder = new TextDecoder()

export const useSessionStore = defineStore('session', () => {

  /*
  0 : avant login
  1 : authentification faite
  2 : session en choix d'ouverture
  3 : session ouverte
  */
  const step: Ref<number> = ref(0)
  const noLocal = ref(false)
  const noNet = ref(false)

  const hasLocal = computed(() => !noLocal.value)
  const hasNet = computed(() => !noNet.value)
  const planeMode = computed(() => noNet.value && !noLocal.value )
  const syncMode = computed(() => !noNet.value && !noLocal.value )
  const incMode = computed(() => !noNet.value && noLocal.value )
  const loginMode = computed(() =>
    noLocal.value ? (noNet.value ? 4 : 2) : (noNet.value ? 3 : 1)
  )

  const perims: Ref<Perims> = ref()
  const prefs: Ref<Prefs> = ref()

  const pref: Ref<string> = ref()

  const orgRoles : Ref<Set<string>> = ref() // couples org/role
  const orgRolesP : Ref<Set<string>> = ref() // couples org/role "Potentiels"

  const setOrgRolesP = (perims: Perims) => {
    const s: Set<string> = new Set()
    for(const [so, m] of perims) {
      const org = so.substring(so.indexOf('/') + 1)
      for(const [,p] of m) s.add(org + '/' + p.role)
    }
    orgRolesP.value = s
  }

  const doStep1 = async (sf, ui) => {
    AOperation.reset()
    resetDocStores()
    if (hasLocal.value) {
      // Création si nécessaire de Cache
      new IDB()
      const mt = sf.myTrusting
      if (mt) await mt.addAppsDb()
    }
    if (sessionId.planeMode) {
      const sp: StartPlane = await idb.openPlane()
      prefs.value = sp.prefs
      perims.value = sp.perims
      setOrgRolesP(perims.value)
      orgRoles.value = new Set(sp.options.orgRoles || [])
      pref.value = sp.options.pref || ''
    } else {
      perims.value = sf.getPerimeters()
      setOrgRolesP(perims.value)
      prefs.value = sf.mySafePrefs
      const x = sf.mySafeOptions
      pref.value = x.pref || ''
      orgRoles.value = x.orgRoles || []
      if (sessionId.syncMode) {
        const opts = await idb.openSync()
        if (opts && opts.pref) pref.value = opts.pref
        if (opts && opts.orgRoles && opts.orgRoles.length)
          orgRoles.value = new Set(opts.orgRoles)
      }
    }
    ui.loginPage.resetdb = false
  }

  const doStep2 = async (sf, ui) => {
    const svcOrgs: Set<string> = new Set(perims.value.keys())
    for(const svcOrg of svcOrgs) {
      const i = svcOrg.indexOf('/')
      const svc = svcOrg.substring(0, i)
      const org = svcOrg.substring(i + 1 )
      const mperins = perims.value.get(svcOrg)
      const st = getStore(svc, org)
      
    }

  }

  const setStep = async (s: number, toPage?: string) => { 
    const ui = stores.ui
    const sf = stores.safe
    const b = step.value
    switch (s) {
      case 0 : {
        AOperation.reset()
        ui.resetLoginPage()
        sf.resetSafeBox()
        if (b > 1) resetDocStores()
        step.value = 0
        return
      }

      case 1 : // authentification faite
        await doStep1(sf, ui) // préparation pour permettre le choix des options
        if (!toPage) { step.value = 1; return }
        /* Sinon les options sont celles par défaut (sans choix)
        et on lance la session immédiatement sur la page souhaitée */

      case 2 : // ouverture effective de la session après les choix faits
        await doStep2(sf, ui) // initialisation des DocStore
        ui.setPage(toPage || 'app')
        step.value = 2
    }
  }

  const prefx = reactive({ code: '', time: 0, obj: null })
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
    prefx.code = code; prefx.time = time; prefx.obj = obj
  }

  // Gestion des opérations ************************************************
  const opEncours = ref('')
  const opEncoursName = ref('')
  const opDialog = ref(false)
  const opSpinner = ref(0)
  const opSignal = ref(false)
  let opTimer = 0
  let opTimer2 = 0

  function opCount () {
    if (opTimer) clearTimeout(opTimer)
    opTimer = setTimeout(() => {
      opSpinner.value += 2
      opCount()
    }, 2000)
  }

  function opStart (op: any) {
    opEncours.value = op
    opEncoursName.value = $t('op_' + op.opName)
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
    while (!myRegistration) {
      console.log('Waiting registration ...')
      await sleep(100)
    }
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
        } catch(e: any) {
          subJSON.value = '??? Souscription non obtenue - ' + e.message
          console.log('subJSON: ' + subJSON.value)
        }
      }
      registration.value.active.postMessage({ type: 'SETSTATE', location, APPNAME })
    } catch(e: any) {
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

  const orgs = reactive({ c: '', lst: [] })

  const setOrgs = (s: Set<string>) => {
    const s1 = new Set(orgs.lst)
    for(const o of s) s1.add(o)
    if (orgs.c) {
      s1.delete(orgs.c)
      orgs.lst = [orgs.c, ...Array.from(s1.values()).sort()]
    } else {
      orgs.lst = Array.from(s1.values()).sort()
      orgs.c = orgs.lst.length > 0 ? orgs.lst[0] : ''
    }
  }
  const addOrg = (org: string) => {
    orgs.c = org
    setOrgs(new Set([org]))
  }
  const currentOrg = computed(() => orgs.c || '')
  const setOrg = (org: string) => { orgs.c = org }

  const _currentSvc = ref()
  const currentSvc = computed(() => _currentSvc.value)
  const setSvc = (svc: string) => { _currentSvc.value = svc }

  return {
    step, setStep,
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    registration, setRegistration, setAppUpdated, subJSON, sessionId, wpReady, sessionInfo,
    callSW, swMessage, onSwMessage, newVersionDialog, newVersionReady,
    permState, permDialog, changePerm, askForPerm, permChange,

    hasNet, noNet, hasLocal, noLocal, planeMode, syncMode, incMode, loginMode,

    orgs, setOrgs, setOrg, addOrg, currentOrg,
    currentSvc, setSvc,
    edPref, setEdPref, updatePref,
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
