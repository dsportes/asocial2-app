// @ts-ignore
import { ref, Ref, reactive, computed, watch } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import stores from './all'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const useFormStore = defineStore('form', () => {

  const form = ref()
  const isDemand = ref()
  const fnCheck = ref()

  const diag1 = ref('')
  const diag2 = ref('')

  const upd = reactive({
    etc: null,
    msg: '',
    msgc: false,
    etcc: false
  })
  const hasChg = computed(() => upd.etcc || upd.msgc )

  const editable = computed(() => form.value.status < 3 )
  const creating = computed(() => form.value.status === 0 )
  const visU = ref()
  const visT = ref()

  const diag = computed(() => diag1.value !== '' || diag2.value !== '')

  const onChange = async () => {
    const ui = stores.ui
    const f = form.value
    if (f.status > 2) {
      diag1.value = ''
      diag2.value = ''
      ui.resetEditing()
      return
    }
    const fn = fnCheck.value[form.value.type]
    diag1.value = fn ? fn() : ''
    diag2.value = diag1.value ? '' : await f.checkEtc(upd.etc)
    if (isDemand.value) {
      upd.etcc = !f.eqEtc(f.etcU, upd.etc)
      upd.msgc = upd.msg !== f.msgUS
    } else {
      upd.etcc = !f.eqEtc(f.etcT, upd.etc)
      upd.msgc = upd.msg !== f.msgTS
    }
 
    if (upd.etcc || upd.msgc) ui.setEditing();
    else ui.resetEditing()
  }

  const setFnCheck = (_fnCheck) => {
    fnCheck.value = _fnCheck
  }

  const startEdit = (formCtx) => {
    form.value = formCtx.form
    isDemand.value = formCtx.isDemand
    const f = form.value
    f.msgUS = !f.msgU ? '' : decoder.decode(f.msgU)
    // il y a eu un bug avec un msgT en string (normalement corrigé)
    f.msgTS = !f.msgT ? '' : (typeof f.msgT === 'string' ? f.msgT : decoder.decode(f.msgT))
    reset()
    setTimeout(async () => {
      await onChange()}, 1)
  }

  const reset = () => {
    const f = form.value
    const ui = stores.ui
    if (f.status !== 0) ui.resetEditing()
    upd.msg = isDemand.value ? f.msgUS || '' : f.msgTS || ''
    upd.etc = isDemand.value ? f.cloneEtc(true) : f.cloneEtc(false)
    visU.value = (f.status === 0 && isDemand.value) || (f.status > 0)
    visT.value = (f.status === 0 && !isDemand.value) || (f.status > 0)
  }

  const undo = async () => {
    if (form.value.status > 2) return
    reset()
    await onChange()
  }

  const exp = reactive({
    msg: false
  })
  const expOnShow = (id: string) => {
    for (const x of Object.keys(exp)) if (x !== id) exp[x] = false
  }
  const setExp = (id: string) => {
    exp[id] = false
  }

  return {
    setFnCheck, startEdit, reset, onChange, undo,
    form, isDemand, diag1, diag2, diag,
    upd,
    hasChg, editable, creating, visU, visT,
    exp, expOnShow, setExp
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
  import.meta.hot.accept(acceptHMRUpdate(useFormStore, import.meta.hot));
}
