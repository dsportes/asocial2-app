<!-- Dialogue APP affichant un message demandant confirmation 'j'ai lu' -->
<template>
  <q-dialog v-model="ui.appDialogs.GotIt" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('important')}}</q-toolbar-title>
      </q-toolbar>
      <!--div class="fs-md q-ma-sm text-center q-mt-md" v-html="ui.diag"></div-->
      <sd-nb class="q-ma-sm q-mt-md" :text="ui.diag.txt"/>
      <div v-if="ui.diag.cf === 0" class="row q-my-md q-mx-sm justify-between">
        <btn-cond flat icon="close" color="warning" size="lg"
          :label="$t('ireject')" @ok="gotit(false)"/>
        <btn-cond flat icon="check" :label="$t('iconfirm')" size="lg"
          @ok="gotit(true)"/>
      </div>
      <div v-if="ui.diag.cf === -1 || ui.diag.cf > 0" class="row q-my-md q-mx-sm justify-end"> 
        <btn-cond flat icon="check" :label="$t('gotit')" @ok="gotit(true)"/>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { watch } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import SdNb from '../components-fw/SdNb.vue'

const ui = stores.ui

/*
ui.diag.cf
- -1: afficher Got it!
- 0: afficher reject confirm
- n > 0: pas de choix et disparition dans n secs
*/

const gotit = (b: boolean) => { 
  ui.appDialogs.GotIt = false
  const f = ui.diag.resolve
  if (f) f(b)
} 

const init = () => {
  const d = ui.diag
  if (d.txt && d.cf > 0) setTimeout(() => { gotit(true) }, (d.cf > 3 ? 3000 : d.v * 1000))
}

watch(() => ui.diag.token, () => { init()} )

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>