<template>
<div class="row full-width items-center">
  <btn-bubble v-if="bubble !== ''" class="col-auto q-mr-sm" :size="large ? 'lg' : 'md'" 
    :text="disable && disbubble ? disbubble : bubble"/>
  <div :class="'col ' + (large ? 'titre-lg ' : 'titre-md ') + (disable ? ' disabled' : ' cursor-pointer')"
    @click="fno">{{title}}
  </div>
  <q-btn v-if="hasopen" class="col-auto" flat 
    :icon="icon || 'chevron_right'" :size="large ? 'lg' : 'md'" padding="none"
    :disable="disable" @click="fno" :color="color || 'none'"/>
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
  hasopen: Boolean,
  title: String, // titre de la bar
  bubble: String,  // texte de la bulle d'aide
  disbubble: String, // texte de la bulle d'aide QUAND disable
  large: Boolean,
  color: String
})

const fno = () => {
  if (!props.disable && props.hasopen) 
    emit('open', 'BarOpen1')
}

const emit = defineEmits(['open'])

const ui = stores.ui
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
