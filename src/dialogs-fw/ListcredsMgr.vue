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
              <lc1-row class="col-11"
                v-model="lcmap[profId]" :lcmap="lcmap"
                @namechange="namechange" @delete="deleteLc"
                @undo="undoLc" @duplicate="duplicateLc"/>
            </div>
          </div>
        </scroll-area>
      </div>

      <div v-if="tab === 'cred'" class="full-width">
        
      </div>
    </div>
    </div>
  </template>

<template #default>
  <q-separator color="orange" class="q-my-sm"/>
  <div v-if="tab === 'lists" class="column items-center">
    <div v-for="(item, idx) in allCreds" :key="item.cred.credId">
      <div :class="dkli(idx) + ' q-py-sm row items-start'">
        <btn-cond class="col-1" icon="fast_forward" @ok="selectCr(item)"/>
        <div class="col-11 column">
          <div class="row">
            <div class="col-2 row justify-betwwen">
              <q-checkbox v-model="item.chk" @click="clickCB(item)"/>
              <q-checkbox v-model="item.chkB" disable/>
            </div>
            <div class="col-5 ellipsis">{{ item.cred.org }}</div>
            <div class="col-5 ellipsis">{{ $t('services_' + item.cred.svc) }}</div>
          </div>
          <div class="row">
            <div class="col-2"></div>
            <div class="col-5 ellipsis">{{ $t(item.cred.$trole) }}</div>
            <div class="col-5 ellipsis">{{ item.cred.docId }}</div>
          </div>
          <div v-if="item.cred.comment" class="row">
            <div class="col-2"></div>
            <div class="col-10 font-mono text-italic fs-md text-right ellipsis">{{ item.cred.comment }}</div>
          </div>
        </div>
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
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, sty, dkli, isSameSet, cloneSet } from '../src-fw/util'
import stores from '../stores/all'
import { Credential } from '../src-fw/documents'
import { Crypt } from '../src-fw/crypt'

import Lc1Row from '../components-fw/Lc1Row.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
// import DialogStd1 from '../dialogs-fw/DialogStd1.vue'
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
  cred: Credential
  k: string
}

const sf = stores.safe
const ui = stores.ui

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
})

const checkClose = () => {
  if (changes.value.size) dialogs.close = true
  else model.value = false
}

const chooseBack = (n) => {
  dialogs.close = false
  if (n === 1)
    model.value = false
}

const tab = ref('lists') // cred
const lcmap = reactive({})
const changes = ref(new Set())
const curLc: Ref<ListCreds> = ref()
const curCred = ref()
const sorted = ref([])

const crmap = reactive({})
const allCreds = ref([])

const init = () => {
  for(const p of Object.keys(lcmap))
    delete lcmap[p]

  curLc.value = null
  curCred.value = null
  changes.value.clear()

  const lst: CredItem[] = []
  for(const [crId, c] of sf.mySafeCreds) {
    const t = [
      c.org,
      $t('services_' + c.svc),
      $t(c.$trole),
      c.docId
    ]
    const it: CredItem = {
      chk: false,
      chkB: false,
      cred: c,
      k: t.join('/')
    }
    crmap[crId] = c
    lst.push(it)
  }
  lst.sort((a,b) => a.k < b.k ? -1 : (a.k > b.k ? -1 : 0))
  allCreds.value = lst

  // Chargement des profiles
  // mySafeProfiles: Ref<Map<string, Profile>> = ref()
  for(const [profId, p] of sf.mySafeProfiles) {
    if (profId === '*') continue
    const lc: ListCreds = {
      profId: profId,
      name: p.about || '',
      nameB: p.about || '',
      ex: true,
      exB: true,
      crIds: new Set(p.crIds),
      crIdsB: new Set(p.crIds)
    }
    lcmap[profId] = lc
  }
  sortLc()
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
  // TODO
}

const selectCr = (item) => {

}
const clickCB = (item) => {
  console.log(item.chk)
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
    crIds: new Set(full ? cloneSet(allCreds.value) : []),
    crIdsB: new Set()
  }
  lcmap[profId] = lc
  sortLc()
  curLc.value = profId
  checkChanges()
}

/*
type ListCreds = {
  profId: string
  name: string
  nameB: string // 
  ex: boolean, // existe
  exB: boolean, // existait avant
  crIds: Set<string> // Set des ids des credentials
  crIdsB: Set<string> // Set des ids des credentials avant changement
}
*/

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
  for(const profId of changes.value)
    console.log(profId)
  /*
  try {
    const status = await sf.updateCreds()
    if (status < 0) return
    await ui.diagDisplay($t('HPsfop_' + status))
    dialogs.reportIt = false
    model.value = false
  } catch (e: any) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
  */
}

init()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.nocur { color: $grey-5;}
.nocur:hover { color:$green-5 !important;}
</style>
