<template>
<q-dialog v-model="model" persistent
  transition-show="slide-up">
<q-card :class="sty()" :style="styc">
<q-layout container view="hHh lpR fFf">
  <q-header>
    <q-toolbar :class="hdrclass ? hdrclass : 'tbs'" dense>
      <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="onClose"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{title}}</q-toolbar-title>
      <btn-bubble v-if="help" :text="help"/>
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
import { ref } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const model = defineModel()
const emit = defineEmits(['close'])

const props = defineProps({
  vue: String,
  title: String, // titre de la top bar
  help: String,  // code de la page d'aide s'il y en a une
  hdrclass: String,
  noclose: Boolean,
  vh: String,
  width: String
})
const wx = {sm: '30', md: '40', lg: '50'}
const styc = ref('max-width: ' + wx[props.width || 'md'] + 'rem !important; width: 95vw !important; height:' + (props.vh || '50') + 'vh;')

const onClose = () => { 
  if (!props.noclose) model.value = false
  emit('close', true)
}

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
