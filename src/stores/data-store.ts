// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useDataStore = defineStore('data', () => {
  const cpt: Ref<number> = ref(0)
  const setCpt = (v: number) => cpt.value = v

  return { setCpt, cpt }
});

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}

