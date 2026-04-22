<!-- Dialogue d'export du safe
Events: close done
-->
<template>
<div>
  <dialog-std1 v-model="model" :title="$t('HPexpsafe_1')" hdrclass='wmd' vue="SafeExport">
    <template #hdr>
      <div class="row items-center q-gutter-sm">
        <q-tabs v-model="tab" class="col bg-grey-9 q-mb-md" dense>
          <q-tab name="export" icon="download" :label="$t('EXPexport')" />
          <q-tab class="text-warning bg-yellow-3" name="restore"
            icon="warning" :label="$t('EXPrestore')" />
        </q-tabs>
        <btn-cond v-if="tab === 'export'" class="col-auto q-ma-xs" flat icon="check"
          :disable="cryptK.key === null || !expName"
          :label="$t('HPbackup_0')"
          @ok="doExportSafe"/>
        <btn-cond v-if="tab === 'restore'" class="col-auto q-ma-xs" flat icon="check"
          :disable="cryptK.key === null || !expName"
          :label="$t('HPbackup_0')"
          @ok="doExportSafe"/>
      </div>
    </template>
    <template #default>

    <div v-if="tab === 'export'" class="column q-mx-lg items-center">
      <div class="q-my-sm full-width">
        <div class="titre-md text-italic">{{$t('HPimport_label')}}</div>
        <input-b v-model="cryptK" @validate="valK" size="ps" prefix="HPimport"/>
      </div>
      <div v-if="cryptK.key === null" class="q-my-xs msg2">{{$t('HPimport_bf0')}}</div>
      <input-a v-if="session.hasNet" class="q-my-sm full-width"
        size="file" prefix="HPexpname" v-model="expName"
        :disable="cryptK.key === null"
        @validate="doExportSafe"/>
    </div>

    <div v-if="tab === 'restore'" class="full-width">
      <bar-open passive :title="$t('HPimpsafe_1')" :bubbleleft="$t('HPimpsafe_2')"/>
      <div class="titre-md text-italic q-mt-sm">{{$t('HPimport_label')}}</div>
      <input-b v-model="cryptK" prefix="HPimport" size="ps"
        @validate="valK"/>

      <q-file v-if="cryptK.key !== null"
        class="q-my-md full-width" dense filled v-model="fileList"
        :label="$t('pickfile')" max-file-size="50000000" max-file="1"/>

      <div v-if="safe !== null" class="full-width">
        <div class="titre-md text-italic">{{$t('HPimpsafe_3')}}</div>
        <p0-p1 @ok="authPS"/>
      </div>

      <div v-if="statusSafe" class="q-my-sm bord q-pa-sm">
        <div v-if="statusSafe.lm !== -1">
          <div class='titre-lg q-mb-sm'>{{$t('HPsafest_1')}}</div>
          <bar-open class="q-my-sm" :title="$t('HPsafest_6')" :bubbleleft="$t('HPsafest_7')"
            icon="open_in_new" hasopen @open="openChgCodes"/>
          <div v-if="safe.lm < statusSafe.lm" class='q-ml-sm titre-md'>
            {{$t('HPsafest_2gt', [dhcool(statusSafe.lm*1000), dhcool(safe.lm*1000)])}}
          </div>
          <div v-if="safe.lm > statusSafe.lm" class='q-ml-sm titre-md'>
            {{$t('HPsafest_2lt', [dhcool(statusSafe.lm*1000), dhcool(safe.lm*1000)])}}
          </div>
          <div v-if="safe.lm === statusSafe.lm" class='q-ml-sm titre-md'>
            {{$t('HPsafest_2eq', [dhcool(statusSafe.lm*1000)])}}
          </div>
          <div v-if="!statusSafe.xp" class='q-ml-sm titre-md msg2'>
            {{$t('HPsafest_5p')}}
          </div>
          <div v-if="!statusSafe.xr" class='q-ml-sm titre-md msg2'>
            {{$t('HPsafest_5r')}}
          </div>
          <div v-if="!statusSafe.xr || !statusSafe.xp">
            <div class='q-ml-sm titre-lg msg2'>{{$t('HPsafest_5a')}}</div>
          </div>
          <div v-else>
            <div class="column items-center q-gutter-sm q-my-sm">
              <btn-cond :label="$t('HPsafest_r')" @ok="cfImp = true"/>
              <btn-confirm :actif="cfImp" @confirm="importBackup"/>
            </div>
          </div>
        </div>
        <div v-else>
          <div class='titre-lg q-mb-sm'>{{$t('HPsafest_3')}}</div>
          <bar-open class="q-my-sm" :title="$t('HPsafest_6')" :bubbleleft="$t('HPsafest_7')"
            icon="open_in_new" hasopen @open="dialogs.SafeCr = true"/>
          <div v-if="!statusSafe.xp" class='q-ml-sm titre-md msg2'>
            {{$t('HPsafest_5p')}}
          </div>
          <div v-if="!statusSafe.xr" class='q-ml-sm titre-md msg2'>
            {{$t('HPsafest_5r')}}
          </div>
          <div v-if="!statusSafe.xr || !statusSafe.xp">
            <div class='q-ml-sm titre-lg msg2'>{{$t('HPsafest_5b')}}</div>
          </div>
          <div v-else>
            <div class="column items-center q-gutter-sm q-my-sm">
              <btn-cond :label="$t('HPsafest_i')" @ok="cfImp = true"/>
              <btn-confirm :actif="cfImp" @confirm="importBackup"/>
            </div>
          </div>
        </div>
      </div>
      <btn-cond class="q-my-md" :label="$t('reset')"
        icon="undo" @ok="reset"/>
    </div>

    </template>
  </dialog-std1>

  <!-- Changement des codes du backup-->
  <safe-cr v-if="dialogs.SafeCr" v-model="dialogs.SafeCr" @done="chgCodes" mode="p"/>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, reactive, computed, onUnmounted, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { saveAs } from 'file-saver'

import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { SafeOperation } from '../src-fw/operation'
import { $t, b64ToU8, dhcool, u8ToB64, readFile, coolBye } from '../src-fw/util'

import BarOpen from '../components-fw/BarOpen.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputA from '../components-fw/InputA.vue'
import InputB from '../components-fw/InputB.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'
import SafeCr from '../dialogs-fw/SafeCr.vue'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const myModule = 'SafeExport'
const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
  SafeCr: false
})
// onMounted(() => console.log(myModule, "mounted"))
// onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, async (v) => {
  if(v) await init()
  else emit('close', true)
})

const props = defineProps({
  tab: String
})

const tab = ref('export')
watch(tab, async () => { await init() })

// TODO ??? "UN" safe ou le sien courant ?
const init = async () => {
  if (props.tab === 'restore') tab.value = 'restore'
  if (tab.value === 'restore') reset()
  else {
    infopub.value = JSON.stringify([sf.auth.C, sf.auth.V], null, '\t')
    cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
    bin.value = encode(await sf.getBinSafe())
    if (!bin.value) {
      await ui.diagDisplay($t('HPexportsafe_ko'))
      model.value = false
    }
  }
}

const expName = ref('')
const cryptK = reactive( { inp: '', err: '', key: null } )
const bin = ref(null)
const infopub = ref('')

// TODO
const doExportSafe = async () => {
  if (!expName.value) return
  const buf: Uint8Array = await Crypt.crypt(cryptK.key, bin.value) as Uint8Array
  const nf = expName.value + (!expName.value.endsWith('.bin') ? '.bin' : '')
  // @ts-ignore
  const blob = new Blob([buf], { type: 'application/octet-stream'})
  saveAs(blob, nf)
  await ui.diagDisplay($t('HPexport_ok', [nf]))
  bin.value = null
  model.value = false
}

const fileList = ref(null)
const fd = ref({ name: '', size: 0 })
const diag = ref('')
const safe = ref(null)
const statusSafe = ref(null)
const cfImp = ref(false)
const keyK = ref(null)
const impSafeStore = ref('')

const reset = () => {
  impSafeStore.value = ''
  fileList.value = null
  fd.value = { name: '', size: 0 }
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  diag.value = ''
  bin.value = null
  safe.value = null
  cfImp.value = false
  keyK.value = null
  statusSafe.value = null
}

const valK = async () => {
  if (cryptK.err === '') cryptK.key = await Crypt.strongHash(cryptK.inp, true, true)
  else cryptK.key = null
}

watch(fileList, async (file: any) : Promise<void> => {
  if (file) await downloadFile(await readFile(file, true))
})

const downloadFile = async (f) => {
  try {
    bin.value = await Crypt.decrypt(cryptK.key, f.u8)
    safe.value = decode(bin.value)
  } catch (e) {
    bin.value = null
    safe.value = null
    diag.value = $t('HPimport_bf2')
  }
  fileList.value = null
}

const authPS = async (args) => {
  const _id = safe.value.id
  const _hp0 = safe.value.hp0
  const _Ka = b64ToU8(safe.value.Ka)
  const _hr0 = safe.value.hr0
  const sh = args.sh
  const sh0 = args.sh0
  const hp0 = u8ToB64(sh0, true)
  const _hhp1 = safe.value.hhp1
  const sh1 = args.sh1
  const hhp1 = Crypt.shaS(sh1)
  diag.value = (_hp0 !== hp0 || _hhp1 !== hhp1)  ? $t('HPimpsafe_4') : ''
  if (!diag.value) {
    keyK.value = await Crypt.decrypt(sh, _Ka)
    await getStatus(_id, _hp0, _hr0)
  }
}

const getStatus = async (id, hp0, hr0) => {
  cfImp.value = false
  const op = new SafeOperation('$StatusSafe', sf.myStore)
  try {
    op.args = { id, hp0, hr0 }
    const ret = await op.post()
    statusSafe.value = ret.statusSafe
    // statusSafe.value = { lm: -1, xp: false, xr: false }
  } catch (e) {
    op.ko(e)
  }
  console.log('status : ' + JSON.stringify(statusSafe.value))
}

const importBackup = async () => {
  console.log('importBackup')
  const op = new SafeOperation('$RestoreSafe', sf.mySafeStore)
  let ret
  try {
    op.args = { safe: safe.value }
    ret = await op.post()
    await ui.diagDisplay($t('HPcsret_2' + ret.status))
    await sf.resetAllLocal()
    coolBye()
  } catch (e) {
    op.ko(e)
    return -1
  }
}

const chgCodes = async (arg) => {
  console.log('chgCodes')
  /* const arg = {
    cash0: ca.sh0,
    cash1: ca.sh1,
    cash: ca.sh,
    crsh0: cr.sh0,
    crsh1: cr.sh1,
    crsh: cr.sh
  }
    hp0: u8ToB64(psh0, true),
    hr0: u8ToB64(rsh0, true),
    hhp1: Crypt.shaS(psh1),
    hhr1: Crypt.shaS(rsh1),
    Ka: await Crypt.crypt(psh, keyK.value),
    Kr: await Crypt.crypt(rsh, keyK.value)
  */
  const s = safe.value
  s.hp0 = u8ToB64(arg.cash0, true)
  s.hr0 = u8ToB64(arg.crsh0, true)
  s.hhp1 = Crypt.shaS(arg.cash1)
  s.hhr1 = Crypt.shaS(arg.crsh1)
  s.Ka = u8ToB64(await Crypt.crypt(arg.cash, keyK.value))
  s.Kr = u8ToB64(await Crypt.crypt(arg.crsh, keyK.value))
  await getStatus(s.id, s.hp0, s.hr0)
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
