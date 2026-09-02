<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-menu/>
    <btn-mode/>
    <q-icon v-if="adminPage.mdAdmin" name="security"
      color="negative" size="28px"/>
    <q-toolbar-title class="titre-md text-center q-mx-sm">{{$t('PAGEadmin')}}</q-toolbar-title>

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
import { Ref, onMounted, ref } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnMenu from '../components-fw/BtnMenu.vue'
import BtnMode from '../components-fw/BtnMode.vue'
import { isMDAdmin } from 'src/src-fw/operation'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui

const isAdmin: Ref<boolean> = ref(false)
const adminPage = ref({ mdAdmin: false})

onMounted(async () => { 
  isAdmin.value = await isMDAdmin()
  adminPage.value = ui.resetAdminPage(isAdmin.value) 
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
