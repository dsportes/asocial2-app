<template>
<q-dialog v-model="model" persistent
    transition-show="slide-up">
  <q-card :class="sty() + (hdrclass ? ' ' + hdrclass : '') + ' full-width'"
    :style="'height:' + (vh ? vh : '50') + 'vh;'">
  <q-layout container view="hHh lpR fFf">
    <q-header :class="sty()">
      <q-toolbar class="tbs">
        <btn-cond color="none" size="lg" icon="chevron_left" flat 
          @ok="ui.fD(); emit('close', null)"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{title}}</q-toolbar-title>
        <help-button v-if="help" :page="help"/>
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
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import { sty } from '../src-fw/util'

const model = defineModel({
})

const props = defineProps({
  title: String, // titre de la top bar
  help: String,  // code de loa page d'aide s'il y en a une
  hdrclass: String,
  vh: String
})

const ui = stores.ui

const emit = defineEmits(['close'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
