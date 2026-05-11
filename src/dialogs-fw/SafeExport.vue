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
      <btn-cond class="q-my-md" :label="$t('reset')" icon="undo" @ok="reset"/>

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
        <div v-else> <!-- v-else -->
          <safestore-select v-model="store"/>

          <div class="titre-lg q-mt-md text-italic">{{ $t(initA ? 'UAPv_a' : 'UAPs_a') }}</div>

          <input-b v-model="entryA" size="alias" prefix="Alias"
            @validate="valA"/>
          <div v-if="!initA && !freeA" class="msg">{{ $t('UAPm1_a') }}</div>
          <div v-if="initA && errVA">
            <div class="msg">{{ $t('UAPm3_a') }}</div>
            <btn-cond flat color="primary" :label="$t('UAPc_a')"
              @ok="correcA"/>
          </div>
          <div v-if="!alias" class="msg">{{ $t('UAPdiag_6') }}</div>
        </div>
      </div>

    </div>
    </div>

    </template>
  </dialog-std1>

  <choose-it v-if="dialogs.backupCf" v-model="dialogs.backupCf" 
    prefix="SFXcfex" options="pw" 
    :args="[entryP.np, filename]" @giveup="backupCf(0)" @option="backupCf"/>

  <choose-it v-if="dialogs.importCf" v-model="dialogs.importCf" 
    prefix="SFXcfimp" options="pw" 
    :args="[store || $t('SECsite_std'), alias]" @giveup="importCf(0)" @option="importCf"/>

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
import { Auth, MDuser } from '../stores/safe-store'
import { Crypt } from '../src-fw/crypt'
import { $t, quarter, readFile, coolBye } from '../src-fw/util'
import { keyToB64, keyFromB64 } from '../src-fw/b64'

import BarOpen from '../components-fw/BarOpen.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import InputB from '../components-fw/InputB.vue'
import SafestoreSelect from 'src/components-fw/SafestoreSelect.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const encoder = new TextEncoder()

const ui = stores.ui
const sf = stores.safe

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
  backupCf: false,
  importCf: false
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
const icvs = ref(null)
const userId = ref('')
const keyK = ref(null)
const shp = ref(null)
const hshp = ref(null)
const safe = ref(null)
const store = ref('')

const reset = () => {
  fileList.value = null
  fd.value = null
  safe.value = null
  icvs.value = null
  userId.value = ''
  keyK.value = null
  shp.value = null
  hshp.value = null
  store.value = ''
  resetA()
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
    shp.value = await Crypt.strongHash(entryP.inp, true, true) as Uint8Array
    hshp.value = Crypt.shaS(shp.value)
    const bin = await Crypt.decrypt(shp.value, fd.value.u8)
    safe.value = decode(bin)
    userId.value = safe.value.userId
    const a = safe.value.auth as Auth
    const K = a.hshp1 === hshp.value ? a.K1 : (a.hshp2 === hshp.value ? a.K2 : null)
    try {
      keyK.value = K === null ? null : await Crypt.decrypt(shp.value, keyFromB64(K))
      // console.log(keyToB64(keyK.value))
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

const alias = ref('')
const freeA = ref(true)
const errVA = ref(false)
const initA = ref('')
const entryA = reactive({ inp: '', err: '' })

const resetA = () => {
  alias.value = ''
  entryA.inp = ''
  entryA.err = ''
  initA.value = ''
  freeA.value = true
  errVA.value = false
}

const valA = async () => {
  if (!initA.value) {
    freeA.value = await sf.mdAliasFree(entryA.inp)
    if (freeA.value === -1) { // exception op
      resetA()
      return
    }
    if (freeA.value) { // OK: libre
      initA.value = entryA.inp
      errVA.value = false
      entryA.inp = ''
    }
  } else { // vérification
    if (initA.value === entryA.inp) { // OK
      alias.value = initA.value
      dialogs.importCf = true
    }
    errVA.value = true
  }
}

const correcA = () => {
  entryA.inp = initA.value
  entryA.err = ''
  initA.value = ''
  freeA.value = true
  errVA.value = false
}

const importCf = async (n) => {
  if (n === 0) return
  const d = new Date()
  const llq = quarter(d)
  safe.value.auth.lm = d.getTime()
  safe.value.auth.llq = llq

  const hsha1 = Crypt.shaS(await Crypt.strongHash(alias.value, false, true))
  const a1K = keyToB64(await Crypt.crypt(keyK.value, encoder.encode(alias.value)))
  safe.value.actual = {
    a1K, hsha1, a2K: '', hsha2: ''
  }
  safe.value.future = null

  const mdUser: MDuser = {
    userId: userId.value,
    hshK: safe.value.auth.hshK, 
    hsha1, 
    hsha2: '',
    C: safe.value.auth.C, 
    V: safe.value.auth.D, 
    llq,
    store: store.value
  }

  const status = await sf.restoreSafe(store.value, safe.value, mdUser)
  if (status === -1) return
  if (status)
    await ui.diagDisplay($t('STSF_' + status))
  else {
    await ui.diagDisplay($t('SFXimpok'))
    model.value = false
    ui.backToOpenSession()
  }

}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
