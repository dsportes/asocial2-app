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

    <select-enum2 v-if="ui.appPage.org"
      class="col q-mr-md" svc="AS2" :org="ui.appPage.org"
      enum="Sujet" width="md"
      :title="$t('CODIRnosuj')" @select="selSujet"
      :disable="ui.editingInCourse"/>

    <btn-cond v-if="ui.appPage.org" icon="edit" class="col-auto" color="warning" 
      @ok="dialogs.edit = true"/>

  </div>
  <div class="q-pa-xs">
    <div v-if="!ui.appPage.org" class="msg">{{ $t('CODIRnoorg') }}</div>
    <div v-else>
      <div v-if="!ui.appPage.section" class="msg">{{ $t('CODIRnosuj') }}</div>
      <div v-else class="titre-md text-center">{{$t('CODIRtit1')}}</div>
    </div>
  </div>

  <edit-enum v-if="dialogs.edit" v-model="dialogs.edit"
    svc="AS2" name="Sujet" :org="ui.appPage.org" :title="$t('CODIR_sujet_tit')"
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
import SelectEnum2 from '../components-fw/SelectEnum2.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const orgs = ref([])
const dialogs = reactive({
  edit: false
})

const selSujet = (t) => {
  ui.appPage.sujet = t
  ui.trigPage()
}

const init = () => {
  ui.appPage.org = ''
  ui.appPage.sujet = ''
  const s = new Set()
  if (session.planeMode) {
    for(const x of session.orgRolesP) {
      const i = x.indexOf('/')
      s.add(x.substring(0, i))
    }
  } else 
    for(const [,c] of sf.mySimpleCreds('AS2', '', 'CoDir')) s.add(c.org)
  orgs.value = Array.from(s).sort()
  if (orgs.value.length) ui.appPage.org = orgs.value[0]
}

const onEdit = () => {
  init()
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
