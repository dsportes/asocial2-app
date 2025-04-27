// @ts-ignore
import { ref, computed } from 'vue';
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia';

// @ts-ignore
import { useDataStore } from '../stores/data-store.ts'

export const useConfigStore = defineStore('config', () => {
  // Gestion des langues
  const localeMap = new Map()
  const localeOptions = ref()
  const setLocaleOptions = (opts: Array<object>) => {
    localeOptions.value = opts
    localeMap.clear()
    // @ts-ignore
    opts.forEach(l => { localeMap.set(l.value, l) })
  }
  setLocaleOptions([{ value: 'en-EN', label: 'English',  flag: '🇬🇧' }])

  const locale = ref(localeOptions.value[0].value)
  const setLocale = (loc:string) => { locale.value = loc}
  const optionLocale = computed(() => localeMap.get(locale.value))

  // Gestion des stores
  const dataSt = computed(() => useDataStore())
  const $t = ref()

  return {
    $t,
    locale, localeOptions, setLocaleOptions, optionLocale, setLocale,
    dataSt
  }
});

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
