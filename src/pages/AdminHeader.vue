<template>
<div class="column">
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-ml-md q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>

    <q-toolbar-title class="titre-md q-mx-md">
      <span>{{$t('PAGEadmin')}}</span>
      <span class="q-ml-md font-mono text-bold">[{{session.admin.svc}}]</span>
    </q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <help-button class="q-ml-xs q-mr-md" page="DOCpg"/>
  </q-toolbar>
  <!--div class="row items-center justify-between">
    <input-a prefix="orgcode" size="org" v-model="session.admin.org"/>
  </div-->
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { useI18n } from 'vue-i18n'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'

const $t = useI18n().t
const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
