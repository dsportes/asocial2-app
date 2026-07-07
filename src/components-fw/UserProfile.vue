<!-- Boîte d'affichage du profil courant de l'utilisateur -->
<template>
<div>
  <div v-if="sf.userId" class="q-pa-sm column q-gutter-xs">
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

    <div class="q-my-sm" v-if="mgrCreds.size">
      <div class="titre-md text-italic">{{ $t('svcStatus_no4') }}</div>
      <div v-for="[credId, c] in mgrCreds" :key="credId">
        <div class="row items-center">
          <btn-cond class="col-1" icon="delete" round color="warning"
            confirm @ok="revok(c)"/>
          <div class="col-5 font-mono ellipsis">{{ $t('CREDON_' + c.docCl) }}</div>
          <div class="col-4 font-mono ellipsis">{{ $t('services_' + c.svc) }}</div>
          <div class="col-2 font-mono ellipsis">{{c.org }}</div>
        </div>
      </div>
    </div>
    <div v-else class="titre-md text-italic">{{ $t('svcStatus_no3') }}</div>

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
import { AutoRevokeCred } from '../src-fw/operations'
import BtnCond from '../components-fw/BtnCond.vue'
import TextZoom from '../components-fw/TextZoom.vue'

const sf = stores.safe
const ui = stores.ui

const infopub = computed(() => JSON.stringify([sf.auth.C, sf.auth.V], null, '\t'))

const admins = ref('')

if (sf.userId && sf.auth.admins) {
  let x = sf.auth.admins
  x.replaceAll('/', ' ')
  admins.value = x
}

const mgrCreds = ref(sf.managerCreds())

const revok = async (c) => {
  let op = new AutoRevokeCred(c.svc, c.org)
  const ok = await op.run(c)
  if (!ok) {
    await ui.diagDisplay($t('APrevko'))
  } else {
    await sf.fixCreds([], [c.credId])
    await ui.diagDisplay($t('APrevok'))
    mgrCreds.value = sf.managerCreds()
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
