<template>
  <q-btn flat class="q-mr-xs" padding="none" 
    :color="color"
    :icon="icons[mode]">
    <q-menu class="q-pa-sm">
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

      <div v-if="session.hasNet">
        <div v-if="session.permState !== 'granted'" class="q-pa-xs msg">{{ $t('PEinfo') }}</div>
        <div v-else>
          <div v-if="session.step > 1">
            <div v-if="session.syncOK" class="q-my-sm text-italic"> {{  $t('PEsyncok') }}</div>
            <div v-else>
              <div class="q-my-smrow items-center">
                <div class="col q-pa-xs msg"> {{  $t('PEsyncko') }}</div>
                <btn-cond class="col-auto q-ml-sm":label="$t('PEsyncmore')" @ok="more"/>
              </div>
            </div>
          </div>
        </div>
        <q-expansion-item v-if="session.netStatus" :label="$t('PEdetail')" dense
          header-class="tbs text-bold titre-md text-italic">
          <net-status/>
        </q-expansion-item>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import stores from '../stores/all'
// @ts-ignore
import { computed } from 'vue'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import NetStatus from '../components-fw/NetStatus.vue'

const icons = ['', 'cloud_sync', 'cloud', 'flight', 'calculate']

const sf = stores.safe
const session = stores.session
const mode = computed(() => session.loginMode )

const color = computed(() => session.hasNet && session.permState !== 'granted' ? 'negative' :
   (session.step > 0 ? 'green-5' : 'grey-5'))

const more = () => {
  session.dialogs.netStatus = true
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>