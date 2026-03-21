<!-- Mon component
-->
<template>
<div>
  <div v-if="!sf.invitScan.zoomed" class="column full-width items-center">
    <div v-for="([invitId, inv], idx) of invits" :key="invitId"
      :class="dkli(idx) + ' column full-width cursor-pointer'"
      @click="selInv(inv, idx)">
      <div class="row items-center">
        <div class="row-3 ellipsis">{{$t('services_' + inv.svc)}}</div>
        <div class="row-3 ellipsis">{{inv.org}}</div>
        <div class="row-3 ellipsis">{{$t('Inv_' + inv.major)}}</div>
        <div class="row-3 ellipsis">{{inv.minor || '-'}}</div>
      </div>
      <div class="row items-center">
        <div class="row-3 font-mono"></div>
        <div class="row-3 ellipsis">{{$t('INVst_' + inv.status)}}</div>
        <div class="row-6 ellipsis">{{dhcool(inv.time)}}</div>
      </div>
      <div class="row items-center">
        <div class="row-3 font-mono"></div>
        <div class="row-9 text-italic ellipsis">{{inv.comment}}</div>
      </div>
    </div>
  </div>

  <invit-zoom/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'

import stores from '../stores/all'
import { $t, sty, dkli, dhcool } from '../src-fw/util'

import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe

type Invit = {
  svc: string
  org: string
  invitId: string
  time: number
  major: string
  minor: string
  status: number
  comment: string
}

const init = () => {
  const u = ui.inviScan
  u.zoomed = false
  u.fnback = fnback
  u.fnaccept = fnaccept
  u.fndecline = fndecline
  u.fncancel = fncancel
}

init()

const selInv = (inv, idx) => {
  const u = ui.inviScan
  u.inv = inv
  u.zoomed = true
  u.idx = idx
  u.nb = sf.mySafeInvits.size
}

const fnnav = (x) => { // 1: next 2: prev 3:first 4: last

}

const fnback = () => {

}

const fndecline = () => {
  
}

const fnaccept = () => {
  
}

const fncancel = () => {
  
}

const setCl = () => { clinv.value = (props.selinvit && 
  (props.invit.invitId === props.selinvit.invitId) ? 'current' : 'nocurrent') +
 ' column q-py-xs full-width select cursor-pointer' }

const invits: Map<string, Invit> = computed(() => sf.mySafeInvits )

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
