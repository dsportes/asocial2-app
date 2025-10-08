// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import { setCssVar } from 'quasar'
import stores from './all'

const large = 900

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

  // Gestion du stack des dialogues ouverts *************************************
  const dStack = ref([]) // [[idc, name] ...]
  const dModels = ref({ '0': {} }) // liste des noms de dialogue par idc
  const idc = ref(1)

  const getIdc = () : string=> {
    idc.value++
    const idcx = '' + idc.value
    dModels.value[idcx] = {}
    return idcx
  }

  const oD = (idc: string, name: string) => { // nom du dialogue, son index
    if (!dModels.value[idc]) dModels.value[idc] = {}
    dModels.value[idc][name] = true
    dStack.value.push([idc, name])
  }

  const fD = () => {
    if (dStack.value.length > 0) {
      const [idc, name] = dStack.value.pop()
      const x = dModels.value[idc]
      if (x) x[name] = false
    }
  }

  const closeVue = (idc: string) => {
    if (idc === '0') return
    const ds = []
    dStack.value.forEach(e => { if (e[0] !== idc) ds.push(e)})
    dStack.value = ds
    delete dModels.value[idc]
  }

  const isOpenD = (idc: string, name: string) => 
    idc && dModels.value[idc] && dModels.value[idc][name] 

  // Gestion de l'affichage des exceptions
  const excResolve = ref(null)
  const exc = ref(null) // Exception trappée : en attente de décision de l'utilisateu

  const displayExc = async (e) => {
    if (isOpenD('0', 'dialogExc')) return
    exc.value = e
    oD('0', 'dialogExc')
    return new Promise((resolve) => {
      excResolve.value = resolve
    })
  }

  const hideExc = () => { 
    exc.value = null
    fD()
    const f = excResolve.value
    if (f) f()
    excResolve.value = null
  }

  // Gestion d'un dialogue avec confirmation
  const diag = ref(null)
  const diagResolve = ref(null)
  async function diagDisplay (text: string) {
    return new Promise((resolve) => {
      diag.value = text
      diagResolve.value = resolve
      oD('0', 'diag')
    })
  }

  const openHelp = (page: string) => {
    const ph = stores.config.getHelpPages()
    if (!ph.has(page)) {
      $q.value.dialog({
        // title: 'Alert',
        message: $t.value('HLPaidebd', [page]),
        ok: { label: $t.value('gotit'), flat:true, color: "primary" }
      }).onOk(() => { }).onCancel(() => { }).onDismiss(() => { })
    }
    else {
      // TODO
      console.log('Ouverture page aide ', page)
      return
    }
  }

  return {
    set$t$q, setDark, isDark,
    setScreenWH, portrait, screenHeight, screenWidth, isShort,
    dModels, getIdc, oD, fD, closeVue, isOpenD,
    exc, displayExc, hideExc,
    diag, diagResolve, diagDisplay,
    openHelp
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
