<template>
<div>
  <div v-for="svc in svcl" :key="svc" class="q-my-md q-pa-xs">
    <btn-cond icon-right="send" :label="' ' + svc + ' '"
      @click="getSrvStatus(svc)"/>
    <div v-if="res[svc]" class="column q-ml-lg font-mono">
      <div>URL: {{res[svc]['url']}}</div>
      <div>API: {{res[svc]['api']}}</div>
      <div v-if="!res[svc]['err'] && res[svc]['done']">
        <div>{{$t('svcStatus_'+ [res[svc]['st']], [res[svc]['at']])}}</div>
        <div>{{$t('svcStatus_dh', [res[svc]['nowS']])}}</div>
        <div>{{$t('svcStatus_'+ [res[svc]['st']], [res[svc]['at']])}}</div>
      </div>
      <div v-else>{{res[svc]['err']}}</div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from './BtnCond.vue'
import { GetSrvStatus, SetSrvStatus } from '../src-fw/operations'

const ui = stores.ui
const config = stores.config

const res = reactive({})
const svcl = ref([])

for(const svc in config.K.SERVICES) {
  const e = config.K.SERVICES[svc]
  svcl.value.push(svc)
  res[svc] = { done: false, now: '', st: '', at: '', url: e.url, api: e.api, err: '' }
}

/* GetSrvStatus retourne le status du service: { st, at, txt }
  st: code 0: DOWN, 1: UP
  at: time de dernière mise à jour
  txt: texte explicatif éventuel de l'administrateur
*/
async function getSrvStatus (svc) : Promise<void> {
  try {
    const x = res[svc]
    x.done = false
    x.err = ''
    x.now = ''
    x.st = ''
    x.at = ''
    const { now, st, at, txt } = await new GetSrvStatus().run('', svc)
    x.now = new Date(now).toISOString()
    x.st = '' + st
    x.at = at ? new Date(at).toISOString() : '?'
    x.done = true
  } catch (e) {
    res[svc]['err'] = (e.code || '???')
  }
}

async function opSetSrvStatus (stx) : Promise<void> {
  try {
    resping.value = ''
    const { now, st, at, txt } = await new SetSrvStatus().run(org.value, stx)
    const nowS = new Date(now).toISOString()
    const atS = at ? new Date(at).toISOString() : '?'
    const stS = $t('srvStatus_' + st, [atS])
    resping.value = $t('srvStatus', [nowS, stS, txt || ''])
  } catch (e) {
    resping.value = 'err:' + (e.code || '???')
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>