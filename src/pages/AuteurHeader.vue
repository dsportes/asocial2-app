<template>
<div>
  <std-header/>
  <q-tabs dense v-model="ui.appPage.tab" inline-label breakpoint="2000px"
    class="col q-mr-md tbp shadow-2">
    <q-tab name="auteurs" icon="people" :label="$t('PAGEauteur_auteurs')">
      <btn-bubble :text="$t('PAGEauteur_bub')"/>
    </q-tab>
    <q-tab name="pubs" icon="library_books" :label="$t('PAGEauteur_pubs')"
      :disable="!ui.appPage.aut">
      <btn-bubble class="q-ml-sm" :text="$t('PAGEauteur_pubs_bub')"/>
    </q-tab>
  </q-tabs>
</div>
</template>

<script setup lang="ts" vapor>
// @ts-ignore
// import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
