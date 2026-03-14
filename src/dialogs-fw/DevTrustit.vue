<!-- Dialogue de certification du terminal -->
<template>
  <q-dialog v-model="model" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-lg row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">
          {{$t(newDev ? 'HPsetdev' : 'HPchgdev')}}
        </div>
        <input-b class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="devName" prefix="PSdevname" size="dev"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPIN')}}</div>
        <input-b class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPIN" size="pin" prefix="PSpin"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPseudo')}}</div>
        <input-b class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPseudo" size="tr" prefix="PStrig"/>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="model = false"/>
        <btn-cond flat :label="$t('HPtrust_1')" color="warning"
          :disable="trusterr" @ok="setTrust"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch, reactive } from 'vue'

import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'

const ui = stores.ui
const sf = stores.safe

const myModule = 'DevTrustit'
const emit = defineEmits(['close', 'done'])
const model = defineModel()
// const dialogs = reactive({})
// onMounted(() => console.log(myModule, "mounted"))
// onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v) => {
  if(v) init()
  else emit('close', true)
})

const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })

const init = () => {
  const t = sf.myTrusting
  newDev.value = sf.devId === ''
  newPIN.inp = ''
  devName.inp = newDev.value ? '' : sf.devName
  newPseudo.inp = t ? t.pseudo : sf.auth.pseudo
}

const dup = computed(() => {
  let b = false
  sf.trustings.forEach(e => {
    if (e.userId !== sf.userId && e.pseudo === newPseudo.inp) b = true
  })
  return b
})

watch(newPseudo, (v) => { if (!v.err && dup.value) v.err = $t('PSdup') })

const trusterr = computed(() => devName.err !== '' || newPIN.err !== '' || newPseudo.err !== '')

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.inp, newPIN.inp, newPseudo.inp)
    if (status < 0) return
    await ui.diagDisplay($t('HPsttrust_' + status))
    emit('done', true)
    model.value = false
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>