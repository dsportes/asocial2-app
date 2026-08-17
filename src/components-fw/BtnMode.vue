<template>
  <q-btn flat class="q-mr-xs" padding="none" 
    :color="session.step > 0 ? 'green-5' : 'grey-5'"
    :icon="icons[mode]">
    <q-menu>
      <div class="titre-md text-italic q-pa-xs">{{ $t('LOGmode_' + mode) }}</div>
      <div v-if="sf.userId">
        <div v-if="session.hasLocal" class="q-pa-xs">
          <span class="titre-md text-italic">{{ $t('pseudolocal') }}</span>
          <span class="q-ml-sm text-bold font-mono">{{ sf.userName }}</span>
        </div>
        <div class="q-pa-xs">
          <span class="titre-md text-italic">{{ $t('userid') }}</span>
          <span class="q-ml-sm font-mono">{{ sf.userId }}</span>
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import stores from '../stores/all'
// @ts-ignore
import { computed } from 'vue'
import { $t } from '../src-fw/util'

const icons = ['', 'cloud_sync', 'cloud', 'flight', 'calculate']

const sf = stores.safe
const session = stores.session
const mode = computed(() => session.loginMode )
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>