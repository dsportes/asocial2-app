<template>
<div>
  <div class="row q-my-sm q-px-xs">
    <q-select class="col-5" dense filled v-model="service"
      :options="services" emit-value :label="$t('service')"/>
    <div class="col-1"/>
    <input-A class="col-6" prefix="operator" v-model="$OP" size="oper"
      :list="config.K.FAVORITE_OPERATORS"/>
  </div>

  <q-separator color="orange" class="q-my-sm"/>

  <div class="row q-px-sm">
    <div class="col-5 column items-center q-pr-sm">
      <btn-cond :label="$t('service_status')" :disable="!$OP"
        @click="svcOpStatus"/>
    </div>
    <div v-if="resping !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping.now)])}}</div>
      <div>{{$t('svcStatus_' + resping.st, [dhcool(resping.at)])}}</div>
      <div>{{resping.txt || $t('svcnocomment')}}</div>
    </div>
  </div>

  <q-separator color="orange" class="q-my-sm"/>

  <div class="row q-px-sm">
    <div class="col-5 column items-center q-pr-sm">
      <input-A class="full-with" prefix="orgcode" v-model="org" size="org"/>
      <btn-cond :label="$t('org_status')" :disable="!$OP || !org"
        @click="svcOrgStatus"/>
    </div>
    <div v-if="resping2 !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping2.now)])}}</div>
      <div>{{$t('svcStatus_' + resping2.st, [dhcool(resping2.at)])}}</div>
      <div>{{resping2.txt || $t('svcnocomment')}}</div>
    </div>
  </div>
    
  <q-separator color="orange" class="q-my-sm"/>

  <!--
  <div v-if="svcl.length" v-for="svc in svcl" :key="svc" class="q-my-md q-pa-xs">

    <btn-cond icon-right="send" :label="' ' + svc + ' '"
      padding=" xs md" @click="getSrvStatus(svc)"/>
    <div v-if="res[svc]" class="column q-ml-lg font-mono">
      <div>URL: {{res[svc]['url']}}</div>
      <div>API: {{res[svc]['api']}}</div>
      <div v-if="!res[svc]['err'] && res[svc]['done']">
        <div>{{$t('svcStatus_'+ res[svc]['st'], [res[svc]['at']])}}</div>
        <div class="text-italic fs-md">{{res[svc]['txt'] || $t('svcnocomment')}}</div>
        <div>{{$t('svcStatus_now', [res[svc]['now']])}}</div>
      </div>
      <div v-else>{{res[svc]['err']}}</div>
      <q-separator class="q-my-xs"/>
      <div v-if="sf.step === 0 && lstSvc && lstSvc.has(svc)">
        <div class="titre-md text-italic text-bold">{{$t('svcStatus_maj')}}</div>
        <input-a prefix="svcStatus" v-model="res[svc]['comment']"/>
        <div class="row justify-end q-gutter-sm">
          <btn-cond color="primary" :label="$t('up')" padding="none sm"
            @ok="setSrvStatus(svc, 1)"/>
          <btn-cond color="warning" :label="$t('down')" padding="none sm"
            @ok="setSrvStatus(svc, 0)"/>
        </div>
        <q-separator class="q-my-xs"/>
      </div>
    </div>
  </div>
  -->
</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'
import { sty, dhcool } from '../src-fw/util'
import BtnCond from './BtnCond.vue'
import InputA from './InputA.vue'
import { GetSvcOpStatus, GetSvcOrgStatus } from '../src-fw/operations'

const ui = stores.ui
const config = stores.config
const session = stores.session
const sf = stores.safe

const services = Array.from(Object.keys(config.K.SERVICES))

const service = ref()
const org = ref('')
const $OP = ref()
const resping = ref(null)
const resping2 = ref(null)

const resetPing = () => {
  org.value = ''
  $OP.value = ''
  service.value = services[0]
  resping.value = null
  resping2.value = null
}

const svcOpStatus = async () => {
  resping.value = null
  try {
    resping.value = await new GetSvcOpStatus(service.value).run($OP.value)
  } catch (e) { }
}

const svcOrgStatus = async () => {
  await svcOpStatus()
  resping2.value = null
  try {
    resping2.value = await new GetSvcOrgStatus(service.value).run(org.value)
  } catch (e) { }
}

const lstSvc = computed(() => { return session.admin.services })

const res = reactive({})
const svcl = ref([])

for(const svc in config.K.SERVICES) {
  const e = config.K.SERVICES[svc]
  svcl.value.push(svc)
  res[svc] = {
    comment: '',
    done: false,
    now: '',
    st: '',
    at: '',
    txt: '',
    url: e.url,
    api: e.api,
    err: ''
  }
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
    x.txt = ''
    x.comment = ''
    const { now, st, at, txt } = await new GetSrvStatus().run(svc)
    x.now = new Date(now).toISOString()
    x.txt = txt
    x.st = '' + st
    x.at = at ? new Date(at).toISOString() : '?'
    x.done = true
  } catch (e) {
    res[svc]['err'] = (e.code || '???')
  }
}

/* SetSrvStatus fixe le status du service: { st, at, txt }
  st: code 0: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSrvStatus (svc, stx) : Promise<void> {
  try {
    const x = res[svc]
    x.done = false
    x.err = ''
    x.now = ''
    x.st = ''
    x.at = ''
    x.txt = ''
    const { now, st, at, txt } = await new SetSrvStatus().run(svc, stx, x['comment'])
    x.comment = ''
    x.now = new Date(now).toISOString()
    x.txt = txt
    x.st = '' + st
    x.at = at ? new Date(at).toISOString() : '?'
    x.done = true
  } catch (e) {
    res[svc]['err'] = (e.code || '???')
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
