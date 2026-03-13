<!-- Boîte d'affichage du profil courant de l'utilisateur -->
<template>
<div>
  <div v-if="sf.userId" class="q-pa-sm column q-gutter-sm">
    <div class="row q-gutter-sm q-my-xs items-end">
      <div class="titre-md text-italic">{{ $t('SFTus') }}</div>
      <div class="fs-lg font-mono">{{ sf.userId }}</div>
    </div>
    <div class="row q-gutter-sm q-my-xs items-end">
      <div class="titre-md text-italic">{{ $t('SFT' + (sf.userName !== '' ? 'ps' : 'nops')) }}</div>
      <div v-if="sf.userName !== ''" class="font-mono">{{ sf.userName }}</div>
    </div>
    <div class="row q-gutter-sm q-my-xs items-end">
      <div class="titre-md text-italic">{{ $t('SFT' + (sf.auth.contact !== '' ? 'ct' : 'noct')) }}</div>
      <div v-if="sf.auth.contact !== ''" class="font-mono">{{ sf.auth.contact }}</div>
    </div>
    <div v-if="sf.auth.admins" class="row q-gutter-sm q-my-xs items-end">
      <div class="titre-md text-italic">{{ $t('SFTadmin')}}</div>
      <div class="font-mono">{{ sf.auth.admins }}</div>
    </div>
    <text-zoom class="q-my-xs" :label="$t('SFTexppub')" 
      :text="infopub" :rows="15"/>
  </div>
  <div v-else class="titre-md text-italic">{{$t('SFTguest')}}</div>
</div>
</template>

<script setup lang="ts">
/*
  UPtitle: 'Profil utilisateur',
  UPid: 'ID',
  UPpseudo: 'Pseudo local à ce terminal',
  UPnone: '(aucun)',
  UPcontact: 'Pseudo ou phrase de contact externe',
  UPsessionid: 'ID de synchronisation de la session',
  UPadmins: 'Administrateur technique de :',
*/
// @ts-ignore
import { ref, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

import TextZoom from '../components-fw/TextZoom.vue'

const sf = stores.safe
const session = stores.session
const ui = stores.ui

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
