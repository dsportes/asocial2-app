<template>
<div>
  <std-header>
    <template #btn>
      <q-icon v-if="ui.adminPage.mdAdmin" name="security" color="negative" size="28px"/>
    </template>
  </std-header>

  <q-tabs dense v-model="ui.adminPage.tab" breakpoint="2000px"
    class="full-width tbp shadow-2">
    <q-tab name="sites" icon="cloud" :label="$t('sites')" />
    <q-tab name="orgs" icon="people" :label="$t('orgs')" />
    <q-tab name="managers">
      <img :src="superman" width="24px"/>
      <div>{{ $t('APnewManager_2') }}</div>
    </q-tab>
  </q-tabs>

  <div v-if="ui.adminPage.tab === 'orgs'" :class="sty() + ' full-width'">
    <select-svcorg initorg="?" initsvc="?" @select="setOS2"/>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" :class="sty() + ' full-width'">
    <select-svcorg initorg="?" initsvc="?" @select="setOS2"/>
    <div class="row">
      <div v-if="!ui.adminPage.mdAdmin || !ui.adminPage.soa.admin" class="col msg">{{ $t('APnoadm') }}</div>
      <div v-else class="col titre-md text-italic">{{ $t('APlstmanagers') }}</div>
      <btn-cond v-if="ui.adminPage.soa.admin" class="col-auto q-mx-sm self-end"
        icon="refresh" round @ok="setOS3"/>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, onMounted, ref } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import StdHeader from '../components-fw/StdHeader.vue'
import { isMDAdmin } from 'src/src-fw/operation'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { sty } from '../src-fw/util'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui

const setOS2 = async (soa) => { 
  ui.adminPage.soa = soa }
const setOS3 = async () => { 
  ui.adminPage.soa = { ...ui.adminPage.soa } }

onMounted(async () => { 
  const isAdmin = await isMDAdmin()
  ui.resetAdminPage(isAdmin) 
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
