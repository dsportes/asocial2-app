<template>
<div>
  <div class="titre-md q-mt-md">{{  $t('TYPE_'+ svc + '_' + type + '_' + champ) }}</div>

    <div v-if="fst.visU" class="row q-px-xs items-center">
      <input-b v-if="fst.isDemand && fst.editable"
        class="col font-mono text-bold" :size="size" prefix="FORMdem_2"
        v-model="loc1" :noval="!valbtn" :initval="psU" @validate="valB"/>
      <input-b v-else
        class="col font-mono text-bold" prefix="FORMdem_2"
        v-model="loc2" noval :initval="loc2.inp" disable/>
      <btn-cond v-if="fst.isDemand && fst.editable && fst.visT && psT" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyLocU"/>
      <btn-cond v-if="fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initLocU"/>
    </div>

    <div v-if="fst.visT" class="row q-px-xs items-center">
      <input-b v-if="!fst.isDemand && fst.editable"
        class="col font-mono text-bold" :size="size" prefix="FORMprop_2"
        v-model="loc1" :noval="!valbtn" :initval="psT" @validate="valB"/>
      <input-b v-else
        class="col font-mono text-bold" prefix="FORMprop_2"
        v-model="loc2" noval :initval="loc2.inp" disable/>
      <btn-cond v-if="!fst.isDemand && fst.editable && fst.visU && psU" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyLocT"/>
      <btn-cond v-if="!fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initLocT"/>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const props = defineProps({
  type: String,
  svc: String,
  champ: String,
  size: String,
  valbtn: Boolean
})

const err = defineModel()

const fst = stores.form

const psU = computed(() => fst.form.cloneEtc(true)[props.champ])
const psT = computed(() => fst.form.cloneEtc(false)[props.champ])

const loc1 = reactive({ inp: '', err: '' })
const loc2 = reactive({ inp: '', err: '' })

watch(loc1, async (v) => {
  err.value = v.err
  if (!props.valbtn)
    fst.upd.etc[props.champ] = v.inp
  else {
    if (fst.upd.etc[props.champ] !== v.inp)
      fst.upd.etc[props.champ] = ''
  }
  await fst.onChange()
})
const valB = async () => {
  fst.upd.etc[props.champ] = loc1.inp
  await fst.onChange()
}
watch(() => fst.upd.etc, (v) => {
  loc1.inp = v[props.champ]
})

loc1.inp = fst.upd.etc[props.champ]
loc2.inp = fst.isDemand ? psT.value : psU.value

const copyLocU = async () => { 
  loc1.inp = psT.value 
  if (props.valbtn) 
    fst.upd.etc[props.champ] = loc1.inp
}
const copyLocT = async () => { 
  loc1.inp = psU.value 
  if (props.valbtn) 
    fst.upd.etc[props.champ] = loc1.inp
}
const initLocU = () => { loc1.inp = psU.value }
const initLocT = () => { loc1.inp = psT.value }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>