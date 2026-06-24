// @ts-ignore
import { ref, Ref, reactive, computed } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import stores from './all'

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
  const visU = computed(() => form.value.status === 0 && isDemand.value) || (form.value.status > 0)
  const visT = computed(() => form.value.status === 0 && !isDemand.value) || (form.value.status > 0)

  const onChange = async () => {
    const f = form.value
    diag1.value = doCheck()
    diag2.value = diag1.value ? '' : await f.checkEtc(upd.etc)
    if (isDemand.value) {
      upd.etcc = upd.msg !== f.msgU || f.eqEtc(f.etcU, upd.etc)
      upd.msgc = upd.msg !== f.msgU
    } else {
      upd.etcc = upd.msg !== f.msgT || f.eqEtc(f.etcT, upd.etc)
      upd.msgc = upd.msg !== f.msgT
    }
    if (!creating.value) {
      const ui = stores.ui
      if (hasChg.value) ui.setEditing(); else ui.resetEditing()
    }
  }

  const setFnCheck = (_fnCheck) => {
    fnCheck.value = _fnCheck
  }

  const doCheck = () : string => {
    const f = fnCheck.value[form.value.type]
    return f ? f() : ''
  }

  const startEdit = (formCtx) => {
    form.value = formCtx.form
    isDemand.value = formCtx.isDemand
    reset()
    setTimeout(async () => { await onChange()}, 1)
  }

  const reset = async () => {
    const f = form.value
    const ui = stores.ui
    if (f.status !== 0) ui.resetEditing()
    if (isDemand.value) {
      upd.msg = f.msgU
      upd.etc = f.etcU ? f.cloneEtc(f.etcU) : (f.etcT ? f.cloneEtc(f.etcT) : f.initEtc(true))
    } else {
      upd.msg = f.msgT
      upd.etc = f.etcT ? f.cloneEtc(f.etcT) : (f.etcU ? f.cloneEtc(f.etcU) : f.initEtc(false))
    }
  }

  const undo = async () => {
    reset()
    await onChange()
  }

  return {
    setFnCheck, startEdit, reset, onChange, undo,
    form, isDemand, diag1, diag2,
    upd,
    hasChg, editable, creating, visU, visT

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
