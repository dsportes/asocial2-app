<template>
<q-card :class="sty('sm')">
  <q-toolbar class="tbp">
    <q-toolbar-title>{{$t('PEtit')}}</q-toolbar-title>
    <help-button page="reloadApp"/>
  </q-toolbar>

  <div class="q-pa-sm">
    <div class="titre-md text-italic q-my-md">{{ $t(('PEinfo')) }}</div>

    <q-btn v-if="perm === 'prompt'" flat :label="$t('PEopt2')" class="q-my-md" 
      @click="rp"/>
    <div v-else class="titre-md text-bold q-my-md">{{ $t(('PEopt1')) }}</div>

    <div class="q-ma-md text-center">
      <q-btn dense icon="close" flat color="warning" 
        :label="$t('closeApp')" 
        @click="coolBye"/>
    </div>

  </div>
</q-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { config, sty, coolBye } from '../app/util'
import HelpButton from './HelpButton.vue'
import { myRegister } from 'app/src-pwa/register-service-worker'

const perm = computed(() => config.permState)

const rp = async () => {
  const p = await Notification.requestPermission()
  config.permState = p
  if (p === 'granted') {
    if (!config.registration) {
      myRegister()
      config.permDialog = false
    }
  }
}

watch(perm, (p: string) => {
  if (p === 'granted') {
    if (!config.registration) {
      myRegister()
      config.permDialog = false
    }
  }
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>