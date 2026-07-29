<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>

    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEadmin')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <help-button class="" page="DOCpg"/>
    <div style="color:transparent;width:3px">*<q-tooltip>AdminPage</q-tooltip></div>
  </q-toolbar>

  <q-tabs dense v-model="ui.adminPage.tab" breakpoint="2000px"
    class="full-width tbp shadow-2">
    <q-tab name="sites" icon="cloud" :label="$t('sites')" />
    <q-tab name="orgs" icon="people" :label="$t('orgs')" />
    <q-tab name="managers">
      <img :src="superman" width="24px"/>
      <div>{{ $t('APnewManager_2') }}</div>
    </q-tab>
  </q-tabs>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { onMounted } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui

onMounted(async () => { await ui.resetAdminPage() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
