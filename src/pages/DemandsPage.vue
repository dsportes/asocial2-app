<template>
<div>
  <div v-if="ui.demandsPage.tab === 'new'" class="q-pa-sm">
    <invit-newrequest/>
  </div>

  <div v-if="ui.demandsPage.tab === 'list'" class="q-pa-sm">
    <invit-scanrequests/>
  </div>

  <div v-if="ui.demandsPage.tab === 'process'" class="full-width q-pa-sm">
    <div v-if="!ui.currentInvit.zoomed">
      <div v-if="search === 0 && ui.demandsPage.svcOrg.SVC" 
        class="titre-md text-italic q-my-md text-center full-width">
        {{$t('MNOsearch0')}}
      </div>
      <div v-if="search === 1" class="titre-md text-italic q-my-md text-center full-width">
        {{$t('MNOsearch1')}}
      </div>
      <div v-if="search === 2 && (!invits || !invits.length)" 
        class="titre-md text-italic text-warning text-bold q-my-md text-center full-width">
        {{$t('MNOnoinvits')}}
      </div>

      <div v-for="(inv, idx) in invits" :key="inv.invitId" :class="dkli(idx) + ' q-pa-xs'">
        <invit-line v-model="invits[idx]" :selected="isCurrent(inv)" @zoom="zoom(inv, idx)"/>
      </div>
    </div>
    <div v-else class="wmd">
      <invit-zoom v-if="ui.currentInvit.invit" v-model="ui.currentInvit.invit"/>
      <div v-else class="titre-md diag">{{$t('INVnotfound')}}</div>
    </div>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { InvitList } from '../src-fw/operations'
import { $t, dkli } from '../src-fw/util'

import InvitLine from '../components-fw/InvitLine.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'
import InvitNewrequest from '../components-fw/InvitNewrequest.vue'
import InvitScanrequests from '../components-fw/InvitScanrequests.vue'

const ui = stores.ui

const invits = ref()
const search = ref(0) // 0: repos 1:en recherche 2:recherche faite

const isCurrent = (inv) => ui.currentInvit.invit && (ui.currentInvit.invit.invitId === inv.invitId)

const init = () => {
  ui.demandsPage.major = ''
  search.value = 0
  invits.value = []
}

const nav = (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.currentInvit
  switch (n) {
    case 1 : { 
      if (u.idx < invits.value.length - 1) u.idx++
      break
    }
    case 2 : { 
      if (u.idx > 0) u.idx--
      break
    }
    case 3 : { 
      if (u.idx !== 0) u.idx = 0
      break
    }
    case 4 : { 
      if (u.idx < invits.value.length - 1) u.idx = invits.value.length - 1
      break
    }
  }
  u.invit = invits.value[u.idx]
}

const zoom = (inv, idx) => {
  const u = ui.currentInvit
  u.zoomed = true
  u.invit = inv
  u.idx = idx
}

// Invitation mise à jour : rafraichir la liste
const onUpdate = () => {
  console.log('onUpdate dans DemandsPage/process')
  const u = ui.currentInvit
  const acId = u.invit.invitId
  u.zoomed = false
  setTimeout(async () => {
    const svcOrg = ui.demandsPage.svcOrg
    const op = new InvitList(svcOrg.SVC, svcOrg.org)
    invits.value = await op.run(ui.demandsPage.major.value, true)
    let idx = -1
    let inv = null
    for(let i = 0; i < invits.value.length; i++) {
      inv = invits.value[i]
      if (inv.invitId === acId) { idx = i; break}
    }
    if (idx !== -1) zoom(inv, idx)
    else if (invits.value.length) {
      zoom(invits.value[0], 0)
    }
  }, 500)
}

watch(() => [ui.demandsPage.svcOrg.SVC, ui.demandsPage.svcOrg.org], 
  (v) => { init(); init2() })

watch(() => ui.demandsPage.major, async (v) => {
  if (v) await getInvits()
  else init()
})

const getInvits = async () => {
  search.value = 1
  invits.value = []
  const svcOrg = ui.demandsPage.svcOrg
  const op = new InvitList(svcOrg.SVC, svcOrg.org)
  invits.value = await op.run(ui.demandsPage.major.value, true)
  search.value = 2
  init2()
}

const init2 = () => {
  const u = ui.currentInvit
  u.zoomed = false
  u.nb = invits.value.length
  u.fnOnUpdate = onUpdate
  u.fnnav = nav
  u.invit = null
  u.inv = null
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
