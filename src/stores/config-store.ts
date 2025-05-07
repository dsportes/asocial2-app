// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

// @ts-ignore
import { useDataStore } from '../stores/data-store.ts'

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

  const urlsrv = 'http://localhost:8080/'
  // const urlsrv = 'https://europe-west1-asocial-test1.cloudfunctions.net/asocialGCF/'

  return {
    $t,
    locale, localeOptions, resetLocaleOptions, optionLocale, setLocale,
    dataSt,
    urlsrv
  }
});

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
