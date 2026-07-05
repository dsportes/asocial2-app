<!-- Bouton normalisé
 - event: 'ok' (pas 'click')
-->
<template>
<span>
  <q-btn v-if="stop"
    :icon="icon"
    :padding="padding || 'none'"
    :disable="disable || false"
    :flat="flat || false"
    dense
    :no-caps="noCaps"
    :color="clr"
    :text-color="tc"
    :size="size || 'md'"
    :label="label || ''"
    :round="round || false"
    @click.stop="ok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <menu-confirm v-if="menu" v-model="confirmCode" @confirm="ok()"/>
    <slot />
  </q-btn>
  <q-btn v-else
    :icon="icon"
    :padding="padding || 'none'"
    :disable="disable || false"
    :flat="flat || false"
    dense
    :no-caps="noCaps"
    :color="clr"
    :text-color="tc"
    :size="size || 'md'"
    :label="label || ''"
    :round="round || false"
    @click="clok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <menu-confirm v-if="menu" v-model="confirmCode" @confirm="cf"/>
    <slot />
  </q-btn>
</span>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/all'
import MenuConfirm from '../components-fw/MenuConfirm.vue'
const ui = stores.ui
import { Crypt } from '../src-fw/crypt'
// import { $t } from '../src-fw/util'

const props = defineProps({
  color: String, // defaut primary
  icon: String, // defaut aucune
  size: String, // defaut 'md'
  label: String, // defaut 'ok'
  tp: String, // tooltip: defaut aucun
  ctx: Object, // defaut null. Retransmis sur l'événement ok
  cond: String, // code condition dans stores.session
  disable: Boolean,
  flat: Boolean,
  round: Boolean,
  stop: Boolean,
  noCaps: Boolean,
  padding: String,
  confirm: Boolean
})

const menu = ref(false)
const confirmCode = ref()

const clok = () => {
  if (props.confirm) {
    confirmCode.value = '' + (100 + Crypt.random(1)[0])
    menu.value = true
  } else ok()
}
const emit = defineEmits(['ok'])

const tc = computed(() => {
  if (props.flat) return clr.value
  const x = diag.value ? 'white' : (
  !props.color || props.color === 'primary' ? 'btntc' :
  (props.color === 'warning' ? 'btwtc' : 'white'))
  return x
})

const clr = computed(() => {
  if (diag.value) return 'negative'
  if (!props.color) return 'btnbg'
  if (props.color === 'warning') return 'btwbg'
  if (props.color === 'primary') return 'btnbg'
  if (props.color === 'nb') return ui.isDark ? 'white' : 'black'
  return props.color
})

const diag = ref('')

// const diag = computed(() => props.cond && session[props.cond] ? $t(session[props.cond]) : '')

async function cf (b) {
  if (b) await ok()
  else {
    menu.value = false
    emit('ok', false)
  }
}

async function ok () {
  menu.value = false
  if (!diag.value) {
    emit('ok', props.ctx || null)
    return
  }
  await ui.diagDisplay(diag.value, true)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
