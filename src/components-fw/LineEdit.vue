<!-- Saisie du couple Service / Organisation
-->
<template>
<div class="column">
  <div v-if="prefix" class="row items-center">
    <btn-bubble class="col-auto" :text="$t(prefix + '_bub')"/>
    <div class="col q-mx-sm mh titre-md text-italic ellipsis">{{ $t(prefix + '_label') }}</div>
  </div>

  <div :class="'font-mono ellipsis' + (disable ? ' disabled' : ' cursor-pointer')">
    <q-icon v-if="!disable" size="20px" color="warning" class="q-mr-sm" name="edit"/>
    <span>{{ text }}</span>
    <q-menu v-model="menu"
      anchor="center middle" self="center middle"
      :style="styles[size || 'md'] + ';border:2px solid var(--q-primary);border-radius:5px;'"
      transition-show="flip-up" transition-hide="flip-down">
      <input-a class="font-mono q-ma-sm" v-model="ntext" :initval="text"
        :size="datasize" simple @validate="doOk"
        :disable="disable || false"
        style="position:relative;top:-5px;"/>
    </q-menu>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'
import { asty, dkli } from '../src-fw/util'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputA from '../components-fw/InputA.vue'

const props = defineProps({
  prefix: String,
  text: String,
  disable: Boolean,
  size: String,
  datasize: String,
  ctx: Object
})

const styles = {
  sm: 'width: 30em !important',
  md: 'width: 40em !important',
  lg: 'width: 50em !important'
}

const emit = defineEmits(['change'])

const menu = ref(false)
const ntext = ref('')
watch(() => menu.value, (v) => {
  if (v) ntext.value = props.text
})

/*
const undo = () => {
  ntext.value = props.text
  menu.value = false
}
*/

const doOk = () => {
  if (ntext.value !== props.text) {
    if (props.ctx) props.ctx.value = ntext.value
    emit('change', props.ctx || ntext.value )
  }
  menu.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
// .w1 { background-color:rgba(255,255,255,0.1) }
.bord { border: 2px solid var(--q-warning); border-radius: 2px;}
</style>
