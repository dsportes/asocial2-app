<template>
<q-toolbar class="full-width tbp">
  <btn-cond class="q-ml-md q-mr-xs" color="none" flat icon="menu"
    @ok="ui.toggleMenu"/>

  <q-toolbar-title class="titre-md q-mx-md">
    {{$t('PAGEadmin')}}
  </q-toolbar-title>

  <settings-button class="q-ml-sm"/>
  <help-button class="q-ml-xs" page="DOCpg"/>
</q-toolbar>
</template>

<script setup lang="ts">
// @ts-ignore
import { useI18n } from 'vue-i18n'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const $t = useI18n().t
const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
