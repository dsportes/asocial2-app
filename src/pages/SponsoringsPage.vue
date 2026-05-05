<template>
<div>
  <div class="column items-center q-pa-sm">

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
        <invit-line v-model="invits[idx]" :selected="isCurrent(inv)" @zoom="selInv(inv, idx)"/>
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
import { InvitList } from '../src-fw/operations'
import { $t, dkli } from '../src-fw/util'

import InvitLine from '../components-fw/InvitLine.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'

const ui = stores.ui

const nav = (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < invits.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < invits.value.length - 1) u.idx = invits.value.length - 1; break }
  }
  const inv = invits.value[u.idx]
  selInv(inv, u.idx)
}

const selInv = (inv, idx) => {
  const u = ui.currentInvit
  u.inv = inv
  u.zoomed = true
  u.newTab = ''
  u.inv = inv || null
}

const selInv0 = () => {
  const u = ui.currentInvit
  u.invit = null
  u.inv = null
  u.zoomed = false
  u.newTab = ''
  const nb = ui.navBar
  nb.idx = 0
  nb.nb = invits.value.length
}

const invits = ref([])
const search = ref(0) // 0: repos 1:en recherche 2:recherche faite
const reset = () => {
  search.value = 0
  invits.value = []
  selInv0()
  ui.currentInvit.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
}

const isCurrent = (inv) => ui.currentInvit.invit && (ui.currentInvit.invit.invitId === inv.invitId)

// Invitation mise à jour : rafraichir la liste
const onUpdate = () => {
  const u = ui.currentInvit
  const acId = u.invit.invitId
  u.zoomed = false
  setTimeout(async () => {
    const sp = ui.sponsoringsPage.spons
    const op = new InvitList(sp.svc, sp.org)
    invits.value = await op.run(sp.major, sp.minor, sp.isSp)
    let idx = -1
    let inv = null
    for(let i = 0; i < invits.value.length; i++) {
      inv = invits.value[i]
      if (inv && inv['invitId'] === acId) { idx = i; break}
    }
    if (idx !== -1) selInv(inv, idx)
    else {
      if (invits.value.length)
        selInv(invits.value[0], 0)
      else selInv0()
    }
  }, 100)
}

watch(() => ui.sponsoringsPage.time, async () => {
  if (ui.sponsoringsPage.spons) 
    await getInvits(ui.sponsoringsPage.spons)
  else reset()
})

// Réinit d'un parcours de la liste récupérée (aucun n'est courant/zoomé)
const getInvits = async (sp: Sponsoring) => {
  search.value = 1
  invits.value = []
  const op = new InvitList(sp.svc, sp.org)
  invits.value = await op.run(sp.major, sp.minor, sp.isSp)
  search.value = 2
  selInv0()
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
