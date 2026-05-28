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
    <div style="max-width:30rem;width:95vw;margin:0 auto;padding: 0 5px">
      <div class="column items-center">
        <div class="row items-center justify-around q-gutter-sm full-width">
          <select-svc @change="svcorgSelected" v-model="svc"/>
          <select-org @change="svcorgSelected"/>
        </div>

        <div v-if="svc && session.orgs.c" class="q-my-md column items-center">
          <bar-title mini prefix="CAStopic"/>
          <topic-menu v-model="topic" @select="topicSel"/>
          <div v-if="topic" class="titre-md text-bold q-mb-md q-mt-xs">
            {{ $t('TOPIC_' + topic.id).substring(2) }}</div>

          <div v-if="topic">
            <subject-menu v-model="topic" @select="onSubject"/>

            <div v-if="subject !== null">
              <bar-title class="q-mt-md" prefix="CAStabu"/>
              <md-editor class="full-width q-pa-xs" v-model="tab"
                editable modetxt/>
              <bar-title class="q-mt-md" prefix="CASabout"/>
              <md-editor class="full-width q-pa-xs" v-model="about"
                editable modetxt mh="5rem"/>
            </div>
          </div>
        </div>
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

import { GetTopics, UpdTopics } from '../src-fw/operations'
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
  await loadTopics()
}

const loadTopics = async () => {
  if (svc.value && session.currentOrg) {
    const oper = await opOfSvcOrg(svc.value, session.currentOrg)
    const op = new GetTopics(svc.value, oper)
    const n = await op.run()
    console.log(n)
  }
}

onMounted(async () => {
  await loadTopics()
})

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
  const cas = Registry.newCase(obj)
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
