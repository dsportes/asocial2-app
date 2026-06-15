<template>
<div>
  <div class="column items-center q-pa-sm">

    <div v-if="!ui.currentCase.zoomed" class="pwmd">

      <div v-for="(cas, idx) in cases" :key="cas.caseId" :class="dkli(idx) + ' q-pa-xs'">
        <case-line v-model="cases[idx]" :selected="isCurrent(cas)" 
          @zoom="selCas(cas, idx)"/>
      </div>

    </div>

    <div v-else class="pwmd">
      <cas-zoom v-if="ui.currentCase.cas"/>
      <div v-else class="titre-md diag">{{$t('INVnotfound')}}</div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, watch, computed } from 'vue'

import stores from '../stores/all'
import { $t, dkli } from '../src-fw/util'
import { Case } from '../src-fw/documents'
import CaseLine from '../components-fw/CaseLine.vue'
import CaseZoom from '../components-fw/FormZoom.vue/index.js'

const ui = stores.ui
const session = stores.session
const sf = stores.safeStore

const manager = computed(() => ui.sponsoringsPage.manOpt && ui.sponsoringsPage.manOpt.value)
const filter = ref(null)

const ok: Ref<boolean> = computed(() => {
  const e = ui.sponsoringsPage.err
  return (e === 0 || (manager.value && e === 3))
})

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < cases.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < cases.value.length - 1) u.idx = cases.value.length - 1; break }
  }
  const cas = cases.value[u.idx]
  selCas(cas, u.idx)
}

const cases: Ref<Case[]> = ref([])

const selCas = (cas: Case, idx: number) => {
  const u = ui.currentCase
  u.cas = cas
  u.zoomed = true
  u.newTab = ''
  const nb = ui.navBar
  nb.idx = idx
  nb.nb = cases.value.length
}

const selCas0 = () => {
  const u = ui.currentCas
  u.cas = null
  u.zoomed = false
  u.newTab = ''
  const nb = ui.navBar
  nb.idx = 0
  nb.nb = cases.value.length
}

const isCurrent = (cas: Case) => ui.currentCase.cas && (ui.currentCase.cas.caseId === cas.caseId)

// Cas mise à jour : rafraichir la liste
const onUpdate = () => {
  const u = ui.currentCase
  const acId = u.cas.caseId
  u.zoomed = false
  setTimeout(async () => {
    cases.value = await Case.getList(session.currentSvc, session.currentOrg, manager.value)
    let idx = -1
    let cas: Case = null
    for(let i = 0; i < cases.value.length; i++) {
      cas = cases.value[i]
      if (cas && cas.caseId === acId) { idx = i; break}
    }
    if (idx !== -1) selCas(cas, idx)
    else {
      if (cases.value.length)
        selCas(cases.value[0], 0)
      else selCas0()
    }
  }, 100)
}

const reset0 = () => {
  selCas0()
  filter.value = manager.value ? null : sf.caseFilter(session.svc, session.org)
  ui.currentCase.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
  ui.navBar.hasback = true
}

watch(() => ui.sponsoringsPage.time, async () => {
  cases.value = !ok ? [] : await Case.getList(session.currentSvc, session.currentOrg, filter.value)
  reset0()
})

reset0()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
