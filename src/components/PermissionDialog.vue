<template>
<q-card :class="sty('sm')">
  <q-toolbar class="tbp">
    <q-toolbar-title>{{$t('PEtit')}}</q-toolbar-title>
    <help-button page="reloadApp"/>
  </q-toolbar>

  <div class="q-pa-sm">
    <div class="titre-md text-italic q-my-md">{{ $t(('PEinfo')) }}</div>

    <q-btn v-if="!config.permChange && perm === 'prompt'" flat 
      :label="$t('PEopt2')" class="q-my-md" @click="rp"/>

    <div v-if="perm !== 'granted'"
      class="titre-md text-bold q-my-md">{{ $t(('PEopt1')) }}</div>

    <div class="q-ma-md column justify-center q-gutter-md">
     <q-btn v-if="config.permChange" dense icon="restart_alt" flat color="warning"
        :disable="perm !== 'granted'"
        :label="$t('restartApp')" 
        @click="reloadPage"/>

      <q-btn dense icon="close" flat color="warning" 
        :label="$t('closeApp')" 
        @click="coolBye"/>
    </div>

  </div>
</q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { config, sty, coolBye, reloadPage } from '../app/util'
import HelpButton from './HelpButton.vue'

const perm = computed(() => config.permState)

const rp = async () => {
  const p = await Notification.requestPermission()
  config.changePerm(p)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>