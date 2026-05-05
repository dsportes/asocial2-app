<template>
<div>
  <div v-if="notView && invit.userId !== sf.userId" 
    class='titre-md text-bold text-warning text-italic'>
    {{$t('INVxnotv_s')}}</div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{invit.$t}}</div>
  </div>
  
  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVbyU')}}</div>
    <div class="text-bold">{{$t('INVbyU_' + (invit.byU ? 't' : 'f'))}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_v')}}</div>
    <div class='font-mono'>{{dhcool(invit.v)}}</div>
  </div>

  <div v-if="invit.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{invit.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <span class="q-ml-xs font-mono">{{invit.userId}}</span>
    <span v-if="invit.userId === sf.userId" class="q-ml-xs font-mono">({{$t('me')}})</span>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_tab')}}</div>
  <md-editor class="full-width q-pa-xs" v-model="ui.currentInvit.newTab"
    :texte="invit.tab" :editable="editable" modetxt/>

  <div v-if="invit.etc !== null">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_opts')}}</div>
    <scroll-md class="full-width bord1 q-pa-xs" height="100px" 
      :text="opts" />
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'

import { $t, dhcool } from '../src-fw/util'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import { Invitation } from '../src-fw/invitation'
import { MDOperation } from 'src/src-fw/operation'

const sf = stores.safe
const ui = stores.ui

const props = defineProps({
  editable: Boolean
})

const invit: Ref<Invitation> = computed(() => ui.currentInvit.invit)
const inv = computed(() => ui.currentInvit.inv)
const notView = computed(() => inv.value && inv.value.lv < invit.value.v )
const opts = ref($t('INVx_none'))
const vuToSet = computed(() => notView.value && invit.value.userId === sf.userId && inv.value)

const init = async () => {
  ui.currentInvit.newTab = invit.value.tab
  const x = invit.value ? invit.value.editEtc() : ''
  opts.value = x || $t('INVx_none')
  if (vuToSet.value) await vu()
}

onMounted(async () => { await init() })

watch(invit, async (v) => { 
  console.log('invit change')
  await init() 
})

const emit = defineEmits(['tabchange'])

const vu = async () => {
  await ui.diagDisplay($t('INVxnotv_u'))
  const op = new MDOperation('$mdInvitUpdLV')
  op.args.invitId = invit.value.invitId
  op.args.userId = invit.value.userId
  try {
    await op.post()
    inv.value.lv = invit.value.v // pas très réglo !
  } catch(e: any) {
    console.log(e.toString())
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>