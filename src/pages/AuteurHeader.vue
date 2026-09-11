<template>
<div>
  <std-header/>
  <div class="tbp row items-center justify-between">
    <nav-bar v-if="ui.appPage.tab > 1" class="col-auto q-ml-xs" v-model="ui.navBar" @back="back"/>

    <div v-if="ui.appPage.tab === 1" class="col row justify-end">
      <div class="col text-right titre-md">{{ $t('PAGEauteur_label') }}</div>
      <btn-bubble clear class="col-auto q-ml-xs" :text="$t('PAGEauteur_bub')"/>
      <btn-cond class="col-auto q-ml-xs" icon="sync" round @ok="init"/>
    </div>

    <div v-if="ui.appPage.tab === 2" class="col row justify-end">
      <div class="col text-right titre-md">{{ $t('AUTpubs_label', [aut.nomAuteur]) }}</div>
      <btn-bubble clear class="col-auto" :text="$t('AUTpubs_bub')"/>
      <btn-cond v-if="session.hasNet && !ui.editingInCourse"
        class="col-auto q-ml-xs" icon="add" round @ok="addPub"/>
      <btn-cond v-if="session.hasNet && ui.editingInCourse"
        class="col-auto q-ml-xs" icon="undo" round @ok="undoPub"/>
      <btn-cond v-if="session.hasNet && ui.editingInCourse"
        class="col-auto q-ml-xs" icon="check" round @ok="valPub"/>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'

import { $t } from '../src-fw/util'
import StdHeader from '../components-fw/StdHeader.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

import NavBar from '../components-fw/NavBar.vue'

const ui = stores.ui
const session = stores.session

const back = () => {
  if (ui.appPage.tab > 1) {
    ui.appPage.tab = ui.appPage.tab - 1
    if (ui.appPage.tab === 1) ui.navBar.hasBack = false
  }
}

const init = () => { ui.appPage.btnInit = ui.appPage.btnInit + 1}
const addPub = () => { ui.appPage.btnAdd = ui.appPage.btnAdd + 1}
const undoPub = () => { ui.appPage.undoAdd = ui.appPage.undoAdd + 1}
const valPub = () => { ui.appPage.btnVal = ui.appPage.btnVal + 1}

const aut = computed(() => ui.appPage.aut )

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
