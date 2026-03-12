<!--
Présente une barre avec un bulle gauche, titre, icon, bulle droite:
- affiche les bulles (à droite et / ou à gauche) 
  sur click (différente si disable)
- envoie l'event 'open', si pas 'passive' en cas de click sur le titre ou icon.
-->
<template>
<div class="row full-width items-center">
  <btn-bubble v-if="bubbleleft !== ''" 
    class="col-auto q-mr-sm" 
    :size="large ? 'lg' : 'md'" 
    :text="disable && disbubbleleft ? disbubbleleft : bubbleleft"/>

  <div :class="clt" @click="open">{{title}}</div>

  <q-btn v-if="!passive" @click="open"
    class="col-auto" flat padding="none"
    :size="large ? '24px' : '20px'"
    :icon="icon || 'chevron_right'" 
    :disable="disable" 
    :color="color || 'none'"/>

  <btn-bubble v-if="bubble !== ''" 
    class="col-auto q-ml-md" 
    :size="large ? 'lg' : 'md'"
    :text="disable && disbubble ? disbubble : bubble"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const emit = defineEmits(['open'])
const props = defineProps({
  icon: String,
  large: Boolean, // true si large
  passive: Boolean, // si true, le cursor n'est PAS pointer, pas devent 'open' émis, pas de chevron à droite
  center: Boolean, //
  disable: Boolean,
  title: String, // titre de la bar
  bubble: String,  // texte de la bulle d'aide A DROITE
  disbubble: String, // texte de la bulle d'aide A DROITE QUAND disable
  bubbleleft: String,  // texte de la bulle d'aide A GAUCHE
  disbubbleleft: String, // texte de la bulle d'aide A GAUCHE QUAND disable
  size: String,
  color: String
})

const clt = computed(() => 'col' 
  + (props.center ? ' text-center' : ' text-right') 
  + (props.disable ? ' disabled' : '')
  + (!props.passive ? ' cursor-pointer' : '')
  + (props.large ? ' titre-lg' : ' titre-md')
)

const open = () => {
  if (!props.passive) emit('open', true)
}
const ui = stores.ui
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
