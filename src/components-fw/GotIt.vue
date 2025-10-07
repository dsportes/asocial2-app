<template>
<!-- Affiche d'un message demandant confirmation 'j'ai lu' -->
  <q-dialog v-model="ui.dModels['0'].diag" persistent>
    <q-card :class="lidk + ' spsm q-pa-sm'">
      <div class="text-center titre-lg q-my-sm">{{$t('important')}}</div>
      <div class="fs-md text-center q-b-md" v-html="ui.diag"></div>
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