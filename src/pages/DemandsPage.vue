<template>
  <case-scanrequests/>
</template>

<script setup lang="ts">
import CaseScanrequests from '../components-fw/CaseScanrequests.vue'

// @ts-ignore
// import { ref, watch } from 'vue'

/*
import stores from '../stores/all'
import { Sponsoring } from '../stores/safe-store'
// import { InvitList } from '../src-fw/operations'
import { $t, dkli } from '../src-fw/util'

import InvitLine from '../components-fw/InvitLine.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'

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
  
}

watch(() => ui.demandsPage.time, async () => {
  if (ui.demandsPage.spons) await getInvits(ui.demandsPage.spons)
  else reset()
})

// Réinit d'un parcours de la liste récupérée (aucun n'est courant/zoomé)
const getInvits = async (sp: Sponsoring) => {
  
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
  
}
*/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
