<template>
<q-layout view="hHh lpR fFf">
  <q-header>
    <safe-header v-if="ui.page === 'home'"/>
    <admin-header v-if="ui.page === 'admin'"/>

    <q-toolbar v-if="ui.page !== 'home' && ui.page !== 'admin' " class="full-width tbp">
      <btn-cond class="q-ml-md q-mr-xs" color="none" flat icon="menu"
        @ok="ui.toggleMenu"/>
      <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
        <q-tooltip>{{session.sessionInfo}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title v-if="ui.page" class="titre-md q-mx-md">{{$t('PAGE' + ui.page)}}</q-toolbar-title>
      <settings-button class="q-ml-sm"/>
      <help-button class="q-ml-xs" page="DOCpg"/>
    </q-toolbar>
  </q-header>

  <q-drawer v-model="ui.openMenu" :class="sty()"
    show-if-above :width="300" :breakpoint="700" elevated >
    <btn-cond class="cls" round color="primary" icon="chevron_left" @ok="ui.toggleMenu"/>

    <scroll-area class="fit" noborder>
      <btn-cond v-if="sf.step === 0" flat icon="exit_to_app" color="warning" 
        :label="$t('endsession')" @ok="ui.toggleMenu(); backToOpenSession()"/>
      <left-menu/>
    </scroll-area>
  </q-drawer>

  <q-page-container class="font-def">
    <transition name="anim1">
      <q-page v-if="ui.page === 'home'" class="column">
        <safe-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'admin'" class="column">
        <admin-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'test'" class="column">
        <test-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'app'">
        <div class="titre-xxl">Hello World!</div>
      </q-page>
    </transition>
  </q-page-container>

  <got-it v-if="ui.dModels['0'].diag"/>
  <confirm-quit v-if="ui.dModels['0'].confirmQuit"/>
  <dialog-exc v-if="ui.dModels['0'].dialogExc"/>
  <dialog-help v-if="ui.dModels['0'].dialogHelp"/>
  <q-dialog v-if="ui.dModels['0'].servicestatus" v-model="ui.dModels['0'].servicestatus" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <btn-cond flat :label="$t('gotit')" icon="check" color="none" @ok="ui.fD"/>
        <q-toolbar-title class="titre-md full-width text-center">{{$t('servicestatus')}}</q-toolbar-title>
      </q-toolbar>
      <service-status/>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import { watchEffect, onMounted } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { useQuasar } from 'quasar'

import stores from './stores/all'
import { set$t, sty, b64ToU8 } from './src-fw/util'

import LeftMenu from './components-fw/LeftMenu.vue'
import SafePage from './pages/SafePage.vue'
import SafeHeader from './pages/SafeHeader.vue'
import AdminPage from './pages/AdminPage.vue'
import AdminHeader from './pages/AdminHeader.vue'
import TestPage from './pages/TestPage.vue'

import ScrollArea from './components-fw/ScrollArea.vue'
import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import BtnCond from './components-fw/BtnCond.vue'
import GotIt from './components-fw/GotIt.vue'
import ConfirmQuit from './components-fw/ConfirmQuit.vue'
import DialogExc from './components-fw/DialogExc.vue'
import DialogHelp from './components-fw/DialogHelp.vue'
import ServiceStatus from './components-fw/ServiceStatus.vue'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const config = stores.config
const session = stores.session

const ui = stores.ui
const sf = stores.safe

const i18n = useI18n() 
const $t = i18n.t // Pour rendre accessible $t dans le code
const $q = useQuasar()
set$t($t, i18n)
ui.set$t$q($t, $q)

onMounted(async () => { // Sur onMounted parce que async
  await session.setRegistration(b64ToU8(config.K.vapidPublicKey), config.location, config.K.APPNAME)
})

ui.setScreenWH($q.screen.width, $q.screen.height)
watchEffect(() => {
  ui.setScreenWH($q.screen.width, $q.screen.height)
})

const backToOpenSession = async () => {
  const ok = await ui.diagDisplay($t('HPbackopen'), true)
  if (ok)
    ui.backToOpenSession()
}
</script>

<style lang="scss" scoped>
@import './css/app.scss';
.wifi { position: fixed; right: 3px; top: 3px; border-radius: 15px; }

.anim1-enter-active { transition: all 0.3s;}
.anim1-leave-active { transition: all 0.3s;}
.anim1-enter-from { opacity:0; transform: translateX(50%);}
.anim1-leave-to { opacity:0; transform: translateX(-50%);}
.cls { position: absolute; right: -20px; top: 0; z-index: 50;}
</style>
