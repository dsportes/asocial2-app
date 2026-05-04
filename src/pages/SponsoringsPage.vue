<template>
<div>
  <div v-if="ui.demandsPage.tab === 'new'" class="q-pa-sm">
    <invit-newrequest/>
  </div>

  <div v-if="ui.demandsPage.tab === 'list'" class="q-pa-sm">
    <invit-scanrequests/>
  </div>

  <div v-if="ui.demandsPage.tab === 'process'" class="column items-center q-pa-sm">
    <div v-if="!ui.currentInvit.zoomed" class="pwmd">
      <div v-if="search === 0" 
        class="titre-md text-italic q-my-xs text-center full-width">
        {{$t('MNOsearch0')}}
      </div>
      <div v-if="search === 1" class="titre-md text-italic q-my-xs text-center full-width">
        {{$t('MNOsearch1')}}
      </div>
      <div v-if="search === 2 && (!invits || !invits.length)" 
        class="titre-md text-italic text-warning text-bold q-my-xs text-center full-width">
        {{$t('MNOnoinvits')}}
      </div>

      <div v-for="(inv, idx) in invits" :key="inv.invitId" :class="dkli(idx) + ' q-pa-xs'">
        <invit-line v-model="invits[idx]" :selected="isCurrent(inv)" @zoom="zoom(inv, idx)"/>
      </div>
    </div>
    <div v-else class="pwmd">
      <invit-zoom v-if="ui.currentInvit.invit"/>
      <div v-else class="titre-md diag">{{$t('INVnotfound')}}</div>
    </div>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { Sponsoring } from '../stores/safe-store'
// import { InvitList } from '../src-fw/operations'
import { $t, dkli } from '../src-fw/util'

import InvitLine from '../components-fw/InvitLine.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'
import InvitNewrequest from '../dialogs-fw/InvitNewrequest.vue'
import InvitScanrequests from '../components-fw/InvitScanrequests.vue'

const ui = stores.ui

const invits = ref([])
const search = ref(0) // 0: repos 1:en recherche 2:recherche faite
const reset = () => {
  search.value = 0
  invits.value = []
}

const isCurrent = (inv) => ui.currentInvit.invit && (ui.currentInvit.invit.invitId === inv.invitId)

const nav = (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.currentInvit
  switch (n) {
    case 1 : { if (u.idx < invits.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < invits.value.length - 1) u.idx = invits.value.length - 1; break }
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
  ui.currentInvit.zoomed = false
  setTimeout(async () => {
    await getInvits2(ui.demandsPage.spons)
  }, 100)
}

// Recalage du courant/zoomé de la liste sur sa nouvelle position après refresh
const getInvits2 = async (sp: Sponsoring) => {
  /*
  const acId = ui.currentInvit.invit.invitId
  const op = new InvitList(sp.svc, sp.org)
  invits.value = await op.run(sp.major, sp.minor, sp.isSp)
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
  */
}

watch(() => ui.demandsPage.time, async () => {
  if (ui.demandsPage.spons) await getInvits(ui.demandsPage.spons)
  else reset()
})

// Réinit d'un parcours de la liste récupérée (aucun n'est courant/zoomé)
const getInvits = async (sp: Sponsoring) => {
  /*
  search.value = 1
  invits.value = []
  const op = new InvitList(sp.svc, sp.org)
  invits.value = await op.run(sp.major, sp.minor, sp.isSp)
  search.value = 2
  const u = ui.currentInvit
  u.zoomed = false
  u.nb = invits.value.length
  u.fnOnUpdate = onUpdate
  u.fnnav = nav
  u.invit = null
  u.inv = null
  */
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
