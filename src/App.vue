<template>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-toolbar-title class="titre-md">{{$t('titre', [config.dataSt.cpt])}}</q-toolbar-title>
    <q-btn icon="add" label="Plus 1" @click="plus1"/>
    <q-btn class="q-mr-sm" icon="remove" label="Moins 1" @click="moins1"/>
    <bouton-langue class="q-mr-sm" style="position:relative;top:2px;"/>
    <q-btn icon="contrast" round @click="$q.dark.toggle()"/>
  </q-toolbar>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
const $q = useQuasar()
import { useConfigStore } from './stores/config-store.js'
const config = useConfigStore()

// import { useI18n } from 'vue-i18n'
// const $t = useI18n().t

import BoutonLangue from './components/BoutonLangue.vue'

const plus1 = () => {
  config.dataSt.cpt++
}
const moins1 = () => {
  config.dataSt.cpt--
}
</script>

<style lang="scss" scoped>
@import './css/app.scss';
</style>
