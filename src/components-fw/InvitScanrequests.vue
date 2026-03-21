<!-- Mon component
-->
<template>
<div class="column items-center">
<div class="pwsm">
  <div v-if="!ui.currentInvit.zoomed" class="full-width">
    <div v-for="(inv, idx) of invits" :key="inv.invitId"
      :class="clinv(inv, idx) + ' q-my-sm full-width cursor-pointer select'"
      @click="selInv(inv, idx)">
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{$t('services_' + inv.svc)}}</div>
        <div class="col-3 ellipsis text-right text-bold">{{$t('INV_' + inv.major)}}</div>
        <div class="col-3 ellipsis q-pl-sm">{{inv.minor || ''}}</div>
        <div class="col-2 text-right text-bold">{{$t('INVst_' + inv.status)}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{inv.org}}</div>
        <div class="col-8 text-right ellipsis">{{dhcool(inv.time * 1000)}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-12 text-italic text-right q-pr-xs ellipsis">{{inv.comment}}</div>
      </div>
    </div>
  </div>

  <div v-if="ui.currentInvit.zoomed" class="wmd">
    <invit-zoom v-if="ui.currentInvit.invit" v-model="ui.currentInvit.invit"/>
    <div v-else class="titre-md diag">{{$t('INVnotfound')}}</div>
  </div>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'

import stores from '../stores/all'
import { $t, sty, dkli, dhcool } from '../src-fw/util'

import { GetInvit } from '../src-fw/operations'

import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'

type InvitS = {
  svc: string
  org: string
  invitId: string
  time: number
  major: string
  minor: string
  status: number
  comment: string
}

const ui = stores.ui
const sf = stores.safe

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
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
  const inv = invits.value[u.idx] 
  await selInv(inv, idx)
}

const decline = () => {
  
}

const accept = () => {
  
}

const cancel = () => {
  
}

const invits: InvitS[] = computed(() => Array.from(sf.mySafeInvits.values()) )

const isCurrent = (inv) => 
  ui.currentInvit.invit && (ui.currentInvit.invit.invitId === inv.invitId)
const clinv = (inv, idx) => dkli(idx) + (isCurrent(inv) ? ' current ' : ' nocurrent ')

const init = () => {
  const u = ui.currentInvit
  u.zoomed = false
  u.invit = null
  u.inv = null
  u.idx = 0
  u.nb = sf.mySafeInvits.size
  u.fnaccept = accept
  u.fndecline = decline
  u.fncancel = cancel
  u.fnnav = nav
}

init()

const selInv = async (inv, idx) => {
  // Get de l'invit par le service
  const op = new GetInvit(inv.svc, inv.org)
  let id = inv.invitId  // test // 
  if (id.endsWith('$')) id = id.substring(0, id.length - 1)
  const invit = await op.run(id)
  const u = ui.currentInvit
  u.inv = inv
  u.zoomed = true
  u.idx = idx
  if (invit)
    u.invit = invit
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>
