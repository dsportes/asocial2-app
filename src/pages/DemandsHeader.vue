<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-menu/>
    <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>

    <btn-bubble class="q-ml-md" :text="$t('PAGEdemands_bub')"/>
    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEdemands_label')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>DemandsPage</q-tooltip></div>
  </q-toolbar>
 
  <demands-hdr :class="sty() + 'q-py-sm'"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { reactive } from 'vue'

import { $t, sty } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import DemandsHdr from '../components-fw/DemandsHdr.vue'
import BtnMenu from '../components-fw/BtnMenu.vue'

const ui = stores.ui
const session = stores.session

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2 !important; color: black !important; }
.cur { color: $warning !important; font-style: italic; font-weight: bold; }
</style>
