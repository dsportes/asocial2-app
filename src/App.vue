<template>
<q-layout view="hHh lpR fFf">
  <q-header>
    <safe-header v-if="ui.page === 'safeHome'"/>
    <admin-header v-if="ui.page === 'admin'"/>
    <demands-header v-if="ui.page === 'demands'"/>
    <sponsorings-header v-if="ui.page === 'sponsorings'"/>

    <q-toolbar v-if="!hdrPages.has(ui.page)" class="full-width tbp">
      <btn-cond class="q-mr-xs" color="none" flat icon="menu"
        @ok="ui.openMenu"/>
      <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
        <q-tooltip>{{session.sessionInfo}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title v-if="ui.page" class="titre-md q-mx-md">{{$t('PAGE' + ui.page)}}</q-toolbar-title>
      <settings-button class="q-ml-sm"/>
      <help-button class="" page="DOCpg"/>
      <div style="color:transparent;width:3px">*<q-tooltip>{{ ui.page }}</q-tooltip></div>
    </q-toolbar>
  </q-header>

  <q-drawer v-if="sf.step === 0" v-model="ui.leftMenu" :class="sty()"
    show-if-above overlay :width="350" :breakpoint="700" elevated >
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
      <q-page v-if="ui.page === 'safeHome'"
        :class="'column ano-' + ($q.dark.isActive ? 'w' : 'b')">
        <safe-home class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'admin'" class="column">
        <admin-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'demands'" class="column">
        <demands-scan class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'sponsorings'" class="column">
        <sponsorings-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'test'" class="column">
        <test-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'app'" :class="'ano-' + ($q.dark.isActive ? 'w' : 'b')">
        <!--div class="titre-xxl">Hello world</div-->
      </q-page>
    </transition>
  </q-page-container>

  <got-it/>
  <confirm-quit/>
  <confirm-close/>
  <dialog-exc/>
  <dialog-help/>

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
import { set$t, sty } from './src-fw/util'
import { keyFromB64, fromUrl } from './src-fw/b64'

import SafeHeader from './pages/SafeHeader.vue'
import SafeHome from './pages/SafeHome.vue'

import AdminPage from './pages/AdminPage.vue'
import AdminHeader from './pages/AdminHeader.vue'

import DemandsScan from './components-fw/DemandsScan.vue'
import DemandsHeader from './pages/DemandsHeader.vue'

import SponsoringsPage from './pages/SponsoringsPage.vue'
import SponsoringsHeader from './pages/SponsoringsHeader.vue'

import TestPage from './pages/TestPage.vue'

import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import LeftMenu from './components-fw/LeftMenu.vue'
import BtnCond from './components-fw/BtnCond.vue'

import GotIt from './dialogs-fw/GotIt.vue'
import ConfirmQuit from './dialogs-fw/ConfirmQuit.vue'
import ConfirmClose from './dialogs-fw/ConfirmClose.vue'
import DialogExc from './dialogs-fw/DialogExc.vue'
import DialogHelp from './dialogs-fw/DialogHelp.vue'

import { nbdoc } from '../src/app/documents'

// const decoder = new TextDecoder()
// const encoder = new TextEncoder()
const hdrPages = new Set(['admin', 'demands', 'sponsorings', 'safeHome'])

const config = stores.config
const session = stores.session

const ui = stores.ui
const sf = stores.safe

const i18n = useI18n()
const $t = i18n.t // Pour rendre accessible $t dans le code
const $q = useQuasar()
set$t($t, i18n)
ui.set$t$q($t, $q)

console.log(nbdoc + ' documents') // Pour forcer le chargement des documents dans Registry

onMounted(async () => { // Sur onMounted parce que async
  await session.setRegistration(keyFromB64(fromUrl(config.K.vapidPublicKey)), config.location, config.K.APPNAME)
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

.ano-b, .ano-w {
  background-position: center center;
  background-repeat: no-repeat;
  background-size:contain;
}
.ano-b {
  background-image: url('./assets/anonymous-bt.svg');
}
.ano-w {
  background-image: url('./assets/anonymous-wt.svg');
}
</style>
