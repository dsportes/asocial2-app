<template>
<dialog-std0 vue="rev-susp" :title="title" v-model="model" vh="80">
  <q-tabs v-model="tab" dense class="tbp shadow-2">
    <q-tab name="suspc" :label="$t('CODIRcred_susp')"/>
    <q-tab name="delc" :label="$t('CODIRcred_del')" />
  </q-tabs>

  <div v-if="tab === 'delc'" class="q-ma-sm column items-center q-gutter-sm">
    <btn-cond v-if="curcred.props.limit" class="q-my-md" flat :label="$t('CODIRcred_susp5')"
      @ok="okSusp(0)"/>
    <div class="titre-md text-italic text-center">{{ $t('CODIRcred_del2') }}</div>
    <date-time :title="$t('CODIRcred_del1')" v-model="ddel"/>
    <div v-if="ddel" class="row items-center q-gutter-sm justify-between">
      <div class="col text-italic q-my-sm">{{ dsuspL2() }}</div>
      <btn-cond class="col-auto" confirm 
        :label="$t('iconfirm')" color="warning"
        icon="check" @ok="okSusp(1)"/>
    </div>
  </div>

  <div v-if="tab === 'suspc'" class="q-ma-sm column items-center q-gutter-sm">
    <btn-cond v-if="curcred.props.susp" class="q-my-md" flat :label="$t('CODIRcred_susp4')"
      @ok="okSusp(2)"/>
    <div class="titre-md text-italic text-center">
      {{ $t('CODIRcred_susp' + (curcred.props.susp ? '3' : '2')) }}
    </div>
    <date-time2 :title="$t('CODIRcred_susp1')" v-model="dsusp"/>
    <div v-if="dsusp.length === 2" class="row items-center q-gutter-sm justify-between">
      <div class="col text-italic q-my-sm">{{ dsuspL() }}</div>
      <btn-cond class="col-auto" confirm 
        :label="$t('iconfirm')" color="warning" 
        icon="check" @ok="okSusp(3)"/>
    </div>
  </div>
</dialog-std0>

</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, computed } from 'vue'
// @ts-ignore
import { date } from 'quasar'

import BtnCond from '../components-fw/BtnCond.vue'
import DateTime from '../components-fw/DateTime.vue'
import DateTime2 from '../components-fw/DateTime2.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { UpdateCredentialSusp } from '../as2/operations'

const model = defineModel()
const props = defineProps({
  svc: String,
  org: String,
  docCl: String,
  docPk: String,
  title: String,
  curcred: Object, // credential à altérer
  cred: Object // Credential du manager de l'opération
})
const emit = defineEmits(['done'])

const tab = ref('suspc')

const ddel = ref()
const ddelN = computed(() =>  
  ddel.value ? Math.floor(date.extractDate(ddel.value, 'YYYY-MM-DD HH:mm').getTime() / 60000) : 0)
const dsusp = ref([0, 0])
const dsuspL = () => props.curcred.editSusp(dsusp.value)
const dsuspL2 = () => props.curcred.editSusp(null, ddelN.value)

const init = () => {
  const c = props.curcred
  dsusp.value = c.props.susp ? c.props.susp : [0, 0]
  tab.value = 'suspc'
}

watch(tab, (v) => {
  if (v === 'delc') {
    ddel.value = date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm')
  } else {
    dsusp.value = [0, 0]
  }
})

const okSusp = async (t: number) => {
  const cc = props.curcred
  const lprops = { ...cc.props }
  if (t === 0) lprops.limit = 0
  else if (t === 1) lprops.limit = Math.floor(ddelN.value)
  else if (t === 2) delete lprops.susp
  else lprops.susp = dsusp.value

  const op = new UpdateCredentialSusp(props.svc, props.org)
  const status = await op.run(cc, lprops, props.cred)

  dsusp.value = [0, 0]
  emit('done')
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>