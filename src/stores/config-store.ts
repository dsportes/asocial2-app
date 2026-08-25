// @ts-ignore
import { ref, Ref, computed } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import customR from '../assets/custom.json?raw'
import { K as AppK } from '../app/constants'

export interface localeOption { value: string, label: string, flag: string }

type typeK ={
  localeOptions: localeOption[]
  vapidPublicKey: string
}

type service = {
  url: string
  api: number
}

export const useConfigStore = defineStore('config', () => {
  const location = ref(null) // le href

  // Gestion des langues ***************************************************
  const localeMap = new Map()
  const locale: Ref<string> = ref()
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  const appname = ref('')
  const services: Ref<Map<string, service>> = ref(new Map()) 

  const K = ref()

  const initK = () => {
    const custom = JSON.parse(customR)
    location.value = window.location['href']
    K.value = { ...AppK}
    for(const f in custom) K.value[f] = custom[f]
    K.value.localeOptions.forEach(l => { localeMap.set(l.value, l) })
    locale.value = K.value.localeOptions[0].value
    useI18n().locale.value = locale.value
    appname.value = K.value.APPNAME
    for (const svc in K.value.SERVICES) services.value.set(svc, K.value.SERVICES[svc])
  }

  return {
    location, K, initK, locale, optionLocale, setLocale, appname, services
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
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
