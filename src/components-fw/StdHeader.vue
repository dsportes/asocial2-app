<template>
  <q-toolbar class="full-width tbp">
    <btn-menu v-if="session.step === 2"/>
    <btn-mode/>
    <slot name="btn"/>

    <q-toolbar-title class="titre-md text-center q-mx-sm">{{tit}}</q-toolbar-title>

    <btn-bubble v-if="ui.page" clear class="q-ml-md" :text="$t('PAGE' + ui.page + '_bub')"/>
    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>{{ui.page}}</q-tooltip></div>
  </q-toolbar>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnMenu from '../components-fw/BtnMenu.vue'
import BtnMode from '../components-fw/BtnMode.vue'

const ui = stores.ui
const session = stores.session

const props = defineProps({
  title: String
})

const tit = computed(() => props.title || ui.page ? $t('PAGE' + ui.page + '_label') : '')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
