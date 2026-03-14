<template>
<q-layout view="hHh lpR fFf">
  <q-header>
    <safe-header v-if="ui.page === 'safeHome'"/>
    <admin-header v-if="ui.page === 'admin'"/>

    <q-toolbar v-if="ui.page !== 'safeHome' && ui.page !== 'admin' " class="full-width tbp">
      <btn-cond class="q-mr-xs" color="none" flat icon="menu"
        @ok="ui.openMenu"/>
      <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
        <q-tooltip>{{session.sessionInfo}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title v-if="ui.page" class="titre-md q-mx-md">{{$t('PAGE' + ui.page)}}</q-toolbar-title>
      <settings-button class="q-ml-sm"/>
      <help-button class="" page="DOCpg"/>
    </q-toolbar>
  </q-header>

  <q-drawer v-if="sf.step === 0" v-model="ui.leftMenu" :class="sty()"
    show-if-above overlay :width="300" :breakpoint="700" elevated >
    <left-menu/>
  </q-drawer>

  <q-page-container class="font-def">
    <!--
    <transition name="anim1">
      <q-page v-if="ui.page === 'p1'" class="column">
        <p1/>
      </q-page>
    </transition> 
    <transition name="anim1">
      <q-page v-if="ui.page === 'p2'" class="column">
        <p2/>
      </q-page>
    </transition>
    -->
    <transition name="anim1">
      <q-page v-if="ui.page === 'safeHome'" class="column">
        <safe-home class="q-mt-sm"/>
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

  <got-it/>
  <confirm-quit/>
  <dialog-exc/>
  <dialog-help/>
  <q-dialog v-model="ui.appDialogs.ServiceStatus"
    full-height persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <btn-cond flat :label="$t('gotit')" icon="check" color="none" 
          @ok="ui.appDialogs.ServiceStatus = false"/>
        <q-toolbar-title class="titre-md full-width text-center">{{$t('servicestatus')}}</q-toolbar-title>
      </q-toolbar>
      <service-status/>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script setup lang="ts">
// import P1 from './tests/P1.vue'
// import P2 from './tests/P2.vue'

// @ts-ignore
import { watchEffect, onMounted } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { useQuasar } from 'quasar'

import stores from './stores/all'
import { set$t, sty, b64ToU8 } from './src-fw/util'

import SafeHeader from './pages/SafeHeader.vue'
import SafeHome from './pages/SafeHome.vue'

import AdminPage from './pages/AdminPage.vue'
import AdminHeader from './pages/AdminHeader.vue'
import TestPage from './pages/TestPage.vue'

import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import ServiceStatus from './components-fw/ServiceStatus.vue'
import LeftMenu from './components-fw/LeftMenu.vue'
import BtnCond from './components-fw/BtnCond.vue'

import GotIt from './dialogs-fw/GotIt.vue'
import ConfirmQuit from './dialogs-fw/ConfirmQuit.vue'
import DialogExc from './dialogs-fw/DialogExc.vue'
import DialogHelp from './dialogs-fw/DialogHelp.vue'

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
