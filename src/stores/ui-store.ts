// @ts-ignore
import { ref, computed, reactive } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import { setCssVar } from 'quasar'

import { hasPage } from '../src-fw/help'
import { useConfigStore } from '../stores/config-store'
import { useSessionStore } from '../stores/session-store'

const large = 900
const HOME = 'safeHome'

export type SOA = {
   svc: string
   org: string
   admin: boolean
}

export const useUiStore = defineStore('ui', () => {
  const $t = ref()
  const $q = ref()
  const set$t$q = (t, q) => {
    $t.value = t
    $q.value = q
  }

  const isDark = computed(() => $q.value.dark.isActive)

  const setDark = (dark: boolean) => {
    const d = isDark.value
    if ((d && dark) || (!d && !dark)) return
    $q.value.dark.set(dark)
    const t = useConfigStore().K.theme
    for(const c in t) setCssVar(c, t[c][dark ? 0 : 1])
  }

  const leftMenu = ref(false)
  const closeMenu = () => {
    leftMenu.value = false}
  const openMenu = () => {
    leftMenu.value = true}

  // Screen
  const portrait = ref(true)
  const screenHeight = ref(0)
  const screenWidth = ref(0)
  const isShort = ref(true)

  const setScreenWH = (w: number, h: number) => {
    portrait.value = w < h
    screenHeight.value = h
    const et = w < large
    if (screenWidth.value === 0) {
      screenWidth.value = w
      isShort.value = et
    } else {
      if (et !== isShort.value) isShort.value = et
    }
    // console.log(screenWidth.value, screenHeight.value)
  }

  // Saisie en mode password ou text
  const visibility = ref(true)

  // ********************************************

  // Gestion de l'affichage des exceptions
  const exc = reactive({
    resolve: null,
    ex: null
  })
  const displayExc = async (e: any) => {
    if (appDialogs.DialogExc) return
    appDialogs.DialogExc = true
    return new Promise((resolve) => {
      exc.ex = e
      exc.resolve = resolve
    })
  }
  const hideExc = () => {
    appDialogs.DialogExc = false
    const f = exc.resolve
    exc.ex = null
    exc.resolve= null
    if (f) f()
  }

  // Gestion d'un dialogue avec confirmation
  const diag = reactive({
    txt: '',
    token: 0,
    cf: -1,
    resolve: null
  })
  const diagDisplay = async (txt: string, nbsec?: number | boolean) => {
    return new Promise((resolve) => {
      diag.token = Date.now()
      diag.cf = nbsec === true || nbsec === undefined ? -1 : (nbsec || 0)
      diag.txt = txt
      diag.resolve = resolve
      appDialogs.GotIt = true
    })
  }

  const openHelp = (page: string) => {
    if (hasPage(page)) {
      $q.value.dialog({
        // title: 'Alert',
        message: $t.value('HLPaidebd', [page]),
        ok: { label: $t.value('gotit'), flat:true, color: "primary" }
      }).onOk(() => { }).onCancel(() => { }).onDismiss(() => { })
    } else {
      pushhelp(page)
      // console.log('Ouverture page aide ', page)
    }
  }

  const helpstack = ref([])

  const fermerHelp = () => {
    appDialogs.DialogHelp = false
    helpstack.value.length = 0
  }

  const pushhelp = (page) => {
    if (helpstack.value.length === 0) appDialogs.DialogHelp = true
    helpstack.value.push(page)
  }

  const pophelp = () => {
    if (helpstack.value.length === 1) fermerHelp
    else helpstack.value.splice(helpstack.value.length - 1, 1)
  }

  const editing = reactive({
    flag: false,
    resolve: null
  })

  const resolveEditing = (b: boolean) => {
    appDialogs.ConfirmClose = false
    if (b) resetEditing()
    const f = editing.resolve
    if (f) f(b)
  }
  const setEditing = () => { 
    editing.flag = true }
  const resetEditing = () => { 
    editing.flag = false }
  const editingInCourse = computed(() => editing.flag )

  const mayClose = async () => {
    if (!editing.flag) return true
    return new Promise((resolve) => {
      editing.resolve = resolve
      appDialogs.ConfirmClose = true
    })
  }

  // Gestion des pages
  const page = ref(HOME)

  const setPage = (p: string) => {
    if (editing.flag) {
      setTimeout(async () => {
        const b = await mayClose()
        if (b) setPage(p)
      })
      return
    }
    page.value = ''
    setTimeout(() => {
      page.value = p
      if (p === 'app') openMenu()
    }, 350)
  }

  // dialogues permanents rattachés à App.vue
  const appDialogs = reactive({
    ConfirmQuit: false,
    ConfirmClose: false,
    ConfirmCloseSession: false,
    DialogExc: false,
    DialogHelp: false,
    GotIt: false
  })

  const confirmQuit = () => { appDialogs.ConfirmQuit = true }

  const sessionClose = () => {
    appDialogs.ConfirmCloseSession = true
  }

  const cfSessionClose = () => {
    appDialogs.ConfirmCloseSession = false
    resetEditing()
    backToLogin()
  }

  const backToLogin = () => {
    page.value = ''
    setTimeout(() => {
      page.value = HOME
      useSessionStore().setStep(0)
    }, 50)
  }

  const adminPage = reactive({
    tab: 'sites', // orgs
    site: '',
    org: '',
    svc: '',
    pingop: '',
    pingst: '',
    mdAdmin: false
  })

  const resetAdminPage = (isAdmin: boolean) => {
    adminPage.site = ''
    adminPage.org = ''
    adminPage.org = ''
    adminPage.pingop = ''
    adminPage.pingst = ''
    adminPage.mdAdmin = isAdmin
    return adminPage
  }
  
  const navBar = reactive({
    hasback: false,
    idx: 0,
    nb: 0,
    fnnav: null
  })

  const loginPage = reactive({
    tab: 'login' // guest
  })
  const resetLoginPage = () => {
    loginPage.tab = 'login'
  }

  const currentForm = reactive({
    soa: { svc: '', org: '', admin: false },
    asAdmin: false,
    pft: new Set(), // possible form types
    zoomed: false,
    increation: false,
    form: null,
    fnOnUpdate: null
  })

  const currentEvent = reactive({
    zoomed: false,
    event: null,
    form: null,
    fnOnUpdate: null
  })

  const emojiIndex = ref()
  const setEmoji = (idx) => {
    emojiIndex.value = idx
    return idx
  }

  const _idc = ref(1)
  const idc = () => _idc.value++

  const demandsPageInit = ref(0)

  return {
    idc,
    set$t$q, setDark, isDark, $q, visibility,
    openMenu, closeMenu, leftMenu,
    setScreenWH, portrait, screenHeight, screenWidth, isShort,
    appDialogs, confirmQuit,
    exc, displayExc, hideExc,
    diag, diagDisplay,
    openHelp, helpstack, fermerHelp, pushhelp, pophelp,
    page, setPage, backToLogin,
    setEditing, resetEditing, resolveEditing, editingInCourse, mayClose,
    currentEvent, navBar, currentForm, adminPage, resetAdminPage,
    loginPage, resetLoginPage,
    emojiIndex, setEmoji,
    sessionClose, cfSessionClose,
    demandsPageInit
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
