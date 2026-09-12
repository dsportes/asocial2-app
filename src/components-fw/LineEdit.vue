<!-- Saisie du couple Service / Organisation
:class="'selx font-mono ellipsis' + (disable ? ' disabled' : ' cursor-pointer')">
-->
<template>
<div class="column">
  <div v-if="prefix" class="row items-center">
    <btn-bubble class="col-auto" :text="$t(prefix + '_bub')"/>
    <div class="col q-mx-sm mh titre-md text-italic ellipsis">{{ $t(prefix + '_label') }}</div>
  </div>

  <div :class="(disable ? 'disabled' : 'sely') + ' row items-center'">
    <q-icon name="edit" size="22px"/>
    <div :style="widths[width || 'sm']"
      class="q-ml-xs font-mono ellipsis">
      {{ text }}</div>
    <q-menu v-model="menu"
      anchor="center middle" self="center middle"
      :style="styles[widthmenu || 'md'] + ';border:2px solid var(--q-primary);border-radius:5px;'"
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
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputA from '../components-fw/InputA.vue'

const props = defineProps({
  prefix: String,
  text: String,
  disable: Boolean,
  widthmenu: String,
  width: String,
  datasize: String,
  ctx: Object
})

const styles = {
  sm: 'width: 30em !important',
  md: 'width: 40em !important',
  lg: 'width: 50em !important'
}

const widths = {
  sm: 'max-width: 10em !important; overflow:hidden',
  md: 'max-width: 20em !important; overflow:hidden',
  lg: 'max-width: 30em !important; overflow:hidden'
}

const emit = defineEmits(['change'])

const menu = ref(false)
const ntext = ref('')
watch(() => menu.value, (v) => {
  if (v) ntext.value = props.text
})

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
.sely:hover { border-color: $yellow-5;}
.sely { border:1px solid transparent; border-radius: 5px; cursor:pointer!important;}
</style>
