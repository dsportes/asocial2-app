<template>
<!-- Dialogue d'export du safe-->
  <dialog-std1 v-model="me" :title="$t('HPexpsafe_1')" hdrclass='wmd'>
    <template #hdr>
      <div class="column items-end">
        <btn-cond class="q-ma-xs" flat icon="check"
          :disable="cryptK.key === null || !expName"
          :label="$t('HPbackup_0')"
          @ok="doExportSafe"/>
      </div>
    </template>
    <template #default>
      <div class="column q-mx-lg items-center">
        <div class="q-my-sm full-width">
          <div class="titre-md text-italic">{{$t('HPimport_label')}}</div>
          <input-ps v-model="cryptK" :validatefn="valK" size="ps" prefix="HPimport"/>
        </div>
        <div v-if="cryptK.key === null" class="q-my-xs msg2">{{$t('HPimport_bf0')}}</div>
        <input-a v-if="session.hasNet && !selStar" class="q-my-sm full-width"
          size="file" prefix="HPexpname" v-model="expName"
          :disable="cryptK.key === null"
          :validatefn="doExportSafe"/>
      </div>
    </template>
  </dialog-std1>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, reactive, computed, onUnmounted, watch } from 'vue'
// @ts-ignore
import { encode } from '@msgpack/msgpack'
// @ts-ignore
import { saveAs } from 'file-saver'
import stores from '../stores/all'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import InputPs from '../components-fw/InputPs.vue'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const props = defineProps({ idc: String })
const myidc = ui.getIdc('SafeExport')
onUnmounted(() => ui.closeVue(myidc))
const emit = defineEmits(['close', 'done'])
const me = computed(() => ui.dModels[props.idc].exportsafe)
watch(() => me.value, async (v: boolean) => { if (v) await init()
  else { cleanup(); emit('close', myidc) } })

const init = async () => {
  setInfopub()
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  bin.value = encode(await sf.getBinSafe())
  if (!bin.value) {
    await ui.diagDisplay($t('HPexportsafe_ko'))
    ui.fD()
  }
}

const cleanup = () => {}

const expName = ref('')
const cryptK = reactive( { inp: '', err: '', key: null } )
const bin = ref(null)
const infopub = ref('')

const setInfopub = () => {
  infopub.value = JSON.stringify([sf.auth.C, sf.auth.V], null, '\t')
}

const valK = async () => {
  cryptK.key = await Crypt.strongHash(cryptK.inp, true, true)
}

const doExportSafe = async () => {
  if (!expName.value) return
  const buf: Uint8Array = await Crypt.crypt(cryptK.key, bin.value)
  const nf = expName.value + (!expName.value.endsWith('.bin') ? '.bin' : '')
  // @ts-ignore
  const blob = new Blob([buf], { type: 'application/octet-stream'})
  saveAs(blob, nf)
  await ui.diagDisplay($t('HPexport_ok', [nf]))
  bin.value = null
  ui.fD()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>