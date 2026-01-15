<template>
<!-- Affiche d'un message demandant confirmation 'j'ai lu' -->
  <q-dialog v-model="ui.dModels['0'].diag" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('important')}}</q-toolbar-title>
      </q-toolbar>
      <!--div class="fs-md q-ma-sm text-center q-mt-md" v-html="ui.diag"></div-->
      <sd-nb class="q-ma-sm q-mt-md" :text="ui.diag"/>
      <div v-if="ui.diagConfirm" class="row q-my-md q-mx-sm justify-between">
        <btn-cond flat icon="close" color="warning"
          :label="$t('ireject')" @ok="gotit(false)"/>
        <btn-cond flat icon="check" :label="$t('iconfirm')"
          @ok="gotit(true)"/>
      </div>
      <div v-else class="row q-my-md q-mx-sm justify-end"> 
        <btn-cond flat icon="check" :label="$t('gotit')" @ok="gotit(true)"/>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// import { ref, computed } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from './BtnCond.vue'
import SdNb from './SdNb.vue'

const ui = stores.ui

const gotit = (b: boolean) => { 
  ui.fD()
  const f = ui.diagResolve
  if (f) f(b)
} 

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>