<template>
<q-dialog v-model="model" full-height persistent transition-show="slide-up">
<q-layout container view="hHh lpR fFf" :class="sty()" :style="styc">
  <q-header>
    <q-toolbar :class="hdrclass ? hdrclass : 'tbs'" dense>
      <btn-cond color="none" size="lg" icon="chevron_left" flat 
        @ok="onClose"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{title}}</q-toolbar-title>
      <slot name="btn"/>
      <btn-bubble v-if="help" :text="help"/>
      <div v-if="vue" style="color:transparent;width:3px">*<q-tooltip>{{ vue }}</q-tooltip></div>
    </q-toolbar>
    <slot name="hdr"/>
  </q-header>
  <q-page-container>
    <slot name="default"/>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  vue: String,
  title: String, // titre de la top bar
  help: String,  // code de loa page d'aide s'il y en a une
  hdrclass: String,
  noclose: Boolean,
  width: String
})
const wx = {sm: '30', md: '40', lg: '50'}
const styc = ref('max-width: ' + wx[props.width || 'md'] + 'rem !important; width: 95vw !important;')

const model = defineModel()
const emit = defineEmits(['close'])

const onClose = () => { 
  if (!props.noclose) model.value = false
  emit('close', true)
}

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
