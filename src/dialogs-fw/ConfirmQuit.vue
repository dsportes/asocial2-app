<!-- Dialogue sur APP de déconnexion. 
Model: ui.appDialogs.ConfirmQuit
3 choix:
- quit (coolBye), 
- reload (relaodPage), 
- continuer (simple fermeture du dialogue).
-->
<template>
  <q-dialog v-model="ui.appDialogs.ConfirmQuit" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('quitConfirm')}}</q-toolbar-title>
        <help-button page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="center" class="titre-md q-gutter-sm">
        <btn-cond flat icon="logout" color="warning" size="lg"
          :label="$t('quitQuit')" @ok="bye"/>
        <btn-cond flat icon="refresh" color="warning" size="lg"
          :label="$t('quitReload')" @ok="reload"/>
        <btn-cond flat icon="arrow_forward" color="primary" size="lg"
          :label="$t('quitCont')" 
          @ok="ui.dialogs.ConfirmQuit = false"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import stores from '../stores/all'
import { sty, coolBye, reloadPage } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import HelpButton from '../components-fw/HelpButton.vue'

const ui = stores.ui

async function bye () {
  coolBye()
}

async function reload () {
  reloadPage()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>