<template>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-toolbar-title class="titre-md">{{$t('titre', [config.dataSt.cpt])}}</q-toolbar-title>
    <q-btn icon="add" label="Plus 1" @click="plus1"/>
    <q-btn class="q-mr-sm" icon="remove" label="Moins 1" @click="moins1"/>
    <bouton-langue class="q-mr-sm" style="position:relative;top:2px;"/>
    <q-btn icon="contrast" round @click="$q.dark.toggle()"/>
  </q-toolbar>
</template>

<script setup lang="ts">

// import { ref } from 'vue';
// @ts-ignore
import { useQuasar } from 'quasar'
import { useConfigStore } from './stores/config-store'
// @ts-ignore
import { useI18n } from 'vue-i18n'
import BoutonLangue from './components/BoutonLangue.vue'

const $q = useQuasar()
const config = useConfigStore()
config.$t = useI18n().t // Pour rendre accessible $t dans le code

function plus1 () : void {
  config.dataSt.cpt++
}
function moins1 () : void {
  config.dataSt.cpt--
}
</script>

<style lang="scss" scoped>
@import './css/app.scss';
</style>
