<!-- Mon component
-->
<template>
<div>
<dialog-std1 v-model="model" width="sm"
  @close="model = false; emit('close', true)"
  :title="$t('INVtit_1_label')">
  <template #hdr>
    <div class="row justify-between items-center">
      <btn-cond icon="close" :label="$t('giveup')"
        @ok="model = false; emit('close', true)"/>
      <btn-cond icon="check" :label="$t('validate')" color="warning"
        :disable="!completed"
        @ok="create"/>
    </div>
  </template>
  <template #default>
    <div class="column items-center">
      <div class="q-pa-xs">
        <div class="row items-center justify-center q-gutter-sm">
          <select-svc @change="svcorgSelected" v-model="svc"/>
          <select-org @change="svcorgSelected"/>
        </div>

        <div v-if="svc && session.orgs.c">
          <bar-title prefix="CAStopic"/>
          <topic-menu v-model="topic" @select="topicSel"/>

          

          <div v-if="major">
            <div v-if="hasMinor" class="q-mt-sm full-width" >
              <bar-title prefix="INVminor"/>
              <input-b prefix="INVminor_c" v-model="minor" size="minor" noval/>
            </div>

            <div v-if="xerr === ''">
              <bar-title class="q-mt-md" prefix="INVtabu"/>
              <md-editor class="full-width q-pa-xs" v-model="tab"
                editable modetxt/>
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
import { Invitation } from '../src-fw/invitation'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InputB from '../components-fw/InputB.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
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

const topic: Ref<TopicDef> = ref()
const topicSel = (t: TopicDef) => {
  topic.value = t
}


const minor = reactive({ inp: '', err: 'tooshort' })

const tab = ref('')
const majdescr = computed(() => config.K.majorInvits[major.value.value])

const hasMinor = computed(() => major.value && majdescr && majdescr.hasMinor )

const xerr = computed(() => !hasMinor.value ? '' : minor.err )

const completed = computed(() => 
  session.orgs.c && xerr.value === '' && tab.value.length > mintab)

const reset = () => {
  svc.value = config.K.DEFAULT_SERVICE
  topic.value = null

  minor.inp = ''; minor.err = 'tooshort'
  tab.value = ''
}

reset()

const create = async () => {
  const invit = new Invitation({
    invitId: '',
    userId: sf.userId,
    svc: svc.value,
    org: session.orgs.c,
    v: 0,
    major: major.value.value,
    minor: hasMinor ? minor.inp : '',
    byU: true,
    tab: tab.value,
    etc: null
  })
  if (await invit.createByU()) {
    emit('done', true)
    model.value = false
    emit('close', true)
    ui.currentInvit.invit = invit
    const f = ui.currentInvit.fnOnUpdate
    if (f) f()
  }
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-red { border-color: $negative !important }
</style>
