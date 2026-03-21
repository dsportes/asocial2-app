<template>
<div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('INV_' + model.major)}}</div>
  </div>
  
  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_status')}}</div>
    <div class='font-mono'>{{$t('INVst_' + model.status)}}</div>
  </div>

  <div v-if="model.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{model.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_time')}}</div>
    <div class='font-mono'>{{dhcool(model.time * 1000)}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <span class="q-ml-xs font-mono">{{model.userId}}</span>
    <span v-if="model.isU" class="q-ml-xs font-mono">({{$t('me')}})</span>
    <span v-if="model.safeStore" class="q-ml-md font-mono">[{{model.safeStore}}]</span>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtm')}}</div>
  <q-input class="q-pa-xs bord1" v-model="model.txtm" type="textarea"
    readonly borderless :rows="5"/>

  <div v-if="model.status > 1 && (model.isSP || model.isU)">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_me')}}</div>
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txti')}}</div>
    <q-input class="q-pa-xs bord1" v-model="model.txti" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="model.status === 5">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtx')}}</div>
    <q-input class="q-pa-xs bord1" v-model="model.txtx" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="(model.status === 2 || model.status >= 4) && (model.isSP || model.isU)"
    class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_cred')}}</div>
    <div class='font-mono'>
      <span>{{model.role}}</span>
      <span v-if="model.docId" class="q-ml-md">[{{model.docId}}]</span>
    </div>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { watch } from 'vue'

import { $t, dhcool } from '../src-fw/util'

const model = defineModel()

watch(model, (v) => {
  console.log(v.userId)
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>