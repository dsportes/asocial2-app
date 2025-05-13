// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

// @ts-ignore
import { useDataStore } from '../stores/data-store.ts'

export const byeHtml =  `<html><head><meta charset="utf-8"></head>
<body style="font-size:24px;">
<div>Duplicate application launch in this browser not allowed.</div> 
<div>Le lancement de l'application plus d'une fois dans ce browser n'est pas autorisé.</div>
<a href="https://asocialapps.github.io/frdocs/">Help / Aide</a>
</body></html>`

export interface localeOption { value: string, label: string, flag: string }

export const useConfigStore = defineStore('config', () => {
  // Gestion des langues
  const defaultLocaleOption: localeOption = { value: 'en-EN', label: 'English',  flag: '🇬🇧' }
  const localeMap = new Map().set('en-EN', defaultLocaleOption)
  const localeOptions: Ref<localeOption[]> = ref([defaultLocaleOption])
  const resetLocaleOptions = (opts: localeOption[]) => {
    localeMap.clear()
    localeOptions.value = opts
    opts.forEach(l => { localeMap.set(l.value, l) })
  }

  const locale: Ref<string> = ref(localeOptions.value[0].value)
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
      opSpinner.value++
      opCount()
    }, 1000)
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

  function callSW (data: any) {
    // while (!this.registration) await sleep(1000)
    if (registration) registration.active.postMessage(data)
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

  const swMessage = ref(null)

  function onSwMessage (m: any) {
    swMessage.value = m
  }

  return {
    $t,
    locale, localeOptions, resetLocaleOptions, optionLocale, setLocale,
    dataSt,
    opEncours, opDialog, opSignal, opSpinner, opStart, opEnd,
    setRegistration, callSW, swMessage, onSwMessage,
    focus, getFocus, lostFocus
  }
});

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
