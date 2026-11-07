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
    <menu-confirm v-if="confirm && confirmCode" v-model="confirmCode" @confirm="cf"/>
    <div class="q-ml-xs font-mono ellipsis overflow-hidden">
      {{ text }}</div>
    <q-menu v-model="menu" :class="'w' + (widthmenu || 'md') + ' b1'"
      anchor="center middle" self="center middle"
      transition-show="flip-up" transition-hide="flip-down">
      <input-a class="font-mono q-ma-sm" v-model="ntext" :initval="text"
        :size="datasize" simple @validate="doOkX"
        :disable="disable || false" :fncheck="fncheck" :ctx="ctx"
        style="position:relative;top:-5px;"/>
    </q-menu>
  </div>
</div>
</template>

<script setup lang="ts" vapor>
import { ref, Ref, watch } from 'vue'
import { Crypt } from '../src-fw/crypt'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputA from '../components-fw/InputA.vue'
import MenuConfirm from '../components-fw/MenuConfirm.vue'

const props = defineProps<{
  prefix?: string,
  text: string,
  disable?: boolean,
  widthmenu?: string,
  datasize: string,
  confirm?: boolean,
  ctx?: any,
  fncheck?: Function,
  idx?: number
}>()


const confirmCode: Ref<string> = ref('')

async function cf (b: boolean) {
  confirmCode.value = ''
  if (b) doOk()
}

const doOkX = () => {
  if (!props.confirm) doOk()
  else confirmCode.value = '' + (100 + Crypt.random(1)[0])
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
.b1 { border:2px solid var(--q-primary);border-radius:5px; }
.bord { border: 2px solid var(--q-warning); border-radius: 2px;}
.sely:hover { border-color: $yellow-5;}
.sely { border:1px solid transparent; border-radius: 5px; cursor:pointer!important;}
</style>
