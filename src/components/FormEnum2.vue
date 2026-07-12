<template>
<div>
  <div class="titre-md q-mt-md">{{  $t('TYPE_'+ type + '_' + champ) }}</div>

    <div v-if="fst.visU" class="q-my-sm q-pl-md">
      <div class="text-italic">{{ $t('FORMdem_2_label') }}</div>
      <div v-if="fst.isDemand && fst.editable" class="row q-px-xs items-center">
        <select-enum1 class="col"
          v-model="loc1" :svc="fst.svc" :org="fst.org" :enum="enum"/>
        <btn-cond v-if="fst.visT && psT" class="col-auto q-ml-sm"
          flat icon="content_paste" @ok="copyLocU"/>
        <btn-cond v-if="fst.isDemand && fst.editable" class="col-auto q-ml-sm"
          flat icon="star" @ok="initLocU"/>
      </div>
      <div v-else class="font-mono text-bold">{{  edv(loc2) }}</div>
    </div>

    <div v-if="fst.visT" class="q-my-sm q-pl-md">
      <div class="text-italic">{{ $t('FORMprop_2_label') }}</div>
      <div v-if="!fst.isDemand && fst.editable" class="row q-px-xs items-center">
        <select-enum1 class="col"
          v-model="loc1" :svc="fst.svc" :org="fst.org" :enum="enum"/>
        <btn-cond v-if="fst.visU && psU" class="col-auto q-ml-sm"
          flat icon="content_paste" @ok="copyLocT"/>
        <btn-cond v-if="!fst.isDemand && fst.editable" class="col-auto q-ml-sm"
          flat icon="star" @ok="initLocT"/>
      </div>
      <div v-else class="col font-mono text-bold">{{  edv(loc2) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import { hasMessage } from '../src-fw/util'

import SelectEnum1 from '../components-fw/SelectEnum1.vue'

const props = defineProps({
  type: String,
  champ: String,
  enum: String
})

const err = defineModel()

const fst = stores.form

const edv = (e) => {
  if (!e) return '?'
  const m = hasMessage('ENUM_' + props.enum + '_' + e)
  return m || e
}

const psU = computed(() => fst.form.cloneEtc(true)[props.champ])
const psT = computed(() => fst.form.cloneEtc(false)[props.champ])

const loc1 = ref('')
const loc2 = ref('')

watch(loc1, async (v) => {
  fst.upd.etc[props.champ] = v
  err.value = v.length < 2 ? props.enum + 'absent' : ''
  await fst.onChange()
})
watch(() => fst.upd.etc, (v) => {
  loc1.value = v[props.champ]
})

loc1.value = fst.upd.etc[props.champ]
loc2.value = fst.isDemand ? psT.value : psU.value

const copyLocU = () => { loc1.value = psT.value }
const copyLocT = () => { loc1.value = psU.value }
const initLocU = () => { loc1.value = psU.value }
const initLocT = () => { loc1.value = psT.value }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>