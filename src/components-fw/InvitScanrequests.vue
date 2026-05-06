<!-- Mon component
-->
<template>
<div class="column items-center">
<div class="pwsm">
  <div v-if="!ui.currentInvit.zoomed" class="full-width">
    <div v-if="!invits.length" class="titre-md text-italic q-pa-md">{{ $t('INVnoinvits') }}</div>
    <div v-else v-for="(inv, idx) of invits" :key="inv.invitId"
      :class="clinv(inv, idx) + ' q-my-sm full-width cursor-pointer select'"
      @click="selInv(inv, idx)">
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{$t('services_' + inv.svc)}}</div>
        <div class="col-4 ellipsis text-right text-bold">{{ $t('INV$' + inv.major) }}</div>
        <div class="col-3 ellipsis q-pl-sm">{{inv.minor || ''}}</div>
        <div class="col-1 row items-center justify-end ellipsis">
          <q-icon v-if="inv.lv < inv.v"
            name="fiber_new" size="24px" color="warning"/>
        </div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{inv.org}}</div>
        <div class="col-8 text-right ellipsis">{{dhcool(inv.v)}}</div>
      </div>
    </div>
  </div>

  <div v-if="ui.currentInvit.zoomed" class="pwsm">
    <invit-zoom v-if="ui.currentInvit.invit" class="q-mt-sm"/>
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

import { InvitGet } from '../src-fw/operations'

import InvitZoom from '../components-fw/InvitZoom.vue'
import { MDOperation } from 'src/src-fw/operation'

type InvitS = {
  invitId: string
  svc: string
  org: string
  v: number
  major: string
  minor: string
  lv: number
}

const ui = stores.ui
const sf = stores.safe

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < invits.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < invits.value.length - 1) u.idx = invits.value.length - 1; break }
  }
  const inv = invits.value[u.idx] 
  await selInv(inv, u.idx)
}

const invits: Ref<InvitS[]> = ref([])

const mdInvits = async () => {
  const op = new MDOperation('$mdInvitList')
  op.args.userId = sf.userId
  const res = await op.post()
  invits.value = res && res.invlist ? res.invlist : []
}

const isCurrent = (inv) => 
  ui.currentInvit.invit && (ui.currentInvit.invit.invitId === inv.invitId)
const clinv = (inv, idx) => dkli(idx) + (isCurrent(inv) ? ' current ' : ' nocurrent ')

/* Invitation mise à jour : 
- récupère l'ID de l'invitation courante - acId
- recharge la liste du Safe
- recherche dans la liste rafraichie l'indice de l'invitation d'ID acId
- resélectionne cette invitation à son nouvel indice et rezoom
- si l'invitation a disparu, rezoom sur le premier de la liste
  ou pas rezoom du tout si la liste rafraichie est vide.
*/
const onUpdate = () => {
  const u = ui.currentInvit
  const acId = u.invit.invitId
  u.zoomed = false
  setTimeout(async () => {
    await mdInvits()
    let idx = -1
    let inv = null
    for(let i = 0; i < invits.value.length; i++) {
      inv = invits.value[i]
      if (inv && inv['invitId'] === acId) { idx = i; break}
    }
    if (idx !== -1) await selInv(inv, idx)
    else {
      if (invits.value.length)
        await selInv(invits.value[0], 0)
      else selInv0()
    }
  }, 100)
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

const selInv = async (inv, idx) => {
  // Get de l'invit par le service
  const op = new InvitGet(inv.svc, inv.org)
  const invit = await op.run(inv.invitId, sf.userId)
  const u = ui.currentInvit
  u.inv = inv
  u.zoomed = true
  u.newTab = ''
  u.invit = invit || null
  const nb = ui.navBar
  nb.idx = idx
  nb.nb = invits.value.length
}

const init = async () => {
  await mdInvits()
  selInv0()
  ui.currentInvit.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
}

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>
