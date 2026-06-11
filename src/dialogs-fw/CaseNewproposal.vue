<!-- Mon component
-->
<template>
<div>
<dialog-std1 v-model="model" width="sm"
  @close="model = false; emit('close', true)"
  :title="$t('INVtit_1_label')">
  <template #hdr>
    <div class="row justify-between items-center">
      <btn-cond icon="undo" :label="$t('reset')"
        @ok="reset"/>
      <btn-cond icon="check" :label="$t('validate')" color="warning"
        :disable="!completed"
        @ok="create"/>
    </div>
  </template>
  <template #default>
    <div class="items-center full-width">
      <div class="row items-center justify-around q-gutter-sm full-width">
        <select-svc @change="svcorgSelected" v-model="svc"/>
        <select-org @change="svcorgSelected"/>
      </div>
      
      <div v-if="svc && session.orgs.c" class="q-my-md column items-center">
        <bar-title mini prefix="CAStopic"/>
        <topic-menu v-model="topic" @select="topicSel"/>
      </div>

      <div v-if="topic">
        <div class="titre-md text-bold q-mb-md q-mt-xs">
        {{ $t('TOPIC_' + topic.id).substring(2) }}</div>

        <subject-menu v-model="topic" @select="onSubject"/>
      </div>

      <div v-if="subject !== null">
        <bar-title class="q-mt-md" prefix="CAStabu"/>
        <md-editor class="full-width q-pa-xs" v-model="tab"
          editable modetxt :mh="170" :rows="8"/>
        <bar-title class="q-mt-md" prefix="CASabout"/>
        <md-editor class="full-width q-pa-xs" v-model="about"
          editable modetxt :mh="40" :rows="3"/>
      </div>

    </div>
</template>
</dialog-std1>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, onMounted } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Case } from '../src-fw/documents'
import { Registry } from '../src-fw/registry'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import TopicMenu from '../components-fw/TopicMenu.vue'
import SubjectMenu from '../components-fw/SubjectMenu.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

import { opOfSvcOrg } from '../src-fw/operation'
import { TopicDef } from '../stores/service-store'

const model = defineModel()
const emit = defineEmits(['close', 'done'])

const mintab = 10
const sf = stores.safe
const ui = stores.ui
const config = stores.config
const session = stores.session

const svc = ref(config.K.DEFAULT_SERVICE)
const topic: Ref<TopicDef> = ref()
const subject = ref(null)
const tab = ref('')
const about = ref('')

const reset = () => {
  svc.value = config.K.DEFAULT_SERVICE
  topic.value = null
  subject.value = null
  tab.value = ''
}

const svcorgSelected = async () => {
  await svc.loadSvcOrgTopics(svc.value, session.currentOrg)
}

/*
onMounted(async () => {
  await locLoadTopics()
})
*/

const topicSel = (t: TopicDef) => {
  topic.value = t
  subject.value = null
}

const onSubject = (s) => {
  console.log(s.label)
  subject.value = s.value
}

const completed = computed(() => 
  session.orgs.c && subject.value !== null && tab.value.length > mintab)

reset()

const create = async () => {
  const obj = { svc: svc.value, org: session.currentOrg, 
    topicId: topic.value.id, subject: subject.value || ''}
  const cas = Registry.newCase(obj) as Case
  const ok = await cas.createByU(tab.value, about.value)
  if (ok) {
    emit('done', true)
    model.value = false
    emit('close', true)
    ui.currentCase.cas = cas
    const f = ui.currentCase.fnOnUpdate
    if (f) f()
  }
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-red { border-color: $negative !important }
</style>
