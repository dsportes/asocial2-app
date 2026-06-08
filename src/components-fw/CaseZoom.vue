<template>
<div>
  <div v-if="notView" 
    class='titre-md text-bold text-warning text-italic'>
    {{$t('INVxnotv_s')}}</div>

  <div class="row q-mt-sm items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('TOPIC_' + cas.topicId)}}</div>
  </div>
  
  <div class="q-mt-sm text-bold">{{$t('CASstatus_' + cas.status)}}</div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_v')}}</div>
    <div class='font-mono'>{{dhcool(cas.v)}}</div>
  </div>

  <div v-if="cas.subject" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{cas.subjectEd}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <span class="q-ml-xs font-mono">{{cas.userId}}</span>
    <span v-if="cas.userId === sf.userId" class="q-ml-xs font-mono">({{$t('me')}})</span>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_tab')}}</div>
  <md-editor class="full-width q-pa-xs" v-model="ui.currentCase.newTab"
    :text="cas.tab" :editable="editable" modetxt/>

  <div v-if="cas.etc !== null">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_opts')}}</div>
    <scroll-md class="full-width bord1 q-pa-xs" height="150px" 
      :text="etcEd" />
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import { Case } from '../src-fw/documents'
import { MDOperation } from 'src/src-fw/operation'

const encoder = new TextEncoder()

const sf = stores.safe
const ui = stores.ui

const props = defineProps({
  editable: Boolean
})

const cas: Ref<Case> = computed(() => 
  ui.currentCase.cas)
const notView = computed(() => cas.value.userId === sf.userId
  && (cas.value.lv < cas.value.v) )
const etcEd = computed(() => cas.value.editEtc() || $t('INVx_none'))

/*
const trace = () => {
  if (cas.value) {
    const val = Crypt.shaS(encoder.encode(cas.value.topicId))
    const pk = Crypt.shaS(encoder.encode(cas.value.caseId))
    console.log('cas change topic-index', pk, val)
  }
}
*/

const init = async () => {
  ui.currentCase.newTab = cas.value.tab
  // trace()
  if (notView.value) await vu()
}

onMounted(async () => { await init() })

watch(cas, async (v) => { 
  // trace()
  await init() 
})

const emit = defineEmits(['tabchange'])

const vu = async () => {
  await ui.diagDisplay($t('INVxnotv_u'))

  const about = ui.currentCase.newTab || cas.value.tab || '' 
  const aboutU = about ? await Crypt.crypt(sf.keyK, encoder.encode(about)) : null

  const op = new MDOperation('$mdCaseUser')
  op.args.caseId = cas.value.caseId
  op.args.chk = cas.value.chk()
  op.args.lv = cas.value.v
  op.args.aboutU = aboutU
  try {
    await op.post()
    cas.value.lv = cas.value.v // pas très réglo !
  } catch(e: any) {
    console.log(e.toString())
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>