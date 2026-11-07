import { ref, Ref, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { setMyDebug } from '../src-fw/base'

import { useI18n } from 'vue-i18n'
import { Lang } from 'quasar'
import langFr from 'quasar/lang/fr'
// import langDe from 'quasar/lang/de'

import { LocaleOption } from '../src-fw/base'
import customR from '../assets/custom.json?raw'
import { K as AppK } from '../app/constants'

/*
onfocus = (event) => { useConfigStore().getFocus() }
onblur = (event) => { useConfigStore().lostFocus() }
onbeforeunload = (event) => { useConfigStore().closingApp() }
*/

export const localeOptions: LocaleOption[] = [
  { value: 'en', label: 'English 🇬🇧',  flag: '🇬🇧' },
  { value: 'fr', label: 'Français 🇫🇷', flag: '🇫🇷', props: langFr }
]

type service = {
  url: string
  api: number
}

export const useConfigStore = defineStore('config', () => {
  let i18n: any
  const location: any = ref(null) // le href

  // Gestion des langues ***************************************************
  const localeMap: Ref<Map<string, LocaleOption>> = ref(new Map())
  const locale: Ref<string> = ref('')
  const setLocale = (loc: string) => {
    const x = localeMap.value.get(loc)
    if (x) {
      i18n.locale.value = loc
      if (x.props) Lang.set(x.props)
      locale.value = loc
    }
  }
  const optionLocale = computed(() => localeMap.value.get(locale.value))

  const appname = ref('')
  const services: Ref<Map<string, service>> = ref(new Map())

  const K = ref()

  const initK = () => {
    i18n = useI18n()
    location.value = window.location['href']
    K.value = { ...AppK }
    setMyDebug(K.value.myDebug)
    const custom = JSON.parse(customR)
    for(const f in custom) K.value[f] = custom[f]

    appname.value = K.value.APPNAME
    for (const svc in K.value.SERVICES) services.value.set(svc, K.value.SERVICES[svc])

    let i = 0
    for(const e of localeOptions)
      if (e.value !== K.value.LANG) i++; else break
    if (i !== 0) {
      const x = localeOptions[i]
      localeOptions.splice(i, 1)
      localeOptions.unshift(x)
    }
    Lang.set(localeOptions[0].props)
    localeOptions.forEach(l => { localeMap.value.set(l.value, l) })
    locale.value = localeOptions[0].value
    i18n.locale.value = locale.value
    console.log(Array.from(localeMap.value.values())[0]['label'])
  }

  /*
  const isManager = (svc: string, docCl: string) : boolean => {
    const x = K.value.MANAGERS.get(svc)
    return x !== undefined && (x.indexOf(docCl) !== -1)
  }
  */

  return {
    location, K, initK, locale, optionLocale, setLocale,
    appname, services, localeMap,
    // isManager
  }

})

/*
https://pinia.vuejs.org/cookbook/hot-module-replacement.html
Pinia supports Hot Module replacement so you can edit your stores
and interact with them directly in your app without reloading the page,
allowing you to keep the existing state, add, or even remove state, actions, and getters.
*/
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
