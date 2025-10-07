<template>
  <!-- Choix de déconnexion. Déconnexion, reconnexion, continuer -->
  <q-dialog v-model="ui.dModels['0'].confirmQuit" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('quitConfirm')}}</q-toolbar-title>
        <help-button page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="center" class="titre-md q-gutter-sm">
        <q-btn flat dense :label="$t('quitQuit')" @click="bye">
          <q-icon right name="logout" color="warning" size="lg"/>
        </q-btn>
        <q-btn flat dense :label="$t('quitReload')" @click="reload">
          <q-icon right name="logout" color="warning" size="lg"/>
        </q-btn>
        <q-btn flat dense :label="$t('quitCont')" @click="ui.fD"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
// import { ref, computed } from 'vue'
import HelpButton from './HelpButton.vue'
import stores from '../stores/all'
import { sty, coolBye, reloadPage } from '../src-fw/util'

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