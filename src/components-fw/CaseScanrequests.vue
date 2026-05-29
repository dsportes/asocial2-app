<!-- Mon component
-->
<template>
<div class="column items-center">
<div class="pwsm">
  <div v-if="!ui.currentCase.zoomed" class="full-width">
    <div v-if="!cases.length" class="titre-md text-italic q-pa-md">{{ $t('CASnocases') }}</div>
    <div v-else v-for="(cas, idx) of cases" :key="cas.caseId"
      :class="clcase(cas, idx) + ' q-my-sm full-width cursor-pointer select'"
      @click="selCase(cas, idx)">
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{$t('services_' + cas.svc)}}</div>
        <div class="col-4 ellipsis text-right text-bold">{{ ($t('TOPIC_' + cas.topicId)).substring(2) }}</div>
        <div class="col-3 ellipsis q-pl-sm">{{cas.subject || ''}}</div>
        <div class="col-1 row items-center justify-end ellipsis">
          <q-icon v-if="cas.lv < cas.v"
            name="fiber_new" size="24px" color="warning"/>
        </div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{cas.org}}</div>
        <div class="col-8 text-right ellipsis">{{dhcool(cas.v)}}</div>
      </div>
    </div>
  </div>

  <div v-if="ui.currentCase.zoomed" class="pwsm">
    <case-zoom v-if="ui.currentCase.cas" class="q-mt-sm"/>
    <div v-else class="titre-md diag">{{$t('INVnotfound')}}</div>
  </div>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref, onMounted } from 'vue'

import stores from '../stores/all'
import { $t, dkli, dhcool } from '../src-fw/util'

import { CaseGet } from '../src-fw/operations'
import { Case, DocCase, CaseData } from '../src-fw/documents'

import CaseZoom from '../components-fw/CaseZoom.vue'
import { MDOperation } from 'src/src-fw/operation'

const ui = stores.ui
const sf = stores.safe
const svc = stores.service

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < cases.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < cases.value.length - 1) u.idx = cases.value.length - 1; break }
  }
  const cas = cases.value[u.idx] 
  await selCase(cas, u.idx)
}

const cases: Ref<Case[]> = ref([])

const mdCases = async () => {
  const op = new MDOperation('$mdCaseList')
  op.args.userId = sf.userId
  const res = await op.post()
  const l = res && res.caselist ? res.caselist : []
  if (l.length === 0) cases.value = l
  else {
    const lx: any[] = []
    for(const c of l) {
      lx.push(await Case.newFromMD(c))
      await svc.getSvcOrgTopics(c.svc, c.org)
    }
    cases.value = lx
  }
}

const isCurrent = (cas) => 
  ui.currentCase.case && (ui.currentCase.case.caseId === cas.userId)
const clcase = (cas, idx) => dkli(idx) + (isCurrent(cas) ? ' current ' : ' nocurrent ')

/* Case mise à jour : 
- récupère l'ID de l'invitation courante - acId
- recharge la liste du Safe
- recherche dans la liste rafraichie l'indice de l'invitation d'ID acId
- resélectionne cette invitation à son nouvel indice et rezoom
- si l'invitation a disparu, rezoom sur le premier de la liste
  ou pas rezoom du tout si la liste rafraichie est vide.
*/
const onUpdate = () => {
  const u = ui.currentCase
  const acId = u.cas.caseId
  u.zoomed = false
  setTimeout(async () => {
    await mdCases()
    let idx = -1
    let cas = null
    for(let i = 0; i < cases.value.length; i++) {
      cas = cases.value[i]
      if (cas && cas['caseId'] === acId) { idx = i; break}
    }
    // @ts-expect-error
    if (idx !== -1) await selCase(cas, idx)
    else {
      if (cases.value.length)
        await selCase(cases.value[0], 0)
      else selCase0()
    }
  }, 100)
}

const selCase0 = () => {
  const u = ui.currentCase
  u.cas = null
  u.zoomed = false
  u.newTab = ''
  const nb = ui.navBar
  nb.idx = 0
  nb.nb = cases.value.length
}

const selCase = async (cas: Case, idx: number) => {
  // Get du Case document
  const op = new CaseGet(cas.svc, cas.org)
  const c = await op.run(cas.caseId) as DocCase
  if (c) {
    cas.v = c.v
    cas.status = c.status
    cas.etc = c.etc
    cas.tab = await cas.decryptTab(c.tabX)
  }
  const u = ui.currentCase
  u.cas = cas
  u.zoomed = true
  u.newTab = ''
  const nb = ui.navBar
  nb.idx = idx
  nb.nb = cases.value.length
}

const init = async () => {
  await mdCases()
  selCase0()
  ui.currentCase.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
  ui.navBar.hasback = true
}

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>
