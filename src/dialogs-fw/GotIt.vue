<!-- Dialogue APP affichant un message demandant confirmation 'j'ai lu' -->
<template>
  <q-dialog v-model="ui.appDialogs.GotIt" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('important')}}</q-toolbar-title>
      </q-toolbar>
      <!--div class="fs-md q-ma-sm text-center q-mt-md" v-html="ui.diag"></div-->
      <sd-nb class="q-ma-sm q-mt-md" :text="ui.diag"/>
      <div v-if="ui.diagAutoConfirm !== true" class="row q-my-md q-mx-sm justify-between">
        <btn-cond flat icon="close" color="warning" size="lg"
          :label="$t('ireject')" @ok="gotit(false)"/>
        <btn-cond flat icon="check" :label="$t('iconfirm')" size="lg"
          @ok="gotit(true)"/>
      </div>
      <div v-else class="row q-my-md q-mx-sm justify-end"> 
        <btn-cond flat icon="check" :label="$t('gotit')" @ok="gotit(true)"/>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import SdNb from '../components-fw/SdNb.vue'

const ui = stores.ui

const gotit = (b: boolean) => { 
  ui.appDialogs.GotIt = false
  const f = ui.diagResolve
  if (f) f(b)
} 

if (ui.diagAutoConfirm) 
  setTimeout(() => { gotit(true) }, ui.diagAutoConfirm * 1000)

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>