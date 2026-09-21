<template>
<div>
  <std-header/>
  <div class="tbp row items-center">
    <q-select v-model="ui.appPage.org" dense options-dense 
      class="col-auto q-mr-md"
      style="min-width:150px; height:40px" :label="$t('org')"
      transition-show="flip-up" transition-hide="flip-down"
      :disable="ui.editingInCourse"
      :options="orgs"/>
    <select-enum1 class="col q-mr-md" svc="AS2" :org="ui.appPage.org"
      v-model="ui.appPage.section" enum="Section" width="md"
      :disable="ui.editingInCourse || !ui.appPage.org"/>

    <btn-cond icon="edit" class="col-auto" color="warning" 
      @ok="dialogs.edit = true"/>

    <edit-enum v-if="dialogs.edit" model="dialogs.edit"
      svc="AS2" name="Section" :org="ui.appPage.org" :title="$t('CORED_section_tit')"
      @done="onEdit"/>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'
import EditEnum from '../dialogs-fw/EditEnum.vue'

const ui = stores.ui
const sf = stores.safe
const orgs = ref([])
const dialogs = reactive({
  edit: false
})

const init = () => {
  const s = new Set()
  for(const [,c] of sf.mySimpleCreds('AS2', '', 'Redaction'))
    s.add(c.org)
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
