<template>
  <q-dialog v-model="me" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-lg row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">
          {{$t(newDev ? 'HPsetdev' : 'HPchgdev')}}
        </div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="devName" prefix="PSdevname" size="dev"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPIN')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPIN" size="pin" prefix="PSpin"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPseudo')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPseudo" size="tr" prefix="PStrig"/>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
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
import BtnCond from '../components-fw/BtnCond.vue'
import InputPs from '../components-fw/InputPs.vue'
import { $t, sty } from '../src-fw/util'

const ui = stores.ui
const sf = stores.safe

const props = defineProps({ idc: String })
const emit = defineEmits(['close', 'done'])
const me = computed(() => ui.dModels[props.idc].trustit)
watch(() => me.value, (v: boolean) => { if (v) init(); else { cleanup(); emit('close', props.idc) } })

const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })

const init = () => {
  // console.log('Init DevTrustit')
  const t = sf.myTrusting
  newDev.value = sf.devId === ''
  newPIN.inp = ''
  devName.inp = newDev.value ? '' : sf.devName
  newPseudo.inp = t ? t.pseudo : sf.auth.pseudo
}

const cleanup = () => {
  // console.log('Cleanup DevTrustit')
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
    emit('done', props.idc)
    ui.fD()
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>