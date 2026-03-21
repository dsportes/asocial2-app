<template>
<div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('INV_' + inv.major)}}</div>
  </div>
  
  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_status')}}</div>
    <div class='font-mono'>{{$t('INVst_' + inv.status)}}</div>
  </div>

  <div v-if="inv.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{inv.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_time')}}</div>
    <div class='font-mono'>{{dhcool(inv.time * 1000)}}</div>
  </div>

  <div v-if="!inv.isU" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <div class='font-mono'>
      <span>{{inv.userId}}</span>
      <span v-if="inv.safeStore" class="q-ml-md">[{{inv.safeStore}}]</span>
    </div>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtm')}}</div>
  <q-input class="q-pa-xs bord1" v-model="inv.txtm" type="textarea"
    readonly borderless :rows="5"/>

  <div v-if="inv.isSP || inv.isU">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_me')}}</div>
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txti')}}</div>
    <q-input class="q-pa-xs bord1" v-model="inv.txti" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="inv.status === 5">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtx')}}</div>
    <q-input class="q-pa-xs bord1" v-model="inv.txtx" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="(inv.status === 2 || inv.status >= 4) && (inv.isSP || inv.isU)"
    class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_cred')}}</div>
    <div class='font-mono'>
      <span>{{inv.role}}</span>
      <span v-if="inv.docId" class="q-ml-md">[{{inv.docId}}]</span>
    </div>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { $t, dhcool } from '../src-fw/util'

const props = defineProps({
  invit: Object // Objet Invitation
})

const inv = ref(props.invit)

watch(() => props.invit, (v) => inv.value = v )

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>