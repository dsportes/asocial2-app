<template>
  <dialog-std0 v-model="session.dialogs.netStatus" vh="75"
    @close="checkCloseOptions" 
    :title="$t('NStit')">
    <template #default>
      <div v-if="!session.syncOK" class="q-my-sm q-pas-xz msg titre-md">{{ $t('NSsyncKO') }}</div>
      <div v-if="session.allOK" class="q-my-sm titre-md text-italic">{{ $t('NSallok')}}</div>
      <div v-else>
        <div class="q-my-sm">
        <div v-for="n in 4" :key="n" class="row items-center">
          <q-icon :name="icons[n -1]" size="md" :color="colors[n -1]"/>
          <div class="q-ml-md titre-md text-italic">{{  $t('NSst_' + [n -1]) }}</div>
        </div>
        </div>

        <div v-for="site in Object.keys[status]" :key="site">
          <div class="row items-center q-gutter-sm">
            <div class="col-auto titre-md text-italic">{{$t('NSsite')}}</div>
            <q-icon class="col-auto" :name="icons[st(site)]" size="md" :color="colors[st(site)]"/>
            <div class="font-mono text-bold">{{ site }}</div>
          </div>
          <div v-if="st(site)" class="q-ml-lg">
            <div v-for="svc in Object.keys[elt(site)]" :key="svc">
              <div class="row no-wrap items-center q-gutter-sm">
                <div class="col-auto titre-md text-italic">{{$t('NSsvc')}}</div>
                <q-icon class="col-auto" :name="icons[st(site, svc)]" size="md" :color="colors[st(site, svc)]"/>
                <div class="col-auto font-mono text-bold">{{ svc }}</div>
                <div class="col ellipsis">{{ $t('services_' + svc) }}</div>
              </div>
              <div v-if="st(site, svc) === 1 || st(site, svc) === 2" class="q-ml-lg">
                <div v-for="org in Object.keys[elt(site, svc)]" :key="org" class="row q-gutter-md">
                  <div v-if="org !== '$ST$'" class="row no-wrap items-center q-gutter-xs">
                    <q-icon class="col-auto" :name="icons[st(site, svc, org)]" size="md" 
                      :color="colors[st(site, svc, org)]"/>
                    <div class="col-auto font-mono">{{ org }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </dialog-std0>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const icons = ['close', 'check_circle', 'visibility', 'block']
const colors = ['negative', 'green-5', 'green-5', 'warning']

const session = stores.session
const ui = stores.ui

const status = computed(() => session.nsStatus || {})

const elt = (site, svc?) => {
  const e = status.value[site]
  return !svc ? e : e[svc]
}
const st = (site, svc?, org?) => {
  const e = elt(site, svc)
  if (!org) {
    const st = e.$ST$
    return st == 9 ? 3 : st
  }
  const st = e[org]
  return st == 9 ? 3 : st
}

/* session:
  syncOK: si false rupture de synchro détectée
  netStatus: si non null, status général calculé
  dialogs.
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

const checkCloseOptions = async () => {
  // Ne ferme pas le dialogue, c'est <select-option> qui le fera ou non
  if (await ui.mayClose()) okOptions()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>