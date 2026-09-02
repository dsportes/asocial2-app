<template>
<q-layout view="hHh lpR fFf">
  <q-header>
    <safe-header v-if="ui.page === 'safeHome'"/>
    <admin-header v-if="ui.page === 'admin'"/>
    <demands-header v-if="ui.page === 'demands'"/>
    <sponsorings-header v-if="ui.page === 'sponsorings'"/>

    <q-toolbar v-if="!hdrPages.has(ui.page)" class="full-width tbp">
      <btn-menu/>
      <btn-mode/>
      
      <q-toolbar-title v-if="ui.page" class="titre-md text-center q-mx-sm">{{$t('PAGE' + ui.page)}}</q-toolbar-title>
      <settings-button class="q-ml-sm"/>
      <help-button class="" page="DOCpg"/>
      <div style="color:transparent;width:3px">*<q-tooltip>{{ ui.page }}</q-tooltip></div>
    </q-toolbar>
  </q-header>

  <q-drawer v-if="session.step === 2" v-model="ui.leftMenu" :class="sty()"
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
        <demands-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'sponsorings'" class="column">
        <sponsorings-page class="q-mt-sm"/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'auteur'">
        <auteur-page/>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'app'" :class="'ano-' + ($q.dark.isActive ? 'w' : 'b')">
        <!--div class="titre-xxl">Hello world</div-->
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'test'" class="column">
        <test-page class="q-mt-sm"/>
      </q-page>
    </transition>
  </q-page-container>

  <permission-box v-if="session.permDialog"/>
  <got-it/>
  <confirm-quit/>
  <confirm-close/>
  <confirm-closesession/>
  <dialog-exc/>
  <dialog-help/>

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

import { set$t, sty } from './src-fw/util'
import { keyFromB64, fromUrl } from './src-fw/b64'
import BtnMenu from './components-fw/BtnMenu.vue'
import BtnMode from './components-fw/BtnMode.vue'
import SafeHeader from './pages/SafeHeader.vue'
import SafeHome from './pages/SafeHome.vue'
import PermissionBox from './dialogs-fw/PermissionBox.vue'

import AdminPage from './pages/AdminPage.vue'
import AdminHeader from './pages/AdminHeader.vue'

import DemandsPage from './pages/DemandsPage.vue'
import DemandsHeader from './pages/DemandsHeader.vue'

import SponsoringsPage from './pages/SponsoringsPage.vue'
import SponsoringsHeader from './pages/SponsoringsHeader.vue'

import AuteurPage from './pages/AuteurPage.vue'
import TestPage from './pages/TestPage.vue'

import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import LeftMenu from './components-fw/LeftMenu.vue'
import BtnCond from './components-fw/BtnCond.vue'

import GotIt from './dialogs-fw/GotIt.vue'
import ConfirmQuit from './dialogs-fw/ConfirmQuit.vue'
import ConfirmClose from './dialogs-fw/ConfirmClose.vue'
import ConfirmClosesession from './dialogs-fw/ConfirmClosesession.vue'
import DialogExc from './dialogs-fw/DialogExc.vue'
import DialogHelp from './dialogs-fw/DialogHelp.vue'

import { schemaExcAS2 } from './as2/schema'
import { schemaExcFW } from './src-fw/schema'
import { AS2nbDocs } from './as2/documents'
import { AS2nbForms } from './as2/forms'
import { AS2nbCreds } from './as2/credentials'
import { FWnbDocs } from './src-fw/fwdocuments'

const hdrPages = new Set(['admin', 'demands', 'sponsorings', 'safeHome'])

const config = stores.config
config.initK()

{
  let exc = schemaExcAS2()
  if (!exc) exc = schemaExcFW()
  if (exc) {
    alert(exc.toString())
  } else {
    console.log(AS2nbDocs() + ' documents loaded')
    console.log(AS2nbForms() + ' forms loaded')
    console.log(AS2nbCreds() + ' credentials loaded')
    console.log(FWnbDocs() + ' FW documents loaded')
  }
}

const session = stores.session
const ui = stores.ui

const i18n = useI18n()
const $t = i18n.t // Pour rendre accessible $t dans le code
const $q = useQuasar()
set$t($t, i18n)
ui.set$t$q($t, $q)

onMounted(async () => { // Sur onMounted parce que async
  await session.setRegistration(keyFromB64(fromUrl(config.K.vapidPublicKey)), config.location, config.K.APPNAME)
  await session.setStep(0)
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
