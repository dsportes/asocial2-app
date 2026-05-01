// @ts-ignore
import { ref, computed, reactive } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import { setCssVar } from 'quasar'
import stores from './all'
import { Help } from '../src-fw/help'

const large = 900
const HOME = 'safeHome'

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
    const t = stores.config.K.theme
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

  // Sasie en mode password ou text
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
    const f = exc.resolve.value
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
      diag.cf = nbsec === true ? -1 : (nbsec || 0)
      diag.txt = txt
      diag.resolve = resolve
      appDialogs.GotIt = true
    })
  }

  const openHelp = (page: string) => {
    if (!Help.hasPage(page)) {
      $q.value.dialog({
        // title: 'Alert',
        message: $t.value('HLPaidebd', [page]),
        ok: { label: $t.value('gotit'), flat:true, color: "primary" }
      }).onOk(() => { }).onCancel(() => { }).onDismiss(() => { })
    }
    else {
      pushhelp(page)
      console.log('Ouverture page aide ', page)
      return
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

  // Gestion des pages
  const page = ref(HOME)

  const setPage = (p: string) => {
    page.value = ''
    setTimeout(() => { page.value = p }, 350)
  }

  // dialogues permanents rattachés à App.vue
  const appDialogs = reactive({
    ConfirmQuit: false,
    DialogExc: false,
    DialogHelp: false,
    GotIt: false
  })
  const confirmQuit = () => { appDialogs.ConfirmQuit = false }

  // const reopenSession = ref(0)

  const backToOpenSession = () => {
    stores.session.endSession()
    page.value = ''
    setTimeout(() => {
      page.value = HOME
      stores.safe.setStep(1)
      // setTimeout( () => { reopenSession.value++ }, 100)
    }, 50)
  }

  const adminPage = reactive({
    tab: 'svcstatus', // svcstatus managers
    SVC: '',
    $OP: ''
  })

  const demandsPage = reactive({
    tab: '', // new, list, process
    spons: null,
    svcOrg: { SVC: '', org: '' },
    time: 0
  })

  const currentInvit = reactive({
    zoomed: false,
    invit: null, // Invitation (service)
    inv: null, // Invit (safe)
    newTab: '',
    idx: 0,
    nb: 0,
    fnnav: null,
    fnOnUpdate: null
  })

  const emojiIndex = ref()
  const setEmoji = (idx) => {
    emojiIndex.value = idx
    return idx
  }

  return {
    set$t$q, setDark, isDark, $q, visibility,
    openMenu, closeMenu, leftMenu,
    setScreenWH, portrait, screenHeight, screenWidth, isShort,
    appDialogs, confirmQuit, 
    exc, displayExc, hideExc,
    diag, diagDisplay,
    openHelp, helpstack, fermerHelp, pushhelp, pophelp,
    page, setPage, backToOpenSession,
    currentInvit, adminPage, demandsPage,
    emojiIndex, setEmoji
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
