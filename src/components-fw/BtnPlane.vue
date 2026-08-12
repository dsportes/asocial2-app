<template>
  <q-btn icon="flight" flat class="q-mr-xs" padding="none" color="green-5">
    <q-menu>
      <div class="titre-md text-italic q-pa-xs">{{ $t('planemode') }}</div>
      <div class="q-pa-xs">
        <span class="titre-md text-italic">{{ $t('pseudolocal') }}</span>
        <span class="q-ml-sm text-bold font-mono">{{ sf.userName }}</span>
      </div>
      <div class="q-pa-xs">
        <span class="titre-md text-italic">{{ $t('userid') }}</span>
        <span class="q-ml-sm font-mono">{{ sf.userId }}</span>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import { $t } from '../src-fw/util'

const sf = stores.safe
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>