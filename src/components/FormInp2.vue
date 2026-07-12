<template>
<div>
  <div class="titre-md q-mt-md">{{  $t('TYPE_'+ type + '_' + champ) }}</div>

    <div v-if="fst.visU" class="row q-px-xs items-center">
      <input-b v-if="fst.isDemand && fst.editable"
        class="col font-mono text-bold" :size="size" prefix="FORMdem_2"
        v-model="loc1" noval :initval="psU"/>
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
        v-model="loc1" noval :initval="psT"/>
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
  champ: String,
  size: String
})

const err = defineModel()

const fst = stores.form

const psU = computed(() => fst.form.cloneEtc(true)[props.champ])
const psT = computed(() => fst.form.cloneEtc(false)[props.champ])

const loc1 = reactive({ inp: '', err: '' })
const loc2 = reactive({ inp: '', err: '' })

watch(loc1, async (v) => {
  fst.upd.etc[props.champ] = v.inp
  err.value = v.err
  await fst.onChange()
})
watch(() => fst.upd.etc, (v) => {
  loc1.inp = v[props.champ]
})

loc1.inp = fst.upd.etc[props.champ]
loc2.inp = fst.isDemand ? psT.value : psU.value

const copyLocU = () => { loc1.inp = psT.value }
const copyLocT = () => { loc1.inp = psU.value }
const initLocU = () => { loc1.inp = psU.value }
const initLocT = () => { loc1.inp = psT.value }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>