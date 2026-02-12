<template>
  <q-img :src="ui.isDark ? aW : aB" class="bg-primary"
    style="height: 30px; max-width: 30px;">
    <q-popup-proxy ref="qpp" transition-show="flip-up" transition-hide="flip-down"
      breakpoint="400">
      <q-banner :class="(ui.isDark ? 'clear' : 'dark') + ' q-pa-xs'"
        style="width: 350px" @click="hide">
        <div class="row">
          <div class="col-5 titre-md text-italic q-pr-sm text-right">{{$t('app')}}</div>
          <div class="col-7 font-mono">{{config.K.APPNAME}}</div>
        </div>
      </q-banner>
    </q-popup-proxy>
  </q-img>
</template>

<script setup lang="ts">
/* Gardé à toute fin utile mais pour l'instant non inclus */
import { ref } from 'vue'
import stores from '../stores/all'
import { $t, $q } from '../src-fw/util'
import aW from '../assets/anonymous_white.png'
import aB from '../assets/anonymous_black.png'

const sf = stores.safe
const config = stores.config
const session = stores.session
const ui = stores.ui

const qpp = ref(null)

function hide () {
  qpp.value.hide()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
