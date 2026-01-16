<template>
<!-- Affiche un message MD : liste de choix d'actions dans le slot -->
  <q-card :class="sty('sm')">
    <q-toolbar class="tbs">
      <btn-cond icon="close" size="md" flat color="warning" @ok="stores.ui.fD"/>
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

const ui = stores.ui
const gotit = () => { ui.fD(); const f = ui.diagResolve; if (f) f()} 

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>