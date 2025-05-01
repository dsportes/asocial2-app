<template>
<div>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-toolbar-title class="titre-md">{{$t('titre', [config.dataSt.cpt])}}</q-toolbar-title>
    <q-btn icon="add" label="Plus 1" @click="plus1"/>
    <q-btn class="q-mr-sm" icon="remove" label="Moins 1" @click="moins1"/>
    <bouton-langue class="q-mr-sm" style="position:relative;top:2px;"/>
    <q-btn icon="contrast" round @click="$q.dark.toggle()"/>
  </q-toolbar>
  <div class="row q-pa-sm justify-center q-gutter-md">
    <q-input filled v-model="echo" :label="$t('echo')">
      <template v-slot:append>
        <q-btn icon="check" :disable="echo === ''" @click="op"/>
      </template>
    </q-input>
    <q-btn icon="send" :label="$t('ping')" @click="ping"/>
  </div>
  <div class="font-mono q-pa-sm">{{res}}</div>
</div>
</template>

<script setup lang="ts">

import { ref } from 'vue';
// @ts-ignore
import { useQuasar } from 'quasar'
// @ts-ignore
import { useConfigStore } from './stores/config-store'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import BoutonLangue from './components/BoutonLangue.vue'

import { post } from './app/util'

const $q = useQuasar()
const config = useConfigStore()
config.$t = useI18n().t // Pour rendre accessible $t dans le code

function plus1 () : void {
  config.dataSt.cpt++
}
function moins1 () : void {
  config.dataSt.cpt--
}

const echo = ref('')

async function op () {
  try {
    const res = await post('EchoTexte', { text: echo.value })
    echo.value = res['echo']
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

const res = ref('')
async function ping () {
  try {
    const x = await post('PingDB', { })
    res.value = x['status'] + ' - ' + x['msg']
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

</script>

<style lang="scss" scoped>
@import './css/app.scss';
</style>
