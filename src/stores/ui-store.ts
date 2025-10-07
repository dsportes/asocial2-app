// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useUiStore = defineStore('ui', () => {

  // Gestion du stack des dialogues ouverts *************************************
  const dStack = ref([]) // [[idc, name] ...]
  const dModels = ref({ '0': {} }) // liste des noms de dialogue par idc
  const idc = ref(1)

  const getIdc = () : string=> {
    idc.value++
    const idcx = '' + idc.value
    dModels.value[idcx] = {}
    return idcx
  }

  const oD = (idc: string, name: string) => { // nom du dialogue, son index
    if (!dModels.value[idc]) dModels.value[idc] = {}
    dModels.value[idc][name] = true
    dStack.value.push([idc, name])
  }

  const fD = () => {
    if (dStack.value.length > 0) {
      const [idc, name] = dStack.value.pop()
      const x = dModels.value[idc]
      if (x) x[name] = false
    }
  }

  const closeVue = (idc: string) => {
    if (idc === '0') return
    const ds = []
    dStack.value.forEach(e => { if (e[0] !== idc) ds.push(e)})
    dStack.value = ds
    delete dModels.value[idc]
  }

  const isOpenD = (idc: string, name: string) => 
    idc && dModels.value[idc] && dModels.value[idc][name] 

  // Gestion de l'affichage des exceptions
  const excResolve = ref(null)
  const exc = ref(null) // Exception trappée : en attente de décision de l'utilisateu

  const displayExc = async (e) => {
    if (isOpenD('0', 'dialogExc')) return
    exc.value = e
    oD('0', 'dialogExc')
    return new Promise((resolve) => {
      excResolve.value = resolve
    })
  }

  const hideExc = () => { 
    exc.value = null
    fD()
    const f = excResolve.value
    if (f) f()
    excResolve.value = null
  }

  // Gestion d'un dialogue avec confirmation
  const diag = ref(null)
  const diagResolve = ref(null)
  async function diagDisplay (text: string) {
    return new Promise((resolve) => {
      diag.value = text
      diagResolve.value = resolve
      oD('0', 'diag')
    })
  }

  return {
    dModels, getIdc, oD, fD, closeVue, isOpenD,
    exc, displayExc, hideExc,
    diag, diagResolve, diagDisplay 
  }
})

/*
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
*/
