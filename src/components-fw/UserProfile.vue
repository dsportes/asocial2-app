<!-- Boîte d'affichage du profil courant de l'utilisateur -->
<template>
<div>
  <div v-if="sf.userId" class="q-pa-sm column q-gutter-sm">
    <div class="row items-center">
      <div class="titre-md text-italic q-mr-sm">{{ $t('SFTus') }}</div>
      <div class="fs-lg font-mono">{{ sf.userId }}</div>
    </div>
    <div class="row items-center">
      <div class="titre-md text-italic q-mr-sm">{{ $t('SFT' + (sf.userName !== '' ? 'ps' : 'nops')) }}</div>
      <div v-if="sf.userName !== ''" class="font-mono">{{ sf.userName }}</div>
    </div>
    <div class="row items-center">
      <div class="titre-md text-italic q-mr-sm">{{ $t('SFTa1') }}</div>
      <div class="font-mono">{{ sf.auth.actual.a1K }}</div>
    </div>
    <div v-if="!sf.auth.actual.a2K" class="titre-md text-italic">{{ $t('SFTa2n') }}</div>
    <div v-else class="row  items-center">
      <div class="titre-md text-italic q-mr-sm">{{ $t('SFTa2') }}</div>
      <div class="font-mono">{{ sf.auth.actual.a2K }}</div>
    </div>
    <div v-if="sf.auth.admins" class="row items-center">
      <div class="titre-md text-italic q-mr-sm">{{ $t('SFTadmin')}}</div>
      <div class="font-mono">{{ sf.auth.admins }}</div>
    </div>
    <text-zoom class="q-my-xs" :label="$t('SFTexppub')" 
      :text="infopub" :rows="15"/>
  </div>
  <div v-else class="titre-md text-italic">{{$t('SFTguest')}}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

import TextZoom from '../components-fw/TextZoom.vue'

const decoder = new TextDecoder()

const sf = stores.safe

const infopub = computed(() => JSON.stringify([sf.auth.C, sf.auth.V], null, '\t'))

const admins = ref('')

if (sf.userId && sf.auth.admins) {
  let x = sf.auth.admins
  x.replaceAll('/', ' ')
  admins.value = x
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
