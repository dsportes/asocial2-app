<template>
<div>
  <div v-if="notView && model.invit.userId !== sf.userId" 
    class='titre-md text-bold text-warning text-italic'>
    {{$t('INVxnotv_s')}}</div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('INV_' + model.invit.major)}}</div>
  </div>
  
  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVbyU')}}</div>
    <div class="text-bold">{{$t('INVbyU_' + (model.invit.byU ? 't' : 'f'))}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_v')}}</div>
    <div class='font-mono'>{{dhcool(model.invit.v)}}</div>
  </div>

  <div v-if="model.invit.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{model.invit.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <span class="q-ml-xs font-mono">{{model.invit.userId}}</span>
    <span v-if="model.invit.userId === sf.userId" class="q-ml-xs font-mono">({{$t('me')}})</span>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_tab')}}</div>
  <md-editor class="full-width q-pa-xs" v-model="model.newTab"
    :texte="model.invit.tab" editable modetxt/>

  <div v-if="model.invit.etc !== null">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_opts')}}</div>
    <scroll-md class="full-width bord1 q-pa-xs" height="100px" 
      :text="opts" />
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'

import { $t, dhcool } from '../src-fw/util'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import { MDOperation } from 'src/src-fw/operation'
const sf = stores.safe
const ui = stores.ui

const model = defineModel()

const notView = computed(() => model.value.inv.lv < model.value.invit.v )
// watch(model, (v) => { console.log(v.userId) })

const newTab = ref()

watch(newTab, (v) => {
  console.log(v)
})

const opts = ref()
{
  const x = model.value.invit ? model.value.invit.editEtc() : ''
  opts.value = x || $t('INVx_none')
}

if (notView.value && model.value.invit.userId === sf.userId) 
  onMounted(async () =>{
    await ui.diagDisplay($t('INVxnotv_u'), true)
    const op = new MDOperation('$mdInvitUpdLV')
    op.args.invitId = model.value.invit.invitId
    op.args.userId = model.value.invit.userId
    try {
      await op.post()
      model.value.inv.lp = model.value.inv.v // pas très réglo !
    } catch(e: any) {
      console.log(e.toString())
    }
  })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>