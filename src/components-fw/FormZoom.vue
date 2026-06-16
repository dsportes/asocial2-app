<template>
<div>
  <div v-if="!form" class="msg">{{ $t('FORMnoform') }}</div>
  <div v-else class="q-ma-sm a-pa-sm bord1 full-width">
    <div class="font-mono fs-sm">{{ form.formId }}</div>
    <div class="q-my-sm text-bold titre-lg">{{ form.typeEd }}</div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMorg') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ form.org }}</div>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMsvc') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ $t('services_' + form.svc)}}</div>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMversion') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <div class="font-mono">{{ dhcool(form.v) }}</div>
        <div v-if="notView" class='titre-md text-bold text-warning text-italic'>
          {{$t('FORMnotv_u')}}</div>
      </div>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMlimit') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ dhcool(form.maxLife * 1000) }}</div>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMstatus') }}</div>
      <div class="col-7 row items-center q-gutter-xs">
        <q-icon :name="stic[form.status]" :color="stclr[form.status]"/>
        <div class="font-mono text-bold" :color="stclr[form.status]">
          {{ $t('FORMstatus_' + form.status) }}</div>
        </div>    
    </div>
    <div v-if="form.userId !== sf.userId" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMuser') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ event.userId }}</div>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md text-italic">
        <span>{{ $t('FORMcomment') }}</span>
        <btn-cond v-if="editable" class="q-ml-sm" icon="edit" round 
          @ok="edCom"/>
      </div>
      <div class="col-7 q-pl-sm font-mono">
        <div v-if="!event.comment">{{ $t('FORMnocomment') }}</div>
        <scroll-md v-else height="50px" :text="event.comment"/>
      </div>
    </div>
  </div>

  <dialog-std0 :title="$t('FORMeditcom')" v-model="dialogs.editcomment">
    <template #default>
      <md-editor model="newcom" editable :lgmax="250" :text="newcom" modetxt
        @ok="chgcomment"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref, computed, onMounted, watch, reactive } from 'vue'

import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { $Form, $MDEvent } from '../src-fw/documents'

const stic = ['', 'person', 'person_shield', 'check', 'close']
const stclr = ['', 'warning', 'warning', 'green-5', 'negative']

const sf = stores.safe
const ui = stores.ui

// const props = defineProps({ })

const event: Ref<$MDEvent> = computed(() => ui.currentEvent.event )
const form: Ref<$Form> = computed(() => ui.currentEvent.form )
const editable = computed(() => form.value.status < 3 )

const notView = computed(() => form.value && form.value.userId === sf.userId
  && (form.value.lv < form.value.v) )

const dialogs = reactive({
  editcomment: false
})

const newcom = ref('')

const edCom = () => {
  newcom.value = event.comment || ''
  dialogs.editcomment = true
}

const init = async () => {
  if (notView.value) await vu()
}

onMounted(async () => { await init() })

watch(form, async (v) => { 
  await init() 
})

watch(event, async (v) => { 
  await init() 
})

const emit = defineEmits(['tabchange'])

const vu = async () => {
  await ui.diagDisplay($t('FORMnotv_u'))
  await form.mdEventUser(true)
}

const chgcomment = async () => {
  if (newcom.value !== event.comment) {
    await form.mdEventUser(true, newcom.value)
  }
  dialogs.editcomment = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>