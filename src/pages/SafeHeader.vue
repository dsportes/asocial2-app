<template>
<div class="column full-width">
  <q-toolbar class="full-width tbp">
    <btn-cond label="WP" disable :color="session.wpReady ? 'green' : 'red'">
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>
    <q-toolbar-title class="titre-md q-mx-md">{{$t('app_label')}}</q-toolbar-title>
    <settings-button class="q-ml-sm"/>
    <help-button class="q-ml-xs" page="DOCpg"/>
  </q-toolbar>
  <q-tabs dense v-model="sf.tab" class="full-width bg-primary text-white shadow-2">
    <q-tab name="login" icon="img:icons/anonymous_white.png" :label="$t('login')" />
    <q-tab name="guest" icon="img:icons/flowers.png" :label="$t('guest')" />
  </q-tabs>
  <div v-if="sf.tab === 'login' && sf.step === 2" 
    class="row justify-between q-ma-sm items-center">
    <btn-cond icon="chevron_left" color="none" :label="$t('LOGback')"
      @ok="sf.setStep(1)"/>
    <btn-cond :disable="!session.hasNet" :label="$t('SESconfig')" icon="settings"
      @ok="ui.oD(myidc, 'credsmgr')"/>
  </div>
  <creds-mgr :idc="myidc"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { ref, computed, onUnmounted } from 'vue'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import CredsMgr from '../components-fw/CredsMgr.vue'

const $t = useI18n().t
const sf = stores.safe
const config = stores.config
const session = stores.session
const ui = stores.ui

const myidc = ui.getIdc('SafeHeader')
onUnmounted(() => ui.closeVue(myidc))

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
