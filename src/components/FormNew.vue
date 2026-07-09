<!--Composant de saisie des données pour création d'un nouveau Form
selon son type.
-->
<template>
<div>
  <div v-if="estComite && !isDemand">
    <input-b class="q-my-sm"
      v-model="alias" size="alias" prefix="FORMuseralias" @validate="valA"/>
  </div>
  <div v-if="diag" class="msg q-my-sm">{{  diag }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { $Form, $FormObj } from '../src-fw/documents'
import { FormType } from '../src-fw/doctypes'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const emit = defineEmits(['done'])

const props = defineProps({
  formType: FormType,
  isDemand: Boolean
})

const sf = stores.safe
const ui = stores.ui
ui.navBar.hasback = false

const diag = ref()
const estComite = computed(() => props.formType.type === 'membrecodir' || props.formType.type === 'membreredaction')

// Proposition membrecodir membreredaction
const alias = reactive({ inp: '', err: '' })

const valA = async () => {
  const cf = ui.currentForm
  const type = props.formType.type
  let userId = ''
  if (!props.isDemand) {
    const hsha = Crypt.shaS(await Crypt.strongHash(alias.inp, false, true))
    const icvs = await sf.mdUserGetICVS(hsha)
    if (!icvs) {
      diag.value = $t('APnouser')
      return
    }
    userId = icvs.i
  } else userId = sf.userId
  const obj: $FormObj = {
    type,
    formId: Crypt.rnd(15),
    userId,
    v: 0,
    maxLife: 0,
    status: 0,
    etcU: null,
    etcT: null,
    msgU: null,
    msgT: null,
  }
  const form = $Form.new(obj)
  form.opts = { asAdmin: cf.asAdmin, alias: props.isDemand ? '?' : alias.inp }
  form.svc = cf.soa.svc
  form.org = cf.soa.org
  emit('done', form)
}

if (estComite.value && props.isDemand)
  setTimeout(async () => { await valA() }, 1)

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bred { border: 2px solid $negative; border-radius: 5px; }
.byel { border: 2px solid var(--q-msgbg); border-radius: 5px; }
</style>
