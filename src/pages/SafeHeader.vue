<template>
<q-toolbar class="full-width tbp">
  <btn-cond class="q-ml-xs" :label="config.K.APPNAME" 
    no-caps flat color="none"/>
  <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
    <q-tooltip>{{session.sessionInfo}}</q-tooltip>
  </btn-cond>
  <btn-cond v-if="sf.step === 2" icon="chevron_left" :label="$t('HPauthentif')" size="md" flat
    color="warning" @ok="sf.backToAuth"/>

  <q-toolbar-title class="titre-md q-mx-md">
    {{sf.step === 1 ? $t('HPauthby_9') : $t('HPauthby_' + sf.openMode, [sf.userName])}}
  </q-toolbar-title>

  <settings-button class="q-ml-sm"/>
  <help-button class="q-ml-xs" page="DOCpg"/>
</q-toolbar>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const $t = useI18n().t
const sf = stores.safe
const config = stores.config
const session = stores.session

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
