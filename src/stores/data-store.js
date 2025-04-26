import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', () => {
  const cpt = ref(0)
  const setCpt = (v) => cpt.value = v

  return { setCpt, cpt }
})
