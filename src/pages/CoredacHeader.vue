<template>
<div>
  <std-header/>
  <div class="tbp row items-center">
    <q-select v-model="ui.appPage.org" dense options-dense class="col-auto q-mr-md"
      style="min-width:150px; height:40px" :label="$t('org')"
      transition-show="flip-up" transition-hide="flip-down"
      :disable="ui.editingInCourse"
      :options="orgs"/>
    <div class="col titre-md text-italic text-center">{{ ui.appPage.sectionL }}</div>

  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'

const ui = stores.ui
const sf = stores.safe
const orgs = ref([])

const init = () => {
  const s = new Set()
  for(const [,c] of sf.mySimpleCreds('AS2', '', 'Redaction'))
    s.add(c.org)
  orgs.value = Array.from(s).sort()
}
init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
