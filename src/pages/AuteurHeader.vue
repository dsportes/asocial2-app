<template>
<div>
  <std-header/>
  <div class="tbp row items-center justify-between">
    <q-tabs dense v-model="ui.appPage.tab" inline-label breakpoint="2000px"
      class="col q-mr-md tbp shadow-2">
      <q-tab name="auteurs" icon="people" :label="$t('PAGEauteur_auteurs')" />
      <q-tab name="articles" icon="library_books" :label="$t('PAGEauteur_articles')"
        :disable="!ui.appPage.aut" />
    </q-tabs>

    <div v-if="ui.appPage.tab === 'auteurs'" class="col-auto row justify-end">
      <btn-bubble clear class="col-auto q-ml-xs" :text="$t('PAGEauteur_bub')"/>
      <btn-cond class="col-auto q-ml-xs" icon="sync" round @ok="init"/>
    </div>
  </div>

  <q-toolbar v-if="ui.appPage.tab === 'articles'" 
    class="bg-grey-9 text-white q-pa-xs">
    <btn-bubble clear class="col-auto" :text="$t('AUTpubs_bub')"/>
    <q-toolbar-title class="titre-md">{{ ui.appPage.aut.nomAuteur }}</q-toolbar-title>
    <btn-cond v-if="session.hasNet && !ui.editingInCourse"
      class="col-auto q-ml-xs" icon="add" round @ok="addPub"/>
    <btn-cond v-if="session.hasNet && ui.editingInCourse"
      class="col-auto q-ml-xs" icon="undo" round @ok="undoPub"/>
    <btn-cond v-if="session.hasNet && ui.editingInCourse"
      class="col-auto q-ml-xs" icon="check" round @ok="valPub"/>
  </q-toolbar>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const ui = stores.ui
const session = stores.session

const init = () => { ui.appPage.btnInit = ui.appPage.btnInit + 1}
const addPub = () => { ui.appPage.btnAdd = ui.appPage.btnAdd + 1}
const undoPub = () => { ui.appPage.undoAdd = ui.appPage.undoAdd + 1}
const valPub = () => { ui.appPage.btnVal = ui.appPage.btnVal + 1}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
