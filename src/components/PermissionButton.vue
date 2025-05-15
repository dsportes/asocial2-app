<template>
<div>
  <q-icon v-if=" perm === 'granted'" name="lock_open" color="green-5" padding="none" size="sm"/>
  <q-btn v-else icon="lock" color="negative" padding="none" @click="askperm = true"/> 

  <q-dialog v-model="askperm" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <!--q-btn dense icon="close" color="warning" :label="$t('gotit')" @click="askperm = false"/-->
        <q-toolbar-title>{{$t('PEtit')}}</q-toolbar-title>
        <help-button page="reloadApp"/>
      </q-toolbar>

      <div class="q-pa-sm">
        <div class="titre-md text-italic q-my-md">{{ $t(('PEinfo')) }}</div>

        <q-btn v-if="perm === 'prompt'" flat :label="$t('PEopt2')" class="q-my-md" 
          @click="rp"/>
        <div v-else class="titre-md text-bold q-my-md">{{ $t(('PEopt1')) }}</div>
      </div>
    </q-card>
  </q-dialog>

</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { config, sty } from '../app/util'
import HelpButton from './HelpButton.vue'

const perm = computed(() => config.permState)

const askperm = ref(perm.value !== 'granted')

const rp = async () => {
  await config.requestPermission()
}

watch(perm, (ap) => {
 askperm.value = ap !== 'granted'
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>