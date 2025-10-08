// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

export interface localeOption { value: string, label: string, flag: string }

type typeK ={
  localeOptions: localeOption[]
  vapidPublicKey: string
}

export const useConfigStore = defineStore('config', () => {
  const location = ref(null)

  // Gestion des langues ***************************************************
  const localeMap = new Map()
  const locale: Ref<string> = ref()
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  const K = ref()
  const initK = (k: any, location: string) => {
    K.value = k
    k.localeOptions.forEach(l => { localeMap.set(l.value, l) })
    locale.value = k.localeOptions[0].value
  }

  function getHelpPages () : Set<string> {
    return new Set()
  }

  return {
    location, K, initK, locale, optionLocale, setLocale, getHelpPages,
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
