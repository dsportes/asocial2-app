<template>
<div>
  <std-header/>
  <div class="tbp row items-center justify-between">
    <q-select v-model="ui.appPage.org" dense options-dense 
      class="col-auto q-mr-md"
      style="min-width:150px; height:40px" :label="$t('org')"
      transition-show="flip-up" transition-hide="flip-down"
      :disable="ui.editingInCourse"
      :options="orgs"/>

    <select-enum v-if="ui.appPage.org"
      class="col q-mr-md" svc="AS2" :org="ui.appPage.org"
      v-model="ui.appPage.section" enum="Section" width="md"
      :title="$t('CODIRnosect')" @select="selSection"
      :disable="ui.editingInCourse"/>

    <btn-cond v-if="ui.appPage.org" icon="edit" class="col-auto" color="warning" 
      @ok="dialogs.edit = true"/>

  </div>
  <div class="q-pa-xs">
    <div v-if="!ui.appPage.org" class="msg">{{ $t('CODIRnoorg') }}</div>
    <div v-else>
      <div v-if="!ui.appPage.section" class="msg">{{ $t('CODIRnosect') }}</div>
      <div v-else class="titre-md text-center">{{$t('CODIRtit1')}}</div>
    </div>
  </div>

  <edit-enum v-if="dialogs.edit" v-model="dialogs.edit"
    svc="AS2" name="Section" :org="ui.appPage.org" :title="$t('CORED_section_tit')"
    @done="onEdit"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'
import EditEnum from '../dialogs-fw/EditEnum.vue'
import SelectEnum from '../components-fw/SelectEnum.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe
const orgs = ref([])
const dialogs = reactive({
  edit: false
})

const selSection = (t) => {
  ui.appPage.section = t[0]
  ui.appPage.sectionL = t[1]
}

const init = () => {
  const s = new Set()
  for(const [,c] of sf.mySimpleCreds('AS2', '', 'Redaction')) s.add(c.org)
  orgs.value = Array.from(s).sort()
}

const onEdit = () => {
  init()
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
