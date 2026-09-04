<template>
  <dialog-std0 v-model="session.dialogs.netStatus" vh="75"
    @close="checkCloseOptions" 
    :title="$t('NStit')">
    <template #default>
      <div v-if="!session.syncOK" class="q-my-sm q-pas-xz msg titre-md">{{ $t('NSsyncKO') }}</div>
      <div v-if="session.allOK" class="q-my-sm titre-md text-italic">{{ $t('NSallOK')}}</div>
      <div v-else class="q-my-sm">
        <div v-if="verif" class="titre-lg text-italic q-ma-md">{{ $t('NSverif') }}</div>
        <div v-else>
          <net-status/>
          <q-separator class="q-my-sm q-mb-md" color="orange"/>
        </div>

        <div :class="verif ? 'disabled' : ''">
          <bar-open v-if="session.syncOK" 
            :bubble="$t('NSretry_bub')" :title="$t('NSretry_label')"
            @open="retry"/>
          <bar-open v-if="!session.syncOK"
            :bubble="$t('NSresync_bub')" :title="$t('NSresync_label')"
            @open="retry"/>
          <bar-open :bubble="$t('NSchgopts_bub')" :title="$t('NSchgopts_label')"
            @open="chgopts"/>
          <bar-open :bubble="$t('NSdcnx_bub')" :title="$t('NSdcnx_label')"
            @open="dcnx"/>
          </div>
        </div>
    </template>
  </dialog-std0>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed, ref } from 'vue'

import stores from '../stores/all'
import { $t, sleep } from '../src-fw/util'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { checkStatus } from '../src-fw/operation'
import NetStatus from '../components-fw/NetStatus.vue'
import BarOpen from '../components-fw/BarOpen.vue'

const session = stores.session
const ui = stores.ui

const verif = ref(false)
const status = computed(() => !session.allOK ? session.nsStatus : {})

const elt = (site, svc?) => {
  const e = status.value[site]
  return !svc ? e : e[svc]
}
const st = (site, svc?, org?) => {
  const e = elt(site, svc)
  if (!org) {
    const s = e.$ST$
    return s == 9 ? 3 : s
  }
  const s = e[org]
  return s == 9 ? 3 : s
}

/* session:
  syncOK: si false rupture de synchro détectée
  netStatus: status général calculé
  allOK: si true, tous les status sont OK
  Si session.step === 1:
    - si dialogs.options: dialogue toujours ouvert - l'a été par SafeBox
    - sinon page login en cours sur le composant <select-options>
  Si session.step === 2
    - si dialogs.options: dialogue toujours ouvert - l'a été par LeftMenu ou ici
    - sinon : problème de synchro, pas de dialogue option 
*/

const okOptions = () => {
  session.okOptions = session.okOptions + 1
}

const recheck = async () : Promise<boolean> => {
  const t0 = Date.now()
  verif.value = true
  const allOK = await checkStatus (session.orgRoles)
  const lapse = Date.now() - t0
  if (lapse < 2000) await sleep(2000 - lapse)
  verif.value = false
  return allOK
}

const retry = async () => {
  const ok = await recheck()
  if (ok) {
    if (session.step === 1) {
      session.dialogs.netStatus = false
      okOptions()
    } else { // step = 2
      session.dialogs.options = true
      okOptions()
    }
  }
}

const chgopts = async () => {
  if (session.step === 1) {
    session.dialogs.netStatus = false
    // okOptions()
  } else { // step = 2
    session.dialogs.options = true
    // okOptions()
  }
}

const dcnx = () => {
  ui.sessionClose()
}

const checkCloseOptions = async () => {
  retry()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>