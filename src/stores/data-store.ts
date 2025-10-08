// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useDataStore = defineStore('data', () => {
  const cpt: Ref<number> = ref(0)
  const setCpt = (v: number) => cpt.value = v
  
  return { setCpt, cpt }
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
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
