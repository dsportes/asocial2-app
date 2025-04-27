// @ts-ignore
import { ref } from 'vue';
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useDataStore = defineStore('data', () => {
  const cpt = ref(0)
  const setCpt = (v) => cpt.value = v

  return { setCpt, cpt }
});

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}

