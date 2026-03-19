<template>
<div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('INV_' + invit.major)}}</div>
  </div>
  
  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_status')}}</div>
    <div class='font-mono'>{{$t('INVst_' + invit.status)}}</div>
  </div>

  <div v-if="invit.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{invit.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_time')}}</div>
    <div class='font-mono'>{{dhcool(invit.time * 1000)}}</div>
  </div>

  <div v-if="!invit.isU" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <div class='font-mono'>
      <span>{{invit.userId}}</span>
      <span v-if="invit.safeStore" class="q-ml-md">[{{invit.safeStore}}]</span>
    </div>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtm')}}</div>
  <q-input class="q-pa-xs bord1" v-model="invit.txtm" type="textarea"
    readonly borderless :rows="5"/>

  <div v-if="invit.isSP || invit.isU">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_me')}}</div>
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txti')}}</div>
    <q-input class="q-pa-xs bord1" v-model="invit.txti" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="invit.status === 5">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtx')}}</div>
    <q-input class="q-pa-xs bord1" v-model="invit.txtx" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="(invit.status === 2 || invit.status >= 4) && (invit.isSP || invit.isU)"
    class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_cred')}}</div>
    <div class='font-mono'>
      <span>{{invit.role}}</span>
      <span v-if="invit.docId" class="q-ml-md">[{{invit.docId}}]</span>
    </div>
  </div>

</div>
</template>

<script setup lang="ts">

import { $t, dhcool } from '../src-fw/util'

const props = defineProps({
  invit: Object // Objet Invitation
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>