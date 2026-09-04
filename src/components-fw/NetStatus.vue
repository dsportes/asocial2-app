<template>
  <div v-if="session.netStatus">
    <div v-if="!entries.length" class="titre-md text-italic">{{ $t('NSnone') }}</div>
    <div v-else>
      <div class="q-my-sm">
        <div v-for="n in 4" :key="n" class="row no-wrap items-center">
          <q-icon class="col-auto" :name="icons[n -1]" size="1em" :color="colors[n -1]"/>
          <div class="col q-ml-xs titre-sm text-italic">{{  $t('NSst_' + [n -1]) }}</div>
        </div>
      </div>

      <div v-if="session.allOK" class="q-my-sm titre-md text-italic">{{ $t('NSallOK')}}</div>
      <div v-else class="q-my-sm msg">{{ $t('NSallKO') }}</div>
      <div v-for="site in entries" :key="site">
        <div class="row items-center q-gutter-sm">
          <div class="col-auto titre-md text-italic">{{$t('NSsite')}}</div>
          <q-icon class="col-auto" :name="icons[st(site)]" size="1em" :color="colors[st(site)]"/>
          <div class="font-mono text-bold">{{ site }}</div>
        </div>
        <div v-if="st(site)" class="q-ml-lg">
          <div v-for="svc in Object.keys(elt(site))" :key="svc">
            <div v-if="svc !== '$ST$'">
              <div class="row no-wrap items-center q-gutter-sm">
                <div class="col-auto titre-md text-italic">{{$t('NSsvc')}}</div>
                <q-icon class="col-auto" :name="icons[st(site, svc)]" size="1em" :color="colors[st(site, svc)]"/>
                <div class="col-auto font-mono text-bold">[{{ svc }}]</div>
                <div class="col ellipsis">{{ $t('services_' + svc) }}</div>
              </div>
              <div v-if="st(site, svc) === 1 || st(site, svc) === 2" class="q-ml-lg">
                <div v-for="org in Object.keys(elt(site, svc))" :key="org"
                  class="row q-gutter-md q-pb-sm">
                  <div v-if="org !== '$ST$'" class="row no-wrap items-center">
                    <q-icon class="q-mr-xs " :name="icons[st(site, svc, org)]" size="1em" 
                      :color="colors[st(site, svc, org)]"/>
                    <div class="font-mono">{{ org }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

const icons = ['close', 'check_circle', 'visibility', 'block']
const colors = ['negative', 'green-5', 'green-5', 'warning']

const session = stores.session

const status = computed(() => session.netStatus)
const entries = computed(() => Array.from(Object.keys(session.netStatus)))

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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>