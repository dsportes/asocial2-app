// @ts-ignore
import { ref, computed, reactive, Ref } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

import stores from './all'
import { SOA } from '../src-fw/registry'
import { resetDocStores } from '../stores/docs'
import { Crypt } from '../src-fw/crypt'
import { $t, sleep } from '../src-fw/util'
import { idb, IDB } from '../src-fw/idb'
import { myRegistration } from '../../src-pwa/register-service-worker'

// const encoder = new TextEncoder()
// const decoder = new TextDecoder()

export class SCcontext { // Contexte Safe / Cache
  creds: Object = {}
  prefs: Object = {}
  options = {
    orgs: [],
    roles: [],
    pref: ''
  }
  optionsB: any = { }

  get isOrgsEd () { return (this.srt(this.options.orgs).join('/') !== this.optionsB.orgs.join('/'))}
  get isRolesEd () { return (this.srt(this.options.roles).join('/') !== this.optionsB.roles.join('/'))}
  get isPrefEd () { return this.options.pref !== this.optionsB.pref}
  get isEd () { return this.isPrefEd || this.isOrgsEd || this.isRolesEd }
  
  soas: Map<string, SOA> = new Map()
  orgs: Set<string> = new Set()

  srt(x) { return x.sort((a, b) => a < b ? 1 : (a > b ? -1 : 0)) }

  // Chargement initial depuis Safe et / ou Cache et fusion des options
  async init () : Promise<SCcontext> {
    const session = stores.session
    const sf = stores.safe
    let optsC: any
    let optsS: any
    if (session.hasNet) {
      for(const [credId, c] of sf.mySafeCreds) 
        this.creds[credId] = c.toCred()
      for(const [id, x] of sf.mySafePrefs)
        this.prefs[id] = x // x: [time, obj]
      optsS = sf.mySafeOptions || {}
    }
    if (idb) {
      if (session.planeMode) 
        this.creds = await idb.getSingleton('creds')
      if (session.planeMode)
        this.prefs = await idb.getSingleton('prefs')
      optsC = await idb.getSingleton('options')
    }
    for(const credId in this.creds) {
      const c = this.creds[credId]
      const k = c.svc + '/' + c.org
      this.soas.set(k, { svc: c.svc, org: c.org })
      this.orgs.add(c.org)
    }

    const orgs = optsC && optsC.orgs ? optsC.orgs : (optsS && optsS.orgs || [])
    { const x1 = []; for(const o of orgs) x1.push(o); this.options.orgs = this.srt(x1) }

    this.options.roles = this.srt(optsC && optsC.roles ? optsC.roles : (optsS && optsS.roles || []))

    this.options.pref = optsC && optsC.pref ? optsC.pref : (optsS && optsS.pref || '')
    if (this.options.pref && !this.prefs[this.options.pref]) this.options.pref = ''
    this.optionsB.orgs = [ ...this.options.orgs]
    this.optionsB.roles = [ ...this.options.roles]
    this.optionsB.pref = this.options.pref

    return this
  }
}

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

  const scContext: Ref<SCcontext> = ref()
  const lstSOA: Ref<SOA[]> = ref()
  const currentSOA: Ref<SOA> = ref()

  const setStep = async (s: number) => { 
    const ui = stores.ui
    const sf = stores.safe
    const b = step.value
    switch (s) {
      case 0 : {
        ui.resetLoginPage()
        sf.resetSafe()
        if (b > 1) resetDocStores()
        if (b === 0) await sf.init0()
        else await sf.loadTrustings()
        step.value = s
        return
      }

      case 1 : { // authentification faite
        resetDocStores()
        if (hasLocal.value) {
          new IDB()
          await idb.open()
          const mt = sf.myTrusting
          if (mt) mt.addAppsDb()
        }
        const sc = new SCcontext()
        await sc.init()
        lstSOA.value = []
        for(const [,soa] of sc.soas) lstSOA.value.push(soa)
        currentSOA.value = lstSOA.value.length == 1 ? lstSOA.value[0] : { svc: '', org: '' }
        scContext.value = sc
        ui.loginPage.resetdb = false
        step.value = s
        return
      }

      case 2 : { // session ouverte
        ui.setPage('app')
        step.value = s
        return
      }
    }
  }

  /*
  const init0 = () => {
    step.value = 0
    noLocal.value = false
    noNet.value = false
  }
  */

  const pref = reactive({ code: '', time: 0, obj: null })
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
    lstSOA, currentSOA, scContext,

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
