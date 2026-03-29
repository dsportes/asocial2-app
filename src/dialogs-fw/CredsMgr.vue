<!-- Dialogue de gestion des credentials et sessions
- Events:
  - close
  - done: après mise à jour
-->
<template>
<div>
<dialog-std2 v-model="model" :title="$t('HPcredsmgr_1')" vue="CredsMgr">
  <template #hdr>
    <div class="row q-px-xs q-mb-md items-center">
      <q-tabs class="col tbp" v-model="tab" dense>
        <q-tab name="bysessions" :label="$t('HPtab_s')" />
        <q-tab name="bycreds" :label="$t('HPtab_c')" />
      </q-tabs>
      <btn-cond class="col-auto q-mr-md"
        flat size="lg" icon="check" color="warning"
        :label="$t('validate')" @ok="validate"/>
    </div>
  </template>

<template #default>

  <div class="column items-center">
    <div v-if="tab === 'bycreds'" class="full-width q-pa-sm">

      <bar-open :title="$t('HPcredslst_1')" :bubble="$t('HPcredslst_2')"/>
      <scroll-area><template #default>
        <div :class="dkli(idx)" v-for="([xid, lc], idx) of mlocCreds" :key="xid">
          <cred-row :class="crSel(lc) + 'q-my-xs cursor-pointer select'" @click="selCred(lc)"
            :cred="lc.cred" :st="lc.st"/>
        </div>
      </template></scroll-area>

      <div class='q-pa-xs'>
        <div v-if="localCred === null" class="titre-md text-italic">{{$t('HPcredno')}}</div>
        <div v-else class="column">
          <div v-if="localCred.st === 2" class="q-my-md">
            <div v-if="origCred.docId" class="row">
              <div v-if="origCred.name" class="fs-md q-mr-md">{{origCred.name}}</div>
              <div class="font-mono fs-sm">[{{origCred.docId}}]</div>
            </div>
            <div class="q-my-xs">{{$t('HPcreddet_0', [$t('services_' + origCred.svc), origCred.org, $t(origCred.$trole)])}}</div>
            <text-zoom :label="$t('HPcreddis')" :text="origCred.toJson"/>
          </div>
          <div v-else class="q-my-md">
            <div v-if="localCred.cred.docId" class="row">
              <div v-if="localCred.cred.name" class="fs-md q-mr-md">{{localCred.cred.name}}</div>
              <div class="font-mono fs-sm">[{{localCred.cred.docId}}]</div>
            </div>
            <div class="q-my-xs">{{$t('HPcreddet_0', [$t('services_' + localCred.cred.svc), localCred.cred.org, $t(localCred.cred.$trole)])}}</div>
            <text-zoom :label="$t('HPcreddis')" :text="localCred.cred.toJson"/>
          </div>

          <input-a v-if="localCred.st !== 2" class="q-mb-md"
            size="comment" prefix="HPcrab" :initval="initAbCr"
            v-model="loccommentCr" @validate="valAbCr"/>

          <!-- credential supprimé -->
          <div v-if="localCred.st === 2">
            <bar-open :title="$t('HPcredac_2')" @open="doAction2" icon="redo" color="primary"/>
          </div>
          <!-- crédential pas supprimé: comment PEUT-ETRE changé -->
          <div v-if="localCred.st === 0 || localCred.st === 3">
            <bar-open :title="$t('HPcredac_1')" @open="doAction4" icon="delete" color="warning"/>
          </div>

          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted')}}</div>
          <scroll-area size="sm"><template #default>
            <div :class="dkli(idx)" v-for="([psid, ps], idx) in mlocPS1" :key="psid">
              <div :class="psSel(ps) + ' row items-start q-my-xs'">
                <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowD(ps)"/>
                <ps-row class="col-11" :ps="ps"/>
              </div>
            </div>
          </template></scroll-area>
          <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted')}}</div>
          <scroll-area size="sm"><template #default>
            <div :class="dkli(idx)" v-for="([psid, ps], idx) in mlocPS2" :key="psid">
              <div :class="psSel(ps) + ' row items-start q-my-xs'">
                <btn-cond class="col-1" icon="arrow_upward" @ok="onArrowU(ps)"/>
                <ps-row class="col-11" :ps="ps"/>
              </div>
            </div>
          </template></scroll-area>
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
      <scroll-area><template #default>
        <div :class="dkli(idx)" v-for="([psid, ps], idx) of mlocPS" :key="psid">
          <ps-row :ps="ps" :class="psSel(ps) + 'q-my-xs cursor-pointer select'" @click="selPS(ps)"/>
        </div>
      </template></scroll-area>

      <div v-if="!localPS" class="q-mt-md titre-md text-italic text-right">{{$t('HPpsno')}}</div>
      <div v-else class="column">
        <input-a size="sn" prefix="HPpsab" :initval="initAbPs"
          v-model="locAboutPs" @validate="valAbPs"/>

        <div class="row justify-end q-my-sm">
          <btn-cond class="q-mr-xs" icon="undo" :label="$t('restore')" @ok="undoPS"/>
          <btn-cond icon="delete" :label="$t('delete')" color="warning" @ok="delPS"/>
        </div>

        <div class="q-mt-md titre-md text-italic text-right">{{$t('HPlisted_C')}}</div>
        <scroll-area size="sm"><template #default>
          <div :class="dkli(idx)" v-for="([crid, lc], idx) in mlocCreds1" :key="crid">
            <div :class="crSel(lc) + 'row q-my-xs items-start'">
              <btn-cond class="col-1 q-pr-xs" icon="arrow_downward" @ok="onArrowDC(lc)"/>
              <cred-row class="col-11" :cred="lc.cred" :st="lc.st"/>
            </div>
          </div>
        </template></scroll-area>
        <div class="q-mt-md titre-md text-italic text-right">{{$t('HPnotlisted_C')}}</div>
        <scroll-area size="sm"><template #default>
          <div :class="dkli(idx)" v-for="([crid, lc], idx) in mlocCreds2" :key="crid">
            <div :class="crSel(lc) + 'row q-my-xs items-start'">
              <btn-cond class="col-1 q-pr-xs" icon="arrow_upward" @ok="onArrowUC(lc)"/>
              <cred-row class="col-11" :cred="lc.cred" :st="lc.st"/>
            </div>
          </div>
        </template></scroll-area>

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

<dialog-std1 v-model="dialogs.reportIt" :title="$t('HPcfupd')" hdrclass='wmd' vue="CredsMgr">
  <template #hdr>
    <div class="row justify-between q-px-xs q-mb-md">
      <btn-cond flat size="lg" icon="chevron_left" 
        @ok="dialogs.reportIt = false" 
        :label="$t('giveup')"/>
      <btn-cond v-if="!nothingtodo" flat size="lg" icon="check" @ok="confValidate"
        color="warning" :label="$t('iconfirm')"/>
    </div>
  </template>
  <template #default>
    <!--
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

      <div v-for="i in [2, 3]" :key="i">
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
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, dkli, isSameSet, cloneSet } from '../src-fw/util'
import stores from '../stores/all'
import { Credential } from '../src-fw/credential'
import { Crypt } from '../src-fw/crypt'
import { Profile } from '../stores/safe-store'

import CredRow from '../components-fw/CredRow.vue'
import PsRow from '../components-fw/PsRow.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

type LocalPS = { // session
  id: string
  about: string
  exav: boolean, // existait avant
  exap: boolean, // existe après
  chgcr: boolean, // a changé de liste de creds
  chgab: boolean, // a changé de comment
  crIds: Set<string> // Set des ids des credentials
  orphans: Set<string> // Set des ids des credentials N'EXISTANT PAS
}

type LocalCred = {
  cred: Credential
  st: number // 0: inchangé 1:importé/créé 2:supprimé 3:comment corrigé
  psIds: Set<string> // Set des ids des sessions le référençant
}

const sf = stores.safe
const ui = stores.ui

const myModule = 'CredsMgr'
const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
  reportIt: false
})
// onMounted(() => console.log(myModule, "mounted"))
// onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v: boolean) => {
  if(v) init()
  else emit('close', true)
})

const mlocCreds: Ref<Map<string, LocalCred>> = ref()
const mlocPS: Ref<Map<string, LocalPS>> = ref()
const morigPS: Ref<Map<string, LocalPS>> = ref(new Map<string, LocalPS>())
const origCreds: Ref<Map<string, Credential>> = ref()

const init = () => {
  mlocCreds.value = new Map<string, LocalCred>()
  mlocPS.value = new Map<string, LocalPS>()
  morigPS.value = new Map<string, LocalPS>()
  origCreds.value = sf.mySafeCreds

  /* Chargement des credentials */
  for(const [xid, c] of origCreds.value)
    mlocCreds.value.set(xid, { cred: c.clone(), st: 0, psIds: new Set() })
  loading()
}

const cleanup = () => {}

const tab = ref('bysessions')

watch(tab, (t: string) => {
  if (t === 'bycreds' && localCred.value)
    selCred(localCred.value)
  else if (t === 'bysessions' && localPS.value)
    selPS(localPS.value)
})

const buildXref = () => {
  for(const [,lc] of mlocCreds.value) lc.psIds.clear()
  for(const [psId, x] of mlocPS.value) {
    x.orphans.clear()
    for(const xid of x.crIds) {
      const lc = mlocCreds.value.get(xid)
      if (lc && lc.st !== 2) lc.psIds.add(psId)
      else x.orphans.add(xid)
    }
  }
}

/* Chargement des sessions */
const loading = () => {
  for (const [id, x] of (sf.step === 2 ? sf.mySafeProfiles : new Map())) {
    if (x.profId !== '*') {
      const ps1: LocalPS = { id, about: x.about, crIds: new Set(x.crIds), orphans: new Set(),
        exav: true, exap: true, chgab: false, chgcr: false }
      const ps2: LocalPS = { id, about: x.about, crIds: new Set(x.crIds), orphans: new Set(),
        exav: true, exap: true, chgab: false, chgcr: false }
      mlocPS.value.set(id, ps1)
      morigPS.value.set(id, ps2)
      for(const xid of ps1.crIds) {
        const lc = origCreds.value.get(xid)
        if (!lc)
          ps1.orphans.add(xid)
      }
    }
  }
  buildXref()
}

const localCred = ref(null)
const origCred = ref(null)
const mlocPS1 = ref(null)
const mlocPS2 = ref(null)

const loccommentCr = ref('')

const crSel = (lc: LocalCred) => !lc ? '' :
  (localCred.value && localCred.value.cred.id === lc.cred.id ? 'bord2w ' : 'bord2c ')

const selCred = (lc: LocalCred) => {
  localCred.value = lc
  loccommentCr.value = lc.cred.comment || ''
  const c = origCreds.value.get(lc.cred.id)
  origCred.value = c ? c.clone() : null
  mlocPS1.value = new Map()
  mlocPS2.value = new Map()
  for (const [psid, e] of mlocPS.value)
    if (e.crIds.has(localCred.value.cred.id)) mlocPS1.value.set(psid, e)
    else mlocPS2.value.set(psid, e)
}

const initAbCr = computed(() => origCred.value ? origCred.value.comment || '' : '')

const valAbCr = () => {
  const st = localCred.value.st
  if (origCred.value.comment === loccommentCr.value) {
    localCred.value.st = 0
    localCred.value.cred.comment = origCred.value.comment
  } else {
    localCred.value.st = 3
    localCred.value.cred.comment = loccommentCr.value
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
    e.chgcr = chgPSlc(e.id)
    buildXref()
    mlocPS1.value.delete(ps.id)
    mlocPS2.value.set(ps.id, e)
  }
}

const onArrowU = (ps) => {
  const e = mlocPS.value.get(ps.id)
  if (e) {
    e.crIds.add(localCred.value.cred.id)
    e.chgcr = chgPSlc(e.id)
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
const locAboutPs = ref('')

const psSel = (ps: LocalPS) => !ps ? '' :
  (localPS.value && localPS.value.id === ps.id ? 'bord2g ' : 'bord2c ')

const selPS = (ps: LocalPS) => {
  localPS.value = ps
  locAboutPs.value = localPS.value.about
  const x = morigPS.value.get(ps.id)
  origPS.value = x ? { id: x.id, about: x.about, crIds: cloneSet(x.crIds) } : null
  mlocCreds1.value = new Map()
  mlocCreds2.value = new Map()
  for (const [xid, e] of mlocCreds.value)
    if (e.psIds.has(localPS.value.id)) mlocCreds1.value.set(xid, e)
    else mlocCreds2.value.set(xid, e)
}

const initAbPs = computed(() => localPS.value.about )

const valAbPs = async () => {
  localPS.value.about = locAboutPs.value
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

const removeOrph = (xid: string) => {
  localPS.value.crIds.delete(xid)
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
  if (crIds && crIds.size) for(const xid of crIds) ps.crIds.add(xid)
  mlocPS.value.set(id, ps)
  buildXref()
  return ps
}

const new1 = () => {
  const s = new Set<string>()
  for(const [xid, x] of mlocCreds.value) s.add(xid)
  newps(s)
}

const new2 = () => {
  newps()
}

const new3 = () => {
  newps(localPS.value.crIds)
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

  for(const [xid, lc] of mlocCreds.value) {
    report.stcr[lc.st].add(lc.cred.comment)
    if (lc.st === 2) report.delcreds.push(xid)
    if (lc.st === 3) report.mcreds.set(xid, lc.cred)
  }

  for(const [profId, x] of mlocPS.value) {
    const y = morigPS.value.get(profId)
    const maj = (x.exav || x.exap) && (x.chgab || x.chgcr)
    const cre = (!x.exav && x.exap)
    const del = (x.exav && !x.exap)
    if (del) report.delprofs.push(profId)
    if (maj || cre)
      report.mprofs.set(profId, { profId, about: x.about, crIds: Array.from(x.crIds) })

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
  dialogs.reportIt = true
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
    await ui.diagDisplay($t('HPsfop_' + status))
    model.value = false
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
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
