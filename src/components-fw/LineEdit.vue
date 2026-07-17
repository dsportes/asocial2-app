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
      anchor="top left" self="top left" class="bord q-pa-sm"
      :style="styles[size || 'md']"
      transition-show="flip-up" transition-hide="flip-down">
      <div class="row items-center">
        <q-input class="col font-mono" standout v-model="ntext"
          @keydown.enter.prevent="doOk"
          :disable="disable || false"/>
        <btn-cond v-if="ntext !== text" 
          class="col-auto q-mx-xs" icon="undo" round @ok="undo"/>
        <btn-cond v-if="ntext !== text" 
          class="col-auto" :label="$t('ok')" color="warning" padding="2px" @ok="doOk"/>
        <btn-cond class="q-ml-xs col-auto" icon="close" @ok="menu = false"/>
      </div>
    </q-menu>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  prefix: String,
  text: String,
  disable: Boolean,
  size: String
})

const styles = {
  sm: 'max-width: 30rem; width: 30rem',
  md: 'max-width: 40rem; width: 40rem',
  lg: 'max-width: 50rem; width: 50rem'
}

const emit = defineEmits(['change'])

const menu = ref(false)
const ntext = ref(props.text)

const undo = () => {
  ntext.value = props.text
  menu.value = false
}

const doOk = () => {
  if (ntext.value !== props.text)
    emit('change', ntext.value)
  menu.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
// .w1 { background-color:rgba(255,255,255,0.1) }
.bord { border: 2px solid $warning; border-radius: 2px;}
.sm { max-width: 30rem; width: 95vw }
.md { max-width: 40rem; width: 95vw }
.lg { max-width: 50rem; width: 95vw }
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
