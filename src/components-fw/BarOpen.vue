<template>
<div class="row full-width items-center">
  <div :class="'col text-right cursor-pointer titre-md' + (disable ? ' disabled' : '')"
    @click="fnopen()">{{title}}</div>
  <q-btn v-if="fnopen" class="col-auto" flat :size="size || 'md'"
    :icon="icon || 'chevron_right'" padding="none"
    :disable="disable" @click="fnopen()" :color="color || 'none'"/>
  <btn-bubble v-if="bubble !== ''" class="q-ml-md col-auto" :size="size || 'md'"
    :text="disable && disbubble ? disbubble : bubble"/>
</div>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import { sty } from '../src-fw/util'

const props = defineProps({
  icon: String,
  disable: Boolean,
  fnopen: Function,
  title: String, // titre de la bar
  bubble: String,  // texte de la bulle d'aide
  disbubble: String, // texte de la bulle d'aide QUAND disable
  size: String,
  color: String
})

const ui = stores.ui
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
