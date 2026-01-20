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
  <q-tabs v-model="tab" no-caps class="tbp">
    <q-tab name="bycreds" :label="$t('HPtab_c')" />
    <q-tab name="bysessions" :label="$t('HPtab_s')" />
  </q-tabs>

  <div class="column items-center">
    <div v-if="tab === 'bycreds'" class="full-width q-pa-sm">

      <bar-open :title="$t('HPcredslst_1')" :bubble="$t('HPcredslst_2')"/>
      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="dkli(idx)" v-for="([id, lc], idx) of mlocCreds" :key="id">
          <cred-row :class="crSel(lc) + 'q-my-xs cursor-pointer select'" @click="selCred(lc)"
            :cred="lc.cred" :st="lc.st"/>
        </div>
      </q-scroll-area>

      <bar-open class="q-mt-md" :title="$t('HPcredsdet_1')" :bubble="$t('HPcredsdet_2')"/>
      <div class='bord1 q-pa-xs'>
        <div v-if="localCred === null" class="titre-md text-italic">{{$t('HPcredno')}}</div>
        <div v-else class="column">
          <div v-if="localCred.st === 2"> <!-- credential retiré de la liste -->
            <bar-open :title="$t('HPcredac_2')" :fnopen="doAction2" icon="redo" color="primary"/>
            <text-zoom :label="$t('HPcreddis')" :text="origCred.toJson"/>
            <div class="q-my-xs">{{$t('HPcreddet_0', [origCred.org, origCred.type, origCred.clazz])}}</div>
            <div class="q-my-xs">{{origCred.about}}</div>
          </div>

          <div v-if="localCred.st === 1"> <!-- credential importé (n'existait PAS) -->
            <bar-open :title="$t('HPcredac_3')" :fnopen="doAction3" icon="delete" color="warning"/>
            <text-zoom :label="$t('HPcreddis')" :text="localCred.cred.toJson"/>
            <div class="q-my-xs">{{$t('HPcreddet_0', [localCred.cred.org, localCred.cred.type, localCred.cred.clazz])}}</div>
          </div>

          <div v-if="localCred.st === 0 || localCred.st === 3"> <!-- crédential existait, pas importé pas supprimé: about PEUT-ETRE changé -->
            <bar-open :title="$t('HPcredac_1')" :fnopen="doAction4" icon="delete" color="warning"/>
            <text-zoom :label="$t('HPcreddis')" :text="localCred.cred.toJson"/>
            <div class="q-my-xs">{{$t('HPcreddet_0', [localCred.cred.org, localCred.cred.type, localCred.cred.clazz])}}</div>
          </div>

          <!-- existait ou importé, about déjà modifié ou non-->
          <q-input v-if="localCred.st !== 2"
            filled v-model="locabout" 
            :label="$t('HPcrab')"
            input-class="font-mono"
            counter
            :hint="hint"
            bottom-slots
            :error="locabouterr !== ''"
            @keydown.enter.prevent="valAb">
            <template v-slot:append>
              <q-btn size="sm" icon="undo" color="primary" round
                @click="undoAb" :disable="!chgAb || locabouterr !== ''"/>
              <q-btn size="sm" icon="check" :disable="!chgAb || locabouterr !== ''" 
                color="primary" round @click="valAb" />
            </template>
            <template v-slot:error>{{$t(locabouterr)}}</template>
          </q-input>
          
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted_' + PS)}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div v-for="[psid, ps] in mlocPS" :key="psid">
              <div v-if="ps.crids.has(localCred.id)" class="row items-center q-my-xs">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowD(ps)"/>
                <div :class="'col-11 font-mono ellipsis ' + clPSid(psid)">{{ps.about}}</div>
              </div>
            </div>
          </q-scroll-area>
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted_' + PS)}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div v-for="[psid, ps] in mlocPS" :key="psid">
              <div v-if="!ps.crids.has(localCred.id)" class="row items-center q-my-xs">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_upward" @ok="onArrowU(ps)"/>
                <div :class="'col-11 font-mono ellipsis ' + clPSid(psid)">{{ps.about}}</div>
              </div>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </div>

    <div v-if="tab === 'bysessions'" class="full-width q-pa-sm">
      <bar-open :title="$t('HPpslst_1')" :bubble="$t('HPpslst_2')"/>
      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="dkli(idx)" v-for="([id, ps], idx) of mlocPS" :key="id">
          <div :class="psSel(ps) + 'row q-my-xs cursor-pointer select'" @click="selPS(ps)">
            <div class="row-11">{{ps.about}}</div>
            <div class="row-1 font-mono">{{ps.mst.size}}</div>
          </div>
        </div>
      </q-scroll-area>
    </div>
  </div>
</template>
</dialog-std2>

<dialog-std1 v-model="ui.dModels[idc2].import" :title="$t('HPimport_1')" hdrclass='wmd'>
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-md">
      <btn-cond flat size="lg" icon="check" :label="$t('HPimport_0')" 
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
        <div :class="dkli(idx)" v-for="([id, lc], idx) of locImp" :key="id">
          <div class="row q-my-xs items-start">
            <q-checkbox class="col-1" dense v-model="lc.ck"/>
            <cred-row class="col-11" :cred="lc.c" :st="lc.st"/>
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
      :label="$t('HPexport_0')" 
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
        <div :class="dkli(idx)" v-for="([id, lc], idx) of locExp" :key="id">
          <div class="row q-my-xs items-start">
            <q-checkbox class="col-1" dense v-model="lc.ck"/>
            <cred-row class="col-11" :cred="lc.c" :st="lc.st"/>
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
import CredRow from '../components-fw/CredRow.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, sty, equ8, dkli, readFile, fileDescr, isSameSet, cloneSet } from '../src-fw/util'
import stores from '../stores/all'
import { Credential, testCred } from '../src-fw/credential'
import { Crypt } from '../src-fw/crypt'

type LocalPS = { // profile ou session
  id: string
  about: string
  crids: Set<string> // Set des ids des credentials
}

type LocalCred = {
  cred: Credential
  st: number
  psIds: Set<string> // Set des ids des sessions/profiles le référençant
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const aboutSize = [4, 64]
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

const tab = ref('bycreds')
const PS = ref(sf.isRegistered ? 'P' : 'S')

const mlocCreds: Ref<Map<string, LocalCred>> = ref(new Map<string, LocalCred>())
const origCreds: Ref<Map<string, Credential>> = ref()
const mlocPS: Ref<Map<string, LocalPS>> = ref(new Map<string, LocalPS>())
const morigPS: Ref<Map<string, LocalPS>> = ref(new Map<string, LocalPS>())

/* Chargement des credentials */
{
  origCreds.value = sf.isRegistered ? sf.mySafeCreds : sf.tcreds
  if (origCreds.value) for(const [, c] of origCreds.value)
    mlocCreds.value.set(x.id, { cred: Credential.clone(c), st: 0, psIds: new Set() })
}

// simulation pour test
{
  origCreds.value = testCred()
  for(const [, c] of origCreds.value)
    mlocCreds.value.set(c.id, { cred: Credential.clone(c), st: 0, psIds: new Set() })
}

/* Chargement des profiles / sessions */
{
  const isR = sf.isRegisterd
  const mx = isR ? sf.mySafeProfiles : sf.mySessions
  if (mx) for (const [id, x] of mx) {
    const crids: Set<string> = new Set()
    const ocrids: Set<string> = new Set()
    const prf = { id, about: x.about, crids }
    const oprf = { id, about: x.about, crids: ocrids }
    mlocPS.value.set(id, prf)
    morigPS.value.set(id, oprf)
    for(const credId of (isR ? x.creds : x.credIds)) {
      crids.add(credId)
      ocrids.add(credId)
      const tc = mlocCreds.get(credId)
      if (tc) tc.psIds.add(id)
    }
  }
}

const localCred = ref(null)
const origCred = ref(null)
const locabout = ref('')
const chgAb = computed(() => localCred.value.cred.about !== locabout.value )
const locabouterr = computed(() => locabout.value.length < aboutSize[0] ? 'PScourt' : 
  (locabout.value.length > aboutSize[1] ? 'PSlong' : ''))
const hint = computed(() => $t('PSminmax', aboutSize) + (!locabouterr.value ? $t('pressret') : ''))

const crSel = (lc) => !lc ? '' : (localCred.value && localCred.value.cred.id === lc.cred.id ? 'bord2w ' : 'bord2c ')

const selCred = (lc) => {
  localCred.value = lc
  locabout.value = lc.cred.about || ''
  const c = origCreds.value.get(lc.cred.id)
  origCred.value = c ? Credential.clone(c) : null
}

const undoAb = () => {
  if (locabouterr.value !== '' || !chgAb.value) return
  const st = localCred.value.st
  if (st === 1) locabout.value = localCred.value.cred.about || '' // rétablit la valeur importée
  else locabout.value = origCred.value.about // 0 ou 3 (pas importé): rétablit la valeur origine
}

const valAb = () => {
  if (locabouterr.value !== '' || !chgAb.value) return
  const st = localCred.value.st
  if (st === 1) localCred.value.cred.about = locabout.value // importé: ne change rien au statut
  else { // pas importé : statut à 3 si about changé ou remis à 0 si rétabli
    if (origCred.value.about === locabout.value) {
      localCred.value.st = 0
      localCred.value.cred.about = origCred.value.about
    } else {
      localCred.value.st = 3
      localCred.value.cred.about = locabout.value
    }
  }
}

const doAction2 = () => { // REMETTRE dans la liste le cred qui y avait été enlevé
  localCred.value.st = 0
}

const doAction3 = () => { // credential importé (n'existait PAS): RETIRER
  mlocCreds.value.delete(localCred.value.cred.id)
  localCred.value = null
}

const doAction4 = () => { // credential existait (pas importé): RETIRER
  localCred.value.st = 2
}

const onArrowD = (ps) => {
  const e = mlocPS.value.get(ps.id)
  if (e) {
    e.crids.delete(localCred.value.cred.id)
  }
}

const onArrowU = (ps) => {
  const e = mlocPS.value.get(ps.id)
  if (e) {
    e.crids.add(localCred.value.cred.id)
  }
}

const cridsPSChg = (psid) => {
  const ps1 = mlocPS.value.get(psid)
  const ps2 = morigPS.value.get(psid)
  return ps1 && ps2 && isSameSet(ps1.crids, ps2.crids)
}

const clPSid = (psid) => {
  const b = cridsPSChg(psid)
  return !b ? ' text-bold text-warning' : ''
}

const localPS = ref(null)
const origPS = ref(null)

const psSel = (ps) => !lc ? '' : (localPS.value && localPS.value.id === ps.id ? 'bord2w ' : 'bord2c ')

const selPS = (ps) => {
  localPS.value = ps
  const x = morigPS.value.get(ps.id)
  origPS.value = x ? { id: x.id, about: x.about, crids: cloneSet(x.crids) } : null
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
  if (locImp.value.size) 
    for(const [id, lc] of locImp.value)
      if (lc.ck) {
        const orig = origCreds.value.get(lc.c.id)
        if (orig) { // existait avant import : seul son about a PEUT-ETRE changé
          if (orig.about !== lc.c.about)
            mlocCreds.value.set(id, { cred: lc.c, st: 3, psIds: new Set() })
        } else { // n'existait PAS. Import d'un nouveau
          mlocCreds.value.set(id, { cred: lc.c, st: 1, psIds: new Set() })
        }
      }
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