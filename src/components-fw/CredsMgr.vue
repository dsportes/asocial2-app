<template> <!-- Gérer les credentials -->
<div>
<dialog-std2 v-model="cm" :title="$t('HPcredsmgr_1')">
  <template #hdr>
    <div class="row justify-between q-px-xs q-mb-md">
      <div class="row">
        <btn-cond class="q-mr-sm" flat size="md" icon="download" :label="$t('HPimport_0')" 
          @ok="resetImport(); ui.oD(idc2, 'import')"/>
        <btn-cond class="q-mr-sm" flat size="md" icon="upload" :label="$t('HPexport_0')" 
          @ok="resetExport(); ui.oD(idc2, 'export')"/>
      </div>
      <btn-cond flat size="lg" icon="check" color="warning" 
        :label="$t('validate')" @ok="validate"/>
    </div>
    <q-tabs v-model="tab" dense class="tbp">
      <q-tab name="bysessions" :label="$t('HPtab_s')" />
      <q-tab name="bycreds" :label="$t('HPtab_c')" />
    </q-tabs>
  </template>

<template #default>

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
      <div class='q-pa-xs'>
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

          <input-a v-if="localCred.st !== 2"
            size="about" prefix="HPcrab" :initval="initAbCr"
            v-model="locaboutCr" :validatefn="valAbCr"/>

          <!-- TEST de transmission d'un credential -->
          <q-input outlined v-model="targetName" label="Cible de la transmission (TEST)">
            <template v-slot:append>
              <q-icon size="sm" name="close" @click="targetName = ''" 
                class="cursor-pointer" :disable="targetName.length === 0"/>
              <q-btn size="sm" icon="check" :disable="targetName.length === 0" 
                color="warning" round @click="transmitTest" />
            </template>
          </q-input>
          
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted')}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div :class="dkli(idx)" v-for="([psid, ps], idx) in mlocPS1" :key="psid">
              <div :class="psSel(ps) + ' row items-start q-my-xs'">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowD(ps)"/>
                <ps-row class="col-11" :ps="ps"/>
              </div>
            </div>
          </q-scroll-area>
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted')}}</div>
          <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div :class="dkli(idx)" v-for="([psid, ps], idx) in mlocPS2" :key="psid">            
              <div :class="psSel(ps) + ' row items-start q-my-xs'">
                <btn-cond class="col-1" icon="arrow_upward" @ok="onArrowU(ps)"/>
                <ps-row class="col-11" :ps="ps"/>  
              </div>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </div>

    <div v-if="tab === 'bysessions'" class="full-width q-pa-sm">
      <div class="column q-my-sm q-gutter-xs">
        <div class="titre-md text-bold text-italic">{{ $t('HPnewps_0') }}</div>
        <btn-cond class="q-ml-xl" flat :label="$t('HPnewps_1')" @ok="new1"/>
        <btn-cond class="q-ml-xl" flat :label="$t('HPnewps_2')" @ok="new2"/>
        <btn-cond class="q-ml-xl" flat :label="$t('HPnewps_3')" @ok="new3" :disable="localPS === null"/>
      </div>

      <bar-open :title="$t('HPpslst_1')" :bubble="$t('HPpslst_2')"/>
      <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="dkli(idx)" v-for="([psid, ps], idx) of mlocPS" :key="psid">
          <ps-row :ps="ps" :class="psSel(ps) + 'q-my-xs cursor-pointer select'" @click="selPS(ps)"/>
        </div>
      </q-scroll-area>

      <div v-if="!localPS" class="q-mt-md titre-md text-italic text-right">{{$t('HPpsno')}}</div>
      <div v-else class="column">
        <input-a size="sn" prefix="HPpsab" :initval="initAbPs"
          v-model="locaboutPs" :validatefn="valAbPs"/>

        <div class="row justify-end q-my-sm">
          <btn-cond class="q-mr-xs" icon="undo" :label="$t('restore')" @ok="undoPS"/>
          <btn-cond icon="delete" :label="$t('delete')" color="warning" @ok="delPS"/>
        </div>

        <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted_C')}}</div>
        <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
          class='bord1 q-pa-xs'>
          <div :class="dkli(idx)" v-for="([crid, lc], idx) in mlocCreds1" :key="crid">
            <div :class="crSel(lc) + 'row q-my-xs items-start'">
              <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowDC(lc)"/>
              <cred-row class="col-11" :cred="lc.cred" :st="lc.st"/>
            </div>
          </div>
        </q-scroll-area>
        <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted_C')}}</div>
        <q-scroll-area style="height: 100px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
          class='bord1 q-pa-xs'>
          <div :class="dkli(idx)" v-for="([crid, lc], idx) in mlocCreds2" :key="crid">
            <div :class="crSel(lc) + 'row q-my-xs items-start'">
              <btn-cond class="col-1 q-pr-xs" icon="arrow_upward" @ok="onArrowUC(lc)"/>
              <cred-row class="col-11" :cred="lc.cred" :st="lc.st"/>
            </div>
          </div>
        </q-scroll-area>

        <div v-if="localPS.orphans.size !== 0">
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted_O')}}</div>
          <div class="q-my-xs q-mx-md row q-gutter-md">
            <div v-for="crId in localPS.orphans" class="font-mono text-white bg-warning cursor-pointer" 
              @click="removeOrph(crId)">{{crId}}</div>
          </div>
        </div>

      </div>
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

<dialog-std1 v-model="ui.dModels[idc2].report" :title="$t('HPcfupd')" hdrclass='wmd'>
  <template #hdr>
    <div class="row justify-between q-px-xs q-mb-md">
      <btn-cond flat size="lg" icon="chevron_left" @ok="ui.fD" :label="$t('giveup')"/>
      <btn-cond v-if="!nothingtodo" flat size="lg" icon="check" @ok="confValidate" 
        color="warning" :label="$t('iconfirm')"/>
    </div>
  </template>
  <template #default>
    <!--
      HPstcr_1: 'Droits d\'accès ajoutés : {0}',
      HPstcr_2: 'Droits d\'accès supprimés : {0}',
      HPstcr_3: 'Droits d\'accès mis à jour (à propos) : {0}',
      HPps_1: 'Sessions créées: {0}',
      HPps_2: 'Sessions supprimées: {0}',
      HPps_3: 'Sessions mises à jour (à propos) : {0}',
      HPps_4: 'Sessions mises à jour (droits d\'accès changés) : {0}',
      HPps_5: 'Sessions sans droits d\'accès : {0}',
      HPps_6: 'Sessions référençant des droits d\'accès inconnus : {0}',
    -->
    <div class="column q-pa-sm">
      <div v-if="nothingtodo" 
      class="titre-lg q-pa-md self-center text-italic q-my-sm bord1 text-warning">
        {{$t('HPnothing')}}</div>

      <div v-for="i in 3">
        <div :class="'titre-md q-mt-sm ' + clr1(i)">
          {{ $t('HPstcr_' + i, [report.stcr[i].size]) }}</div>
        <div v-if="report.stcr[i].size" class="font-mono fs-sm q-px-md q-my-sm">
          <div v-for="t in report.stcr[i]" :key="t" class="column">{{ t }}</div>
        </div>
      </div>
      <div v-for="i in 6">
        <div :class="'titre-md q-mt-sm ' + clr2(i)">
          {{ $t('HPps_' + i, [report.stps[i].size]) }}</div>
        <div v-if="report.stps[i].size" class="font-mono fs-sm q-px-md q-my-sm">
          <div v-for="t in report.stps[i]" :key="t" class="column">{{ t }}</div>
        </div>
      </div>
    </div>
  </template>
</dialog-std1>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, onUnmounted, watch } from 'vue'
// @ts-ignore
import { saveAs } from 'file-saver'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import CredRow from '../components-fw/CredRow.vue'
import PsRow from './PsRow.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputPs from '../components-fw/InputPs.vue'
import InputA from '../components-fw/InputA.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, dkli, readFile, fileDescr, isSameSet, cloneSet } from '../src-fw/util'
import stores from '../stores/all'
import { Credential, testCred } from '../src-fw/credential'
import { Crypt } from '../src-fw/crypt'
import { Profile } from '../stores/safe-store'

type LocalPS = { // session
  id: string
  about: string
  exav: boolean, // existait avant
  exap: boolean, // existe après
  chgcr: boolean, // a changé de liste de creds
  chgab: boolean, // a changé d'about
  crIds: Set<string> // Set des ids des credentials
  orphans: Set<string> // Set des ids des credentials N'EXISTANT PAS
}

type LocalCred = {
  cred: Credential
  st: number // 0: inchangé 1:importé/créé 2:supprimé 3:about corrigé
  psIds: Set<string> // Set des ids des sessions le référençant
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const aboutSize = [4, 64]

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

const idc2 = ui.getIdc()
onUnmounted(() => ui.closeVue(idc2))

const emit = defineEmits(['updated'])

const cm = computed(() => ui.dModels[props.idc].credsmgr)

const tab = ref('bysessions')

watch(tab, (t: string) => {
  if (t === 'bycreds' && localCred.value)
    selCred(localCred.value)
  else if (t === 'bysessions' && localPS.value)
    selPS(localPS.value)
})

const mlocCreds: Ref<Map<string, LocalCred>> = ref(new Map<string, LocalCred>())
const mlocPS: Ref<Map<string, LocalPS>> = ref(new Map<string, LocalPS>())
const morigPS: Ref<Map<string, LocalPS>> = ref(new Map<string, LocalPS>())

const origCreds = computed(() => sf.mySafeCreds)
// const origCreds = ref(testCred()) // simulation pour test
/* Chargement des credentials */
for(const [, c] of origCreds.value)
  mlocCreds.value.set(c.id, { cred: Credential.clone(c), st: 0, psIds: new Set() })

const buildXref = () => {
  for(const [,lc] of mlocCreds.value) lc.psIds.clear()
  for(const [psId, x] of mlocPS.value) {
    x.orphans.clear()
    for(const crId of x.crIds) {
      const lc = mlocCreds.value.get(crId)
      if (lc && lc.st !== 2) lc.psIds.add(psId)
      else x.orphans.add(crId)
    }
  }
}

/* Chargement des sessions */
const loading = () => {
  for (const [id, x] of sf.mySafeProfiles) {
    if (x.profId !== '*') {
      const ps1: LocalPS = { id, about: x.about, crIds: new Set(x.crIds), orphans: new Set(),
        exav: true, exap: true, chgab: false, chgcr: false }
      const ps2: LocalPS = { id, about: x.about, crIds: new Set(x.crIds), orphans: new Set(),
        exav: true, exap: true, chgab: false, chgcr: false }
      mlocPS.value.set(id, ps1)
      morigPS.value.set(id, ps2)
      for(const crId of ps1.crIds) {
        const lc = origCreds.value.get(crId)
        if (!lc) 
          ps1.orphans.add(crId)
      }
    }
  }
  buildXref()
}

loading()

const localCred = ref(null)
const origCred = ref(null)
const mlocPS1 = ref(null)
const mlocPS2 = ref(null)

const locaboutCr = ref('')

const crSel = (lc: LocalCred) => !lc ? '' : 
  (localCred.value && localCred.value.cred.id === lc.cred.id ? 'bord2w ' : 'bord2c ')

const selCred = (lc: LocalCred) => {
  localCred.value = lc
  locaboutCr.value = lc.cred.about || ''
  const c = origCreds.value.get(lc.cred.id)
  origCred.value = c ? Credential.clone(c) : null
  mlocPS1.value = new Map()
  mlocPS2.value = new Map()
  for (const [psid, e] of mlocPS.value)
    if (e.crIds.has(localCred.value.cred.id)) mlocPS1.value.set(psid, e)
    else mlocPS2.value.set(psid, e)
}

const initAbCr = computed(() => 
  localCred.value.st === 1 ? localCred.value.cred.about || '' 
  : (origCred.value ? origCred.value.about || '' : ''))

const valAbCr = () => {
  const st = localCred.value.st
  if (st === 1) localCred.value.cred.about = locaboutCr.value // importé: ne change rien au statut
  else { // pas importé : statut à 3 si about changé ou remis à 0 si rétabli
    if (origCred.value.about === locaboutCr.value) {
      localCred.value.st = 0
      localCred.value.cred.about = origCred.value.about
    } else {
      localCred.value.st = 3
      localCred.value.cred.about = locaboutCr.value
    }
  }
}

const doAction2 = () => { // REMETTRE dans la liste le cred qui y avait été enlevé
  localCred.value.st = 0
  buildXref()
}

const doAction3 = () => { // credential importé (n'existait PAS): RETIRER
  mlocCreds.value.delete(localCred.value.cred.id)
  localCred.value = null
  buildXref()
}

const doAction4 = () => { // credential existait (pas importé): RETIRER
  localCred.value.st = 2
  buildXref()
}

const onArrowD = (ps) => {
  const e = mlocPS.value.get(ps.id)
  if (e) {
    e.crIds.delete(localCred.value.cred.id)
    buildXref()
    mlocPS1.value.delete(ps.id)
    mlocPS2.value.set(ps.id, e)
  }
}

const onArrowU = (ps) => {
  const e = mlocPS.value.get(ps.id)
  if (e) {
    e.crIds.add(localCred.value.cred.id)
    buildXref()
    mlocPS2.value.delete(ps.id)
    mlocPS1.value.set(ps.id, e)
  }
}

const chgPSlc = (psid) => {
  const ps1 = mlocPS.value.get(psid)
  const ps2 = morigPS.value.get(psid)
  return !(ps1 && ps2 && isSameSet(ps1.crIds, ps2.crIds))
}

const localPS = ref(null)
const origPS = ref(null)
const mlocCreds1 = ref(null) // Map des creds référençant le PS courant
const mlocCreds2 = ref(null) // Map des creds NE référençant PAS le PS courant
const locaboutPs = ref('')

const psSel = (ps: LocalPS) => !ps ? '' :
  (localPS.value && localPS.value.id === ps.id ? 'bord2g ' : 'bord2c ')

const selPS = (ps: LocalPS) => {
  localPS.value = ps
  locaboutPs.value = localPS.value.about
  const x = morigPS.value.get(ps.id)
  origPS.value = x ? { id: x.id, about: x.about, crIds: cloneSet(x.crIds) } : null
  mlocCreds1.value = new Map()
  mlocCreds2.value = new Map()
  for (const [crid, e] of mlocCreds.value)
    if (e.psIds.has(localPS.value.id)) mlocCreds1.value.set(crid, e)
    else mlocCreds2.value.set(crid, e)
}

const initAbPs = computed(() => localPS.value.about )

const valAbPs = async () => {
  localPS.value.about = locaboutPs.value
  localPS.value.chgab = true
  mlocPS.value.set(localPS.value.id, localPS.value)
}

const delPS = () => {
  if (localPS.value.exav) {
    localPS.value.exap = false
    localPS.value.crIds = new Set()
    localPS.value.about = ''
    localPS.value.chgab = false
    localPS.value.chgcr = false
    mlocPS.value.set(localPS.value.id, localPS.value)
  } else {
    mlocPS.value.delete(localPS.value.id)
  }
  localPS.value = null
}

const undoPS = () => {
  const av = morigPS.value.get(localPS.value.id)
  if (!av) {
    mlocPS.value.delete(localPS.value.id)
    localPS.value = null
  } else {
    localPS.value.crIds = cloneSet(av.crIds)
    localPS.value.about = av.about
    localPS.value.chgab = false
    localPS.value.chgcr = false
    mlocPS.value.set(localPS.value.id, localPS.value)
  }
}

const removeOrph = (crid: string) => {
  localPS.value.crIds.delete(crid)
  localPS.value.chgcr = true
  mlocPS.value.set(localPS.value.id, localPS.value)
  buildXref()
  selPS(localPS.value)
}

const onArrowDC = (lc: LocalCred) => {
  const e = mlocCreds.value.get(lc.cred.id)
  if (e) {
    localPS.value.crIds.delete(lc.cred.id)
    localPS.value.chgcr = chgPSlc(localPS.value.id)
    mlocPS.value.set(localPS.value.id, localPS.value)
    buildXref()
    mlocCreds1.value.delete(lc.cred.id)
    mlocCreds2.value.set(lc.cred.id, e)
  }
}

const onArrowUC = (lc: LocalCred) => {
  const e = mlocCreds.value.get(lc.cred.id)
  if (e) {
    localPS.value.crIds.add(lc.cred.id)
    localPS.value.chgcr = chgPSlc(localPS.value.id)
    mlocPS.value.set(localPS.value.id, localPS.value)
    buildXref()
    mlocCreds2.value.delete(lc.cred.id)
    mlocCreds1.value.set(lc.cred.id, e)
  }
}

const newps = (crIds?: Set<string>) : LocalPS => {
  const id = Crypt.shaS(Crypt.random(32))
  const ps: LocalPS = { id, about: id, crIds: new Set(), orphans: new Set(),
    exav: false, exap: true, chgab: false, chgcr: false
  }
  if (crIds && crIds.size) for(const crId of crIds) ps.crIds.add(crId)
  mlocPS.value.set(id, ps)
  buildXref()
  return ps
}

const new1 = () => {
  const s = new Set<string>()
  for(const [id, x] of mlocCreds.value) s.add(id)
  newps(s)
}

const new2 = () => {
  newps()
}

const new3 = () => {
  newps(localPS.value.crIds)
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
  buildXref()
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
  let buf
  if (exportCr.value === 2) try {
    buf = await Crypt.crypt(cryptK.key, encoder.encode(toJson))
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

type Report = {
  mcreds: Map<string, Credential>
  delcreds: string[]
  mprofs: Map<string, Profile>
  delprofs: string[]
  emptyPS: Set<string>
  psWithOrphans: Set<string>
  xrefsPS: Map<string, Set<string>>
  stcr: Set<string>[]
  stps: Set<string>[]
}

const report: Report = reactive({
  mcreds: null,
  delcreds: null,
  mprofs: null,
  delprofs: null,
  emptyPS: null,
  stcr: null,
  stps: null
})

const nothingtodo = ref(true)

const validate = () => {
  report.mcreds = new Map<string, Credential>() 
  report.delcreds = [] 
  report.mprofs = new Map<string, Profile>()
  report.delprofs = []
  report.emptyPS = new Set()
  report.psWithOrphans = new Set()
  report.stcr = [ new Set(), new Set(), new Set(), new Set()]
  report.stps = [ null, new Set(), new Set(), new Set(), new Set(), new Set(), new Set()]

  for(const [crId, lc] of mlocCreds.value) {
    report.stcr[lc.st].add(lc.cred.about)
    if (lc.st === 2) report.delcreds.push(crId)
    if (lc.st === 1 || lc.st === 3) report.mcreds.set(crId, lc.cred)
  }

  for(const [profId, x] of mlocPS.value) {
    const y = morigPS.value.get(profId)
    const maj = (x.exav || x.exap) && (x.chgab || x.chgcr)
    const cre = (!x.exav && x.exap)
    const del = (x.exav && !x.exap)
    if (del) report.delprofs.push(profId)
    if (maj || cre)
      report.mprofs.set(profId, { profId, about: x.about, 
          crIds: Array.from(x.crIds) })
    
    /*
    HPps_1: 'Sessions créées: {0}',
    HPps_2: 'Sessions supprimées: {0}',
    HPps_3: 'Sessions mises à jour (à propos) : {0}',
    HPps_4: 'Sessions mises à jour (droits d\'accès changés) : {0}',
    HPps_5: 'Sessions sans droits d\'accès : {0}',
    HPps_6: 'Sessions référençant des droits d\'accès inconnus : {0}',
    */
    if (cre) report.stps[1].add(x.about)
    if (del) report.stps[2].add(x.about)
    if (maj && x.chgab) report.stps[3].add(x.about)
    if (maj && x.chgcr) report.stps[4].add(x.about)
    if (x.exap && x.crIds.size === 0) report.stps[5].add(x.about)
    if ((x.exap && x.orphans.size)) report.stps[6].add(x.about)
  }
  nothingtodo.value = !report.mcreds.size && !report.delcreds.length
    && !report.mprofs.size && !report.delprofs.length
  ui.oD(idc2, 'report')
}

const clr1 = (i) => {
  const n =  report.stcr[i].size
  return n ? ' bg-yellow-3 text-black text-bold' : ''
}

const clr2 = (i) => {
  const n =  report.stps[i].size
  return n ? ' bg-yellow-3 text-black text-bold' : ''
}

const confValidate = async () => {
  try {
    const status = await sf.updateCreds(
      report.mcreds, report.delcreds, report.mprofs, report.delprofs)
    if (status < 0) return
    ui.fD()
    await ui.diagDisplay($t('HPsfop_' + status))
    emit('updated', null)
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const targetName = ref('')
const transmitTest = async () => {
  const c = localCred.value.cred
  const status = await sf.transmitCred(c, targetName.value)
  console.log(status)
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-top { border-top: 1px solid $grey-5; }
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.bord2g { border: 1px solid $green-5; }
.select:hover { background-color: $yellow-2; color: black; }
</style>