<!-- Dialogue de gestion des listes de credentials
- Events:
  - close
  - done: après mise à jour
-->
<template>
<div>
<dialog-std2 v-model="model" :title="$t('LCRtit_label')" vue="ListcredsMgr"
  hdrclass="tbs" noclose @close="checkClose">
  <template #hdr>
    <div :class="sty() + ' row q-px-xs q-my-xs q-gutter-sm justify-between'">
      <div class="col row q-px-xs q-my-xs q-gutter-xs items-center">
        <div class="titre-md text-italic">{{$t('LCRbtnnew')}}</div>
        <btn-cond :label="$t('LCRbtnnew_f')" @ok="newList(true)" padding="xs"/>
        <btn-cond :label="$t('LCRbtnnew_e')" @ok="newList(false)" padding="xs"/>
      </div>
      <btn-cond class="col-auto"
        icon="check" color="warning"
        :disable="changes.size === 0"
        :label="$t('validate')" @ok="validate">
        <q-badge color="red" floating>{{ changes.size }}</q-badge>
      </btn-cond>
    </div>

    <q-tabs v-model="tab" breakpoint="2000px" dense
      class="tbp shadow-2">
      <q-tab name="lists" :label="$t('LCRtab_l')" />
      <q-tab name="cred" :label="$t('LCRtab_c')" 
        :disable="!curCred"/>
    </q-tabs>

    <div :class="sty() + ' q-py-sm column items-center'">
    <div class="pwmd">
      <div v-if="tab === 'lists'" class="full-width">
        <scroll-area size="md">
          <div v-for="(profId, idx) in sorted" :key="profId">
            <div :class="dkli(idx) + ' q-py-xs row items-start'">
              <q-icon v-if="profId !== curLc" 
                class="col-1 nocur cursor-pointer"
                name="fast_forward" size="32px"
                @click="select(profId)"/>
              <q-icon v-else 
                class="col-1"
                name="fast_forward" size="32px" color="green-5"/>
              <lc-row class="col-11"
                v-model="lcmap[profId]" :lcmap="lcmap"
                @namechange="namechange" @delete="deleteLc"
                @undo="undoLc" @duplicate="duplicateLc"/>
            </div>
          </div>
        </scroll-area>
        <q-checkbox left-label v-model="onlylc" 
          :label="$t('LCRonlylc')"/>
      </div>

      <div v-if="tab === 'cred'" class="full-width q-my-sm">
        <div class="bord1 q-pa-xs">
          <div class="row full-width items-center">
            <div class="col-6 ellipsis">{{ curCred.org }}</div>
            <div class="col-6 ellipsis text-right">{{ $t('services_' + curCred.svc) }}</div>
          </div>
          <div class="row full-width items-conter">
            <div class="col-6 ellipsis">{{ curCred.$trole }}</div>
            <div class="col-6 ellipsis text-right">{{ curCred.docId }}</div>
          </div>
          <div v-if="curCred.comment"
            class="font-mono text-italic fs-md text-right ellipsis">{{ curCred.comment }}</div>
        </div>
        <q-checkbox class="q-mt-sm" left-label v-model="onlycr" 
          :label="$t('LCRonlycr')"/>
      </div>

    </div>
    </div>
  </template>

<template #default>
  <q-separator color="orange" class="q-my-sm"/>

  <div v-if="tab === 'lists' && !curLc" class="q-mx-sm text-center text-italic titre-md text-bold">
    {{ $t('LCRnosel') }}
  </div>

  <div v-if="tab === 'lists' && curLc" class="column items-center full-width">
    <div v-for="(item, idx) in allCreds" :key="item.cred.credId">
      <div v-if="!onlylc || item.chk" class="row items-center q-my-xs pwsm">
        <btn-cond class="col-1" icon="zoom_in" round @ok="selectCr(item)"/>
        <div :class="dkli(idx) + ' col-11 ' + (curCred && item.cred.credId === curCred.credId ? 'current' : 'nocurrent')">
          <div class="row full-width items-center">
            <div class="col-2 row">
              <q-checkbox v-model="item.chk" dense size="sm" @click="clickCB(item)"
                :disable="!curLc"/>
              <q-checkbox v-model="item.chkB" dense size="sm" disable readonly/>
            </div>
            <div class="col-5 ellipsis">{{ item.cred.org }}</div>
            <div class="col-5 ellipsis text-right">{{ $t('services_' + item.cred.svc) }}</div>
          </div>
          <div class="row full-width items-conter">
            <div class="col-2"></div>
            <div class="col-5 ellipsis">{{ $t('CREDON_' + item.cred.docCl )}}</div>
            <div class="col-5 text-right">
              {{ (item.cred.props.name || '') + '[' + item.cred.docPk + ']' }}
            </div>
          </div>
          <div v-if="item.cred.name" class="row full-width items-center">
            <div class="col-2"></div>
            <div class="col-10 font-mono text-italic fs-md text-right ellipsis">{{ item.cred.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'cred'" class="column items-center full-width">
    <div v-for="(it, idx) in lcItems" :key="it.lc.profId">
      <div v-if="!onlycr || it.chk"
        :class="dkli(idx) + ' q-py-xs row items-start pwsm'">
        <div class="col-2 row">
          <q-checkbox v-model="it.chk" dense size="sm" @click="clickLC(it)"/>
          <q-checkbox v-model="it.chkB" dense size="sm" disable readonly/>
        </div>
        <lc-row class="col-10" restricted
          v-model="it.lc" :lcmap="lcmap"
          @namechange="namechange" @delete="deleteLc"
          @undo="undoLc" @duplicate="duplicateLc"/>
      </div>
    </div>
  </div>
</template>
</dialog-std2>

<choose-it v-model="dialogs.close"
  prefix="LCRcredcl" options="pw" 
  @giveup="chooseBack(0)"
  @option="chooseBack"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, onMounted } from 'vue'

import { $t, sty, dkli, isSameSet, cloneSet } from '../src-fw/util'
import stores from '../stores/all'
import { $Credential } from '../src-fw/documents'
import { Crypt } from '../src-fw/crypt'
import { Profile } from '../stores/safe-store'
import { getCredProps } from '../src-fw/operations'

import LcRow from '../components-fw/LcRow.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'

type ListCreds = {
  profId: string
  name: string
  nameB: string // 
  ex: boolean, // existe
  exB: boolean, // existait avant
  crIds: Set<string> // Set des ids des credentials
  crIdsB: Set<string> // Set des ids des credentials avant changement
}

type CredItem = {
  chk: boolean
  chkB: boolean
  cred: $Credential
  k: string
}

type LcItem = {
  chk: boolean
  chkB: boolean
  lc: ListCreds
}

const sf = stores.safe
const ui = stores.ui

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
})

const checkClose = () => {
  if (changes.value.size) dialogs.close = true
  else { model.value = false; emit('close', true)}
}

const chooseBack = (n) => {
  dialogs.close = false
  if (n === 1)
    { model.value = false; emit('close', true)}
}

const tab = ref('lists') // cred
const lcmap = reactive({})
const changes = ref(new Set())
const curLc = ref('') // profId
const curCred = ref()
const sorted = ref([])
const onlylc = ref(false)

const crmap = reactive({})
const allCreds = ref([])
const allCredIds = ref()
const onlycr = ref(false)
const lcItems = ref([])

const init = async () => {
  // Profiles "régularisés" qui référençaient un droit inexistant
  const upds = new Map<string, Profile>()

  for(const p of Object.keys(lcmap))
    delete lcmap[p]

  curLc.value = ''
  curCred.value = null
  changes.value.clear()

  const lst: CredItem[] = []
  const cIds = new Set()
  for(const [crId, c] of sf.mySafeCreds) {
    const t = [
      c.org,
      $t('services_' + c.svc),
      c.docCl,
      c.docPk
    ]
    const it: CredItem = {
      chk: false,
      chkB: false,
      cred: c,
      k: t.join('/')
    }
    crmap[crId] = it
    cIds.add(crId)
    lst.push(it)
    const op = new getCredProps(c.svc, c.org)
    const ok = await op.run(c)
    c.alert = ok ? 0 : 1
  }
  lst.sort((a,b) => a.k < b.k ? -1 : (a.k > b.k ? -1 : 0))
  allCreds.value = lst
  allCredIds.value = cIds

  // Chargement des profiles
  // mySafeProfiles: Ref<Map<string, Profile>> = ref()
  for(const [profId, p] of sf.mySafeProfiles) {
    if (profId === '*') continue

    // Détection des crIds ne référençant plus un credential existant
    const s: string[] = []
    let haslost = false
    for (const crId of p.crIds)
      if (crmap[crId]) s.push(crId); else haslost = true
    if (haslost)
      upds.set(profId, { profId, about: p.about, crIds: s })

    const lc: ListCreds = {
      profId: profId,
      name: p.about || '',
      nameB: p.about || '',
      ex: true,
      exB: true,
      crIds: new Set(s),
      crIdsB: new Set(s)
    }
    lcmap[profId] = lc

  }
  sortLc()
  if (upds.size) {
    const status = await sf.updateProfiles(upds, [])
    if (status < 0 || status !== 0) { 
      if (status !== 0) await ui.diagDisplay($t('STSF_' + status))
      model.value = false
      emit('close', true)
      return 
    }
  }
}

const sortLc = () => {
  const t = Object.keys(lcmap)
  t.sort((a,b) => {
    const na = lcmap[a].name
    const nb = lcmap[b].name
    return na < nb ? -1 : (na > nb ? 1 : 0)
  })
  sorted.value = t
}

const select = (profId) => {
  curLc.value = profId
  const lc = lcmap[profId]
  for(const crId of allCredIds.value) {
    const item = crmap[crId]
    item.chk = lc.crIds.has(crId)
    item.chkB = lc.crIdsB.has(crId)
  }
}

const selectCr = (item) => {
  curCred.value = item.cred
  const cid = item.cred.credId
  tab.value = 'cred'
  const l: LcItem[] = []
  for(const profId of sorted.value) {
    const lc = lcmap[profId]
    const it: LcItem = {
      lc,
      chk: lc.crIds.has(cid),
      chkB: lc.crIdsB.has(cid)
    }
    l.push(it)
  }
  lcItems.value = l
}

const clickCB = (item) => {
  const cb = item.chk
  const credId = item.cred.credId
  const lc = lcmap[curLc.value]
  if (cb) lc.crIds.add(credId)
  else lc.crIds.delete(credId)
  checkChanges()
}

const clickLC = (it: LcItem) =>{
  const cb = it.chk
  const profId = it.lc.profId
  if (cb) it.lc.crIds.add(curCred.value.credId)
  else it.lc.crIds.delete(curCred.value.credId)
  select(profId)
  checkChanges()
}

const namechange = (lc) => {
  sortLc()
  checkChanges()
}
const deleteLc = (lc) => {
  lc.ex = false
  checkChanges()
}
const undoLc = (lc) => {
  lc.ex = lc.exB
  lc.name = lc.nameB
  lc.crIds = cloneSet(lc.crIdsB)
  sortLc()
  checkChanges()
}
const duplicateLc = (lc) => {
  const profId = Crypt.rnd(15)
  const newlc = {
    profId,
    name: profId,
    nameB: profId,
    ex: true,
    exB: false,
    crIds: new Set(cloneSet(lc.crIds)),
    crIdsB: new Set()
  }
  lcmap[profId] = newlc
  sortLc()
  curLc.value = profId
  checkChanges()
}

const newList = (full: boolean) => {
  const profId = Crypt.rnd(15)
  const lc = {
    profId,
    name: profId,
    nameB: profId,
    ex: true,
    exB: false,
    crIds: new Set(full ? cloneSet(allCredIds.value) : []),
    crIdsB: new Set()
  }
  lcmap[profId] = lc
  sortLc()
  select(profId)
  checkChanges()
}

const checkChanges = () => {
  changes.value.clear()
  for(const x in lcmap) {
    const lc = lcmap[x]
    if ((lc.ex && !lc.exB) || (!lc.ex && lc.exB)) 
      { changes.value.add(lc.profId); continue }
    if (lc.name !== lc.nameB)
      { changes.value.add(lc.profId); continue }
    if (!isSameSet(lc.crIds, lc.crIdsB))
      { changes.value.add(lc.profId); continue }
  }
}

const validate = async () => {
  const m = new Map<string, Profile>()
  const lst: string[] = []
  for(const profId of changes.value) {
    const lc: ListCreds = lcmap[profId]
    if (lc.ex)
      m.set(profId, { profId, about: lc.name, crIds: Array.from(lc.crIds) })
    if (!lc.ex && lc.exB)
      lst.push(profId)
  }
  const status = await sf.updateProfiles(m, lst)
  if (status < 0) return
  if (status !== 0)
    await ui.diagDisplay($t('STSF_' + status))
  else {
    changes.value.clear()
    await ui.diagDisplay($t('LCRok'), 3)
    model.value = false
    emit('done', true)
    emit('close', true)
  }
}

onMounted(async () => { 
  await init() 
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.nocur { color: $grey-5;}
.nocur:hover { color:$green-5 !important;}
</style>
