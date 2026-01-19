<template> <!-- Gérer les credentials -->
<div>
<dialog-std2 v-model="cm" :title="$t('HPcredsmgr_1')">
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-md">
      <btn-cond class="q-mr-sm" flat size="lg" icon="download" :label="$t('HPimport_0')" 
        @ok="resetImport(); ui.oD(idc2, 'import')"/>
      <btn-cond class="q-mr-sm" flat size="lg" icon="upload" :label="$t('HPexport_0')" 
        @ok="resetExport(); ui.oD(idc2, 'export')"/>
      <btn-cond flat size="lg" icon="check" :label="$t('validate')"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div class="full-width q-pa-sm">

      <bar-open :title="$t('HPcredslst_1')" :bubble="$t('HPcredslst_2')"/>
      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="dkli(idx)" 
          v-for="([id, lc], idx) of mlocCreds" :key="id">
          <div :class="crSel(lc) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selCred(lc)">
            <div class="col-2 row">
              <q-icon v-if="lc.st === 1" name="add_circle" size="18px"/>
              <q-icon v-if="lc.st === 2" name="delete" size="18px"/>
              <div :class="!lc.st || lc.st === 3 ? 'q-ml-md' : ''">
                {{lc.cred.id.substring(0, 5)}}
              </div>
            </div>
            <div class="col-2 ellipsis q-px-xs">{{lc.cred.org}}</div>
            <div class="col-1 ellipsis q-pr-xs">{{lc.cred.type}}</div>
            <div :class="'col-7' + (lc.st === 3 ? ' text-warning text-italic' : '')">{{lc.cred.about}}</div>
          </div>
        </div>
      </q-scroll-area>

      <bar-open class="q-mt-md" :title="$t('HPcredsdet_1')" :bubble="$t('HPcredsdet_2')"/>
      <div class='bord1 q-pa-xs'>
        <div v-if="localCred === null" class="titre-md text-italic">{{$t('HPcredno')}}</div>
        <div v-else class="column">
          <div class="q-my-xs">{{$t('HPcreddet_0', [localCred.cred.org, localCred.cred.type, localCred.cred.clazz])}}</div>
          <div class="q-my-xs">{{localCred.cred.about}}</div>
          <text-zoom :label="$t('HPcreddis')" :text="localCred.cred.toJson"/>
          <btn-cond class="self-end" v-if="localCred.st" flat :icon="icons[localCred.st]" 
            :label="$t('HPcredac_' + localCred.st)" @ok="doAction" color="warning"/>
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted_' + PS)}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div v-for="[psid, ps] in mlocPS" :key="psid">
              <div v-if="ps.mst.has(localCred.id)" class="row items-center q-my-xs">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowD(psid)"/>
                <div class="col-11 font-mono ellipsis">{{ps.about}}</div>
              </div>
            </div>
          </q-scroll-area>
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted_' + PS)}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div v-for="[psid, ps] in mlocPS" :key="psid">
              <div v-if="!ps.mst.has(localCred.id)" class="row items-center q-my-xs">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_upward" @ok="onArrowU(psid)"/>
                <div class="col-11 font-mono ellipsis">{{ps.about}}</div>
              </div>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>
</dialog-std2>

<dialog-std1 v-model="ui.dModels[idc2].import" :title="$t('HPimport_1')" hdrclass='wmd'>
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-md">
      <btn-cond flat size="lg" icon="check" :label="$t('validate')" 
      :disable="locImp === null"
      @ok="doImport"/>
    </div>
  </template>
  <template #default>
    <div class="column q-mx-lg items-center">
      <div class="q-mb-sm">
        <q-option-group :options="importOpts" dense type="radio" v-model="importCr" />
      </div>
      <div v-if="importCr === 2" class="q-my-sm">
        <div class="titre-md text-italic">{{$t('HP3ps')}}</div>
        <input-ps v-model="cryptK" iconcheck
          :sz="[4, 32]" :label="$t('HPimport_p')" :ph="$t('HPimport_ph')" 
          :validate="valK"/>
      </div>

      <q-file v-if="(importCr === 2 && cryptK.key !== null) || importCr === 1"
        class="full-width" dense filled v-model="fileList"
        :label="$t('pickfile')" max-file-size="50000000" max-file="1"/>

      <div v-if="diag !== ''" class="q-my-xs msg2">{{diag}}</div>
      <text-zoom v-if="importedText !== null && importCr !== 3" 
        :label="$t('HPimport_disp')" :text="importedText"/>
    </div>

    <div v-if="importCr === 3" class="bord1">
      <q-toolbar>
        <q-toolbar-title class="titre-md full-width text-center q-pr-xs">{{$t('HPimport_inp')}}</q-toolbar-title>
        <btn-cond icon="zoom_in" flat @ok="zoom"/>
        <btn-cond class="q-ml-xs" icon="zoom_out" flat @ok="unzoom" :disable="rx < 5"/>
        <btn-cond class="q-ml-xs" icon="check" color="warning" round 
          :disable="!importedText" @ok="processText"/>
      </q-toolbar>
      <q-input class="q-pa-xs full-width bord-top" v-model="importedText" 
        type="textarea" :rows="rx"/>
    </div>

    <div v-if="diag === '' && importedText !== null">
      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs q-my-md'>
        <div :class="dkli(idx)" 
          v-for="([id, lc], idx) of locImp" :key="id">
          <div class="row q-my-xs font-mono fs-md items-start">
            <div class="col-2 row">
              <q-checkbox dense v-model="lc.ck" class="q-mr-xs"/>
              <div>{{id.substring(0, 5)}}</div>
            </div>
            <div class="col-2 ellipsis q-px-xs">{{lc.c.org}}</div>
            <div class="col-1 ellipsis q-pr-xs">{{lc.c.type}}</div>
            <div class="col-7">{{lc.c.about}}</div>
          </div>
        </div>
      </q-scroll-area>
      <div class='titre-md text-italic q-my-sm'>{{$t('HPimport_unck')}}</div>
  </div>
  </template>
</dialog-std1>

<dialog-std1 v-model="ui.dModels[idc2].export" :title="$t('HPexport_1')" hdrclass='wmd'>
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-md">
      <btn-cond flat size="lg" icon="check" 
      :disable="exportCr === 2 && cryptK.key === null"
      :label="$t('validate')" 
      @ok="doExport"/>
    </div>
  </template>
  <template #default>
    <div class="column q-mx-lg items-center">
      <div class="q-mb-sm">
        <q-option-group :options="exportOpts" dense type="radio" v-model="exportCr" />
      </div>
      <div v-if="exportCr === 2" class="q-my-sm">
        <div class="titre-md text-italic">{{$t('HP3ps')}}</div>
        <input-ps v-model="cryptK" iconcheck :validate="valK"
          :sz="[4, 32]" :label="$t('HPimport_p')" :ph="$t('HPimport_ph')"/>
      </div>

      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs q-my-md'>
        <div :class="dkli(idx)" 
          v-for="([id, lc], idx) of locExp" :key="id">
          <div class="row q-my-xs font-mono fs-md items-start">
            <div class="col-2 row">
              <q-checkbox dense v-model="lc.ck" class="q-mr-xs"/>
              <div>{{id.substring(0, 5)}}</div>
            </div>
            <div class="col-2 ellipsis q-px-xs">{{lc.c.org}}</div>
            <div class="col-1 ellipsis q-pr-xs">{{lc.c.type}}</div>
            <div class="col-7">{{lc.c.about}}</div>
          </div>
        </div>
      </q-scroll-area>

      <div v-if="exportCr === 2 && cryptK.key === null" 
        class="q-my-xs msg2">{{$t('HPimport_bf0')}}</div>
      <div v-if="exportCr === 1 || (exportCr === 2 && cryptK.key !== null)"
        class='titre-md text-italic q-my-sm'>{{$t('HPexport_unck')}}</div>
      <div v-if="diag !== ''" class="q-my-xs msg2">{{diag}}</div>
  </div>
  </template>
</dialog-std1>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive, onUnmounted, watch, onMounted } from 'vue'
import { saveAs } from 'file-saver'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, sty, equ8, dkli, readFile, fileDescr } from '../src-fw/util'
import stores from '../stores/all'
import { Credential, testCred } from '../src-fw/credential'
import { Crypt } from '../src-fw/crypt'

type LocalPS = { // profile ou session
  id: string
  about: string
  mst: Map<string, number> // Map des statuts des credIds
}

type LocalCred = {
  cred: Credential
  st: number
  psIds: Set<string> // Set des ids des sessions/profiles le référençant
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const icons = ['', 'close', 'redo', 'redo']
/* 
Status d'un credential dans la liste
0 : inchangé
1 : ajouté à la liste
2 : retiré de la liste
3 : about mis à jour
Statut d'un credId dans la liste d'une session
0 : inchangé
1 : ajouté à la liste
2 : retiré de la liste
*/

const importOpts = [
  { label: $t('HPimport_clear'), value: 1 },
  { label: $t('HPimport_crypt'), value: 2 },
  { label: $t('HPimport_txt'), value: 3 }
]

const exportOpts = [
  { label: $t('HPexport_clear'), value: 1 },
  { label: $t('HPexport_crypt'), value: 2 }
]

const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const props = defineProps ({
  idc: String
})

const sf = stores.safe
const ui = stores.ui
const cfg = stores.config

const idc2 = ui.getIdc()
onUnmounted(() => ui.closeVue(idc2))

const cm = computed(() => ui.dModels[props.idc].credsmgr)

const PS = ref(sf.isRegistered ? 'P' : 'S')

const mlocCreds: Ref<Map<string, LocalCred>>= ref(new Map<string, LocalCred>())
const mlocPS: Ref<Map<string, LocalPS>>= ref(new Map<string, LocalPS>())

/* Chargement des credentials */
{
  const x = sf.isRegistered ? sf.mySafeCreds : sf.tcreds
  if (x) for(const [, c] of x)
    mlocCreds.value.set(x.id, { cred: c, st: 0, psIds: new Set() })
}

/* Chargement des profiles / sessions */
{
  const isR = sf.isRegisterd
  const mx = isR ? sf.mySafeProfiles : sf.mySessions
  if (mx) for (const [id, x] of mx) {
    const mst: Map<string, number> = new Map()
    const prf = { id, about: x.about, mst }
    mlocPS.value.set(id, prf)
    for(const credId of (isR ? x.creds : x.credIds)) {
      mst.set(credId, 0)
      const tc = mlocCreds.get(credId)
      if (tc) tc.psIds.add(id)
    }
  }
}

const localCred = ref(null)
const crSel = (lc) => {
  if (!lc) return ''
  let x = localCred.value && localCred.value.cred.id === lc.cred.id ? 'bord2w ' : 'bord2c '
  if (lc.st === 1) x += 'text-bold text-warning '
  else if (lc.st === 2) x += 'text-italic text-grey-7 '
  return x
}

const selCred = (lc) => {
  localCred.value = lc
}

const doAction = () => {

}

const onArrowD = (psid) => {
  console.log(psid)
}

const onArrowU = (psid) => {
  console.log(psid)
}

const importCr = ref(1)
const exportCr = ref(1)

const fileList = ref(null)
const defFd: fileDescr = { name: '', size: 0 }
const fd = ref(defFd)
const cryptK = reactive( { inp: '', err: '', key: null } )
const diag = ref('')

const locImp = ref(null)
const importedText = ref(null)
const locExp = ref(null)

watch(fileList, async (file: any) : Promise<void> => {
  if (file) fd.value = await readFile(file, true)
  await downloadFile()
})

const valK = async () => {
  if (cryptK.err === '') cryptK.key = await Crypt.strongHash(cryptK.inp, true, true)
  else cryptK.key = null
}

const processText = () => {
  try {
    const creds = Credential.parse(importedText.value)
    locImp.value = new Map()
    for(const [id, c] of creds) 
      locImp.value.set(id, { c: c, ck: true })
    diag.value = ''
  } catch (e) {
    locImp.value = null
    importedText.value = null
    diag.value = $t('HPimport_bf3')
  }
}

const downloadFile = async () => {
  fileList.value = null
  try {
    importedText.value = decoder.decode(importCr.value === 2 ? 
      await Crypt.decrypt(cryptK.key, fd.value.u8) : fd.value.u8)
    processText()
  } catch (e) {
    locImp.value = null
    diag.value = $t('HPimport_bf2')
    importedText.value = null
  }
}

const rx = ref(5)
const zoom = () => { rx.value += 10 }
const unzoom = () => { if (rx.value >= 15) rx.value -= 10; else rx.value = 5 }

const doImport = () => {
  if (locImp.value.size) for(const [id, lc] of locImp.value) 
    if (lc.ck) mlocCreds.value.set(id, { cred: lc.c, st: 1, psIds: new Set() })
  ui.fD()
}

const resetImport = () => {
  rx.value = 5
  importCr.value = 1
  fileList.value = null
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  diag.value = ''
  locImp.value = null
  importedText.value = null
}

const resetExport = () => {
  exportCr.value = 1
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  locExp.value = new Map()
  if (mlocCreds.value.size) for(const [id, lc] of mlocCreds.value) 
    if (lc.st !== 2) locExp.value.set(id, { c: lc.cred, ck: true })
}

const doExport = async () => {
  const creds = []
  if (locExp.value.size) for(const [id, lc] of locExp.value) 
    if (lc.ck) creds.push(lc.c)
  const toJson = Credential.toJson(creds)
  // console.log(toJson)
  let buf = encoder.encode(toJson)
  if (exportCr.value === 2) try {
    buf = await Crypt.crypt(cryptK.key, buf)
    if (!buf) {
      diag.value = $t('HPexport_bf2')
      return
    }
  } catch (e) {
    diag.value = $t('HPexport_bf2')
    return
  }
  const nf = 'credentials.json' + (exportCr.value === 2 ? '.bin' : '')
  const blob = new Blob([buf], { type: exportCr.value === 1 ? 'application/json' : 'application/octet-stream'})
  saveAs(blob, nf)
  await ui.diagDisplay($t('HPexport_ok', [nf]))
  // ui.fD()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-top { border-top: 1px solid $grey-5; }
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.select:hover { background-color: $yellow-2; color: black; }
</style>