<template>
<form-exp :name="champ" :label="$t('TYPE_' + svc + '_' + type + '_' + champ)">
  <div class="q-ml-sm">
    <div v-if="fst.visU" class="row q-px-xs items-center q-mt-sm">
      <!--input-b v-if="fst.isDemand && fst.editable"
        class="col font-mono text-bold" :size="size" prefix="FORMdem_2"
        v-model="loc1" :noval="!valbtn" :initval="psU" @validate="valB"/-->

      <line-edit v-if="fst.isDemand && fst.editable"
        class="col font-mono text-bold" datasize="text"
        :text="loc1.inp" @change="valB2" prefix="FORMdem_2"/>

      <input-b v-else
        class="col font-mono text-bold q-mt-sm" prefix="FORMdem_2" size="text"
        v-model="loc2" noval :initval="loc2.inp" disable/>
      <btn-cond v-if="fst.isDemand && fst.editable && fst.visT && psT" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyLocU"/>
      <btn-cond v-if="fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initLocU"/>
    </div>

    <div v-if="fst.visT" class="row q-px-xs items-center">
      <!--input-b v-if="!fst.isDemand && fst.editable"
        class="col font-mono text-bold q-mt-sm" :size="size" prefix="FORMprop_2"
        v-model="loc1" :noval="!valbtn" :initval="psT" @validate="valB"/-->
      <line-edit v-if="!fst.isDemand && fst.editable" datasize="text"
        class="col font-mono text-bold"
        :text="loc1.inp" @change="valB2" prefix="FORMprop_2"/>
      <input-b v-else
        class="col font-mono text-bold q-mt-sm" prefix="FORMprop_2" size="text"
        v-model="loc2" noval :initval="loc2.inp" disable/>
      <btn-cond v-if="!fst.isDemand && fst.editable && fst.visU && psU" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyLocT"/>
      <btn-cond v-if="!fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initLocT"/>
    </div>
  </div>
</form-exp>
</template>

<script setup lang="ts" vapor>
import { reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import FormExp from '../components-fw/FormExp.vue'

const props = defineProps<{
  type: string,
  svc: string,
  champ: string,
  size: string,
  valbtn?: boolean
}>()

const champ = computed(() => props.champ || '')

const err = defineModel()

const fst = stores.form
fst.setExp(champ.value)

const psU = computed(() => fst.form.cloneEtc(true)[champ.value])
const psT = computed(() => fst.form.cloneEtc(false)[champ.value])

let loc1 = reactive({ inp: psU.value, err: '' })
let loc2 = reactive({ inp: psT.value, err: '' })

watch(loc1, async (v) => {
  err.value = v.err
  if (!props.valbtn)
    fst.upd.etc[champ.value] = v.inp
  else {
    if (fst.upd.etc[champ.value] !== v.inp)
      fst.upd.etc[champ.value] = ''
  }
  await fst.onChange()
})
const valB2 = async (v: any) => {
  loc1.inp = v
  fst.upd.etc[champ.value] = v
  await fst.onChange()
}
/*
const valB = async () => {
  fst.upd.etc[champ.value] = loc1.inp
  await fst.onChange()
}
*/
watch(() => fst.upd.etc, (v) => {
  loc1.inp = v[champ.value]
})

loc1.inp = fst.upd.etc[champ.value]
loc2.inp = fst.isDemand ? psT.value : psU.value

const copyLocU = async () => {
  loc1.inp = psT.value
  if (props.valbtn)
    fst.upd.etc[champ.value] = loc1.inp
}
const copyLocT = async () => {
  loc1.inp = psU.value
  if (props.valbtn)
    fst.upd.etc[champ.value] = loc1.inp
}
const initLocU = () => { loc1.inp = psU.value }
const initLocT = () => { loc1.inp = psT.value }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
