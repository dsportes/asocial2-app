import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useDataStore } from '../stores/data-store.js'


export const useConfigStore = defineStore('config', () => {
  // Gestion des langues
  const localeMap = new Map()
  const localeOptions = ref()
  const setLocaleOptions = (opts) => {
    localeOptions.value = opts
    localeMap.clear()
    opts.forEach(l => { localeMap.set(l.value, l) })
  }
  setLocaleOptions([{ value: 'en-EN', label: 'English',  flag: '🇬🇧' }])

  const locale = ref(localeOptions.value[0].value)
  const setLocale = (loc) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  // Gestion des stores
  const dataSt = computed(() => useDataStore())

  return {
    locale, localeOptions, setLocaleOptions, optionLocale, setLocale,
    dataSt
  }
})
