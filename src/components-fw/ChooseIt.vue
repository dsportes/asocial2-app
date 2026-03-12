<!-- Affiche un message MD :
- la liste des choix d'actions est à placer dans le slot 
- l'appui sur "close" émet 'giveup'
-->
<template>
  <q-card :class="sty('sm')">
    <q-toolbar class="tbs">
      <btn-cond icon="close" size="md" flat color="warning" @ok="emit('giveup', true)"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{title}}</q-toolbar-title>
    </q-toolbar>
    <sd-nb class="q-ma-sm q-my-md" :text="text"/>
    <q-card-actions vertical align="right">
      <slot />
    </q-card-actions>
  </q-card>
</template>

<script setup>
// import { ref, computed } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from './BtnCond.vue'
import SdNb from './SdNb.vue'

const props = defineProps({
  title: string,
  text: String
})

const emit = defineEmits(['giveup'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>