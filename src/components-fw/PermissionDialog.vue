<template>
<q-card :class="sty('sm')">
  <q-toolbar class="tbp">
    <q-toolbar-title>{{$t('PEtit')}}</q-toolbar-title>
    <help-button page="reloadApp"/>
  </q-toolbar>

  <div class="q-pa-sm">
    <div class="titre-md text-italic q-my-md">{{ $t(('PEinfo')) }}</div>

    <btn-cond v-if="!session.permChange && perm === 'prompt'" flat 
      :label="$t('PEopt2')" class="q-my-md" @ok="rp"/>

    <div v-if="perm !== 'granted'"
      class="titre-md text-bold q-my-md">{{ $t(('PEopt1')) }}</div>

    <div class="q-ma-md column justify-center q-gutter-md">
     <btn-cond v-if="session.permChange" icon="restart_alt" flat color="warning"
        :disable="perm !== 'granted'"
        :label="$t('restartApp')" 
        @ok="reloadPage"/>

      <btn-cond dense icon="close" flat color="warning" 
        :label="$t('closeApp')" 
        @ok="coolBye"/>
    </div>

  </div>
</q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import stores from '../stores/all'
import { sty, coolBye, reloadPage } from '../src-fw/util'
import HelpButton from './HelpButton.vue'
import BtnCond from './BtnCond.vue'

const session = stores.session

const perm = computed(() => session.permState)

const rp = async () => {
  const p = await Notification.requestPermission()
  session.changePerm(p)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>