<template>
<!-- Affiche d'un message demandant confirmation 'j'ai lu' -->
  <q-dialog v-model="ui.dModels['0'].diag" persistent>
    <q-card :class="sty(sm)">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('important')}}</q-toolbar-title>
      </q-toolbar>
      <div class="fs-md text-center q-mt-md" v-html="ui.diag"></div>
      <div class="row q-my-md justify-end"> 
        <btn-cond flat icon="check" :label="$t('gotit')" @ok="gotit"/>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
// import { ref, computed } from 'vue'
import stores from '../stores/all'
const ui = stores.ui
const gotit = () => { ui.fD(); const f = ui.diagResolve; if (f) f()} 

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>