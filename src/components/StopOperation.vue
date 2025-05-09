<template>
<div>
  <div v-if="config.opSpinner >= 2" class="column items-center q-mt-lg">
    <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <div class="row items-center justify-between bg-white q-pa-sm cursor-pointer stop"
        style="width:20rem" @click="confirmstopop = true">
        <div class="col column items-center">
          <div class="text-bold titre-md">{{$t('MLAopc')}}</div>
          <div class="text-bold text-italic">{{$t('op_' + config.opEncours)}}</div>
          <div class="titre-sm">{{$t('MLAint')}}</div>
        </div>
        <div class="col-auto row items-center justify-center q-pa-sm">
          <q-spinner color="primary" size="40px" :thickness="4"/>
          <div class="font-mono fs-xs text-center text-white text-bold bg-negative tag">
            {{config.opSpinner}}</div>
        </div>
      </div>
    </transition>
  </div>

  <!-- Confirmation d'interruption de l'opération en cours -->
  <q-dialog v-model="confirmstopop">
    <q-card>
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [$t('op_' + config.opEncours)])}}</q-card-section>
      <q-card-actions vertical align="right" class="q-gutter-sm">
        <q-btn flat color="primary" :label="$t('MLAcf3')" @click="confirmstopop = false"/>
        <q-btn flat color="primary" :label="$t('MLAcf4')" @click="confirmstopop = false; abortPostOp()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue';
import { config, abortPostOp } from '../app/util'
const confirmstopop = ref(false)
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.tag { border-radius:10px; height: 20px; width: 20px; padding-top: 2px; overflow:hidden; }
.stop { border-radius : 8px; border: 2px solid transparent}
.stop:hover { border-color: $negative }
</style>
