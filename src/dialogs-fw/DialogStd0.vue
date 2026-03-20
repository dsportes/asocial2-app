<template>
<q-dialog v-model="model" persistent
    transition-show="slide-up">
  <q-card :class="sty() + (hdrclass ? ' ' + hdrclass : '') + ' full-width'"
    :style="'height:' + (vh ? vh : '50') + 'vh;'">
  <q-layout container view="hHh lpR fFf">
    <q-header :class="sty()">
      <q-toolbar class="tbs">
        <btn-cond color="none" size="lg" icon="chevron_left" flat 
          @ok="model = false"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{title}}</q-toolbar-title>
        <help-button v-if="help" :page="help"/>
        <div v-if="vue" style="color:transparent;width:3px">*<q-tooltip>{{ vue }}</q-tooltip></div>
      </q-toolbar>
      <slot name="hdr"/>
    </q-header>
    <q-page-container>
      <slot/>
    </q-page-container>
  </q-layout>
  </q-card>
</q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { watch } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import HelpButton from '../components-fw/HelpButton.vue'

const model = defineModel()
const emit = defineEmits(['close'])
watch(model, (v) => {
  if(!v) emit('close', true)
})

const props = defineProps({
  vue: String,
  title: String, // titre de la top bar
  help: String,  // code de loa page d'aide s'il y en a une
  hdrclass: String,
  vh: String
})

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
