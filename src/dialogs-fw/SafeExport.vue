<!-- Dialogue d'export du safe
Events: close done
-->
<template>
<div>
  <dialog-std1 v-model="model" :title="$t('HPexpsafe_1')" vue="SafeExport">
    <template #hdr>
      <q-tabs v-model="tab" breakpoint="2000px" class="col bg-grey-9" dense>
        <q-tab name="export" icon="download" :label="$t('EXPexport')" />
        <q-tab class="text-warning bg-yellow-3" name="restore"
          icon="warning" :label="$t('EXPrestore')" />
      </q-tabs>
    </template>
    <template #default>

    <div v-if="tab === 'export' && safe" class="column items-center">
    <div class="q-pa-xs wsm">
      <div class="q-my-sm">
        <div class="titre-md text-italic">{{$t('SFXps_label')}}</div>
        <input-b v-model="entryP" @validate="doExport" size="p1" prefix="SFXps"/>
      </div>
      <div v-if="entryP.err === '' && entryP.np === 0" class="msg">
        {{$t('SFXps_ko')}}</div>
    </div>
    </div>

    <div v-if="tab === 'restore'" class="column items-center">
    <div class="q-pa-xs wsm">
      <bar-open passive :title="$t('HPimpsafe_1')" :bubbleleft="$t('HPimpsafe_2')"/>

      <q-file class="q-my-md full-width" dense filled v-model="fileList"
        :label="$t('pickfile')" max-file-size="50000000" max-file="1"/>

      <div v-if="fd !== null">
        <div class="titre-md text-italic">{{$t('SFXps_label')}}</div>
        <input-b v-model="entryP" @validate="doImport" size="p1" prefix="SFXps"/>
      </div>

      <div v-if="safe !== null" class="q-my-md full-width">
        <div class="titre-md text-italic">{{$t('SFXimpsafe_ok')}}</div>
        <div v-if="icvs">
          <div class="titre-lg msg text-center q-my-sm">
            {{ icvs.s ? $t('SFXsafeexists_1', [icvs.s]) : $t('SFXsafeexists_0') }}
          </div>
        </div>
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
              <btn-cond :label="$t('iconfirm')" confirm :disable="!cfImp" @ok="importBackup"/>
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
              <btn-cond :disable="!cfImp" confirm @ok="importBackup"/>
            </div>
          </div>
        </div>
      </div>
      <btn-cond class="q-my-md" :label="$t('reset')"
        icon="undo" @ok="reset"/>
    </div>
    </div>

    </template>
  </dialog-std1>

  <choose-it v-if="dialogs.backupCf" v-model="dialogs.backupCf" 
    prefix="SFXcfex" options="pw" 
    :args="[entryP.np, filename]" @giveup="backupCf(0)" @option="backupCf"/>

  <!-- Changement des codes du backup
  <safe-cr v-if="dialogs.SafeCr" v-model="dialogs.SafeCr" @done="chgCodes" mode="p"/>
  -->
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, reactive, computed, onMounted, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { saveAs } from 'file-saver'

import stores from '../stores/all'
import { Auth } from '../stores/safe-store'
import { Crypt } from '../src-fw/crypt'
import { SafeOperation } from '../src-fw/operation'
import { $t, dhcool, readFile, coolBye } from '../src-fw/util'
import { keyToB64, keyFromB64 } from '../src-fw/b64'

import BarOpen from '../components-fw/BarOpen.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import InputB from '../components-fw/InputB.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
  backupCf: false
})

const props = defineProps({
  tab: String
})

const tab = ref('export')
watch(tab, async () => { await init() })

const init = async () => {
  if (props.tab === 'restore') tab.value = 'restore'
  if (tab.value === 'restore') reset()
  else {
    const ret = await sf.getSafe()
    if (typeof ret === 'number') {
      if (ret !== -1)
        await ui.diagDisplay($t('STSF_' + ret))
      emit('close', true)
      model.value = false
      return
    } else safe.value = ret
  }
}

onMounted(async () => {
  await init()
})

const safe = ref(null)
const entryP = reactive( { inp: '', err: '', np: 0, shp: null } )
const filename = ref('')

const doExport = async () => {
  entryP.shp = await Crypt.strongHash(entryP.inp, true, true) as Uint8Array
  const hshp = Crypt.shaS(entryP.shp)
  entryP.np = safe.value.auth.hshp1 === hshp ? 1 : (safe.value.auth.hshp2 === hshp ? 2 : 0)
  if (entryP.np === 0) return
  filename.value = 'SafeBox_' + sf.userId + '.bin'
  dialogs.backupCf = true
}

const backupCf = async (n) => {
  if (n === 0) return
  safe.value.auth.actual = { a1k: '', hsha1: '', a2k: '', hsha2: ''}
  safe.value.auth.future = null
  const bin = encode(safe.value)
  const buf: Uint8Array = await Crypt.crypt(entryP.shp, bin) as Uint8Array
  // @ts-ignore
  const blob = new Blob([buf], { type: 'application/octet-stream'})
  saveAs(blob, filename.value)
  await ui.diagDisplay($t('SFXbkpok', [filename.value]))
  emit('done', true)
  emit('close', true)
  model.value = false
}

const fileList = ref(null)
const fd = ref(null)
const keyK = ref(null)
const icvs = ref(null)

const diag = ref('')
const statusSafe = ref(null)
const cfImp = ref(false)
const impSafeStore = ref('')

const reset = () => {
  fileList.value = null
  fd.value = null
  keyK.value = null
  safe.value = null
  icvs.value = null
}

watch(fileList, async (file: any) : Promise<void> => {
  if (file) try {
    fd.value = await readFile(file, true)
    console.log(fd.value.size)
  } catch (e) {
    console.log(e)
    fd.value = null
    await ui.diagDisplay($t('SFXimpsafe_ko1'))
  }
  fileList.value = null
})

const doImport = async () => {
  safe.value = null
  try {
    const shp = await Crypt.strongHash(entryP.inp, true, true) as Uint8Array
    const hshp = Crypt.shaS(shp)
    const bin = await Crypt.decrypt(shp, fd.value.u8)
    safe.value = decode(bin)
    console.log(safe.value.userId)
    const a = safe.value.auth as Auth
    const K = a.hshp1 === hshp ? a.K1 : (a.hshp2 === hshp ? a.K2 : null)
    try {
      keyK.value = K === null ? null : await Crypt.decrypt(shp, keyFromB64(K))
      console.log(keyToB64(keyK.value))
    } catch (e: any) {
      await ui.diagDisplay($t('SFXimpsafe_ko2'))
      keyK.value = null
      return
    }
    icvs.value = await sf.mdUserGetICVS(safe.value.userId)
    if (icvs.value) {
      const op = icvs.value.s
      if (!op) await ui.diagDisplay($t('SFXsafeexists_0'))
      else await ui.diagDisplay($t('SFXsafeexists_1', [op]))
    }
  } catch(e) {
    safe.value = null
    await ui.diagDisplay($t('SFXimpsafe_ko2'))
  }
}

const authPS = async (args) => {
  const _id = safe.value.id
  const _hp0 = safe.value.hp0
  const _Ka = keyFromB64(safe.value.Ka)
  const _hr0 = safe.value.hr0
  const sh = args.sh
  const sh0 = args.sh0
  const hp0 = keyToB64(sh0)
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
  const s = safe.value
  s.hp0 = keyToB64(arg.cash0)
  s.hr0 = keyToB64(arg.crsh0)
  s.hhp1 = Crypt.shaS(arg.cash1)
  s.hhr1 = Crypt.shaS(arg.crsh1)
  s.Ka = keyToB64(await Crypt.crypt(arg.cash, keyK.value))
  s.Kr = keyToB64(await Crypt.crypt(arg.crsh, keyK.value))
  await getStatus(s.id, s.hp0, s.hr0)
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
