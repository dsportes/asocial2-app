<template>
<div>
  <div v-if="session.admin && session.admin.svcOps.size">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div class="row q-gutter-sm">
      <div v-for="svcOp in session.admin.svcOps" :key="svcOp"
        @click=setSvcOp(svcOp)
        class="font-mono text-bold cursor-pointer text-underlined">
        {{svcOp.replace('/', ' / ')}}
      </div>
    </div>
  </div>

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
        @ok="svcOpStatus"/>
    </div>
    <div v-if="resping !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping.now)])}}</div>
      <div>{{$t('svcStatus_' + resping.st, [dhcool(resping.at)])}}</div>
      <div>{{resping.txt || $t('svcnocomment')}}</div>
    </div>
  </div>

  <q-separator color="orange" class="q-my-sm"/>

  <div v-if="maySetSt">
    <div class="titre-md text-italic text-bold">{{$t('svcStatus_maj')}}</div>
    <input-a prefix="svcStatus" v-model="newComment"/>
    <div class="q--mt-sm row justify-end q-gutter-sm">
      <btn-cond color="primary" :label="$t('up')" padding="none sm"
        @ok="setSrvStatus(1)"/>
      <btn-cond color="warning" :label="$t('down')" padding="none sm"
        @ok="setSrvStatus(9)"/>
    </div>
    <q-separator color="orange" class="q-my-sm"/>
  </div>

  <div class="row q-px-sm">
    <div class="col-5 column items-center q-pr-sm">
      <input-A class="full-with" prefix="orgcode" v-model="org" size="org"/>
      <btn-cond :label="$t('org_status')" :disable="!$OP || !org"
        @ok="svcOrgStatus"/>
    </div>
    <div v-if="resping2 !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping2.now)])}}</div>
      <div>{{$t('svcStatus_' + resping2.st, [dhcool(resping2.at)])}}</div>
      <div>{{resping2.txt || $t('svcnocomment')}}</div>
    </div>
  </div>
    
  <q-separator color="orange" class="q-my-sm"/>

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

const service = ref('')
const org = ref('')
const $OP = ref('')
const resping = ref(null)
const resping2 = ref(null)
const newComment = ref('')

const maySetSt = computed(() => session.admin.svcOps.has(service.value + '/' + $OP.value))

const resetPing = () => {
  org.value = ''
  $OP.value = ''
  service.value = services[0]
  resping.value = null
  resping2.value = null
  mewComment.value = ''
}

const setSvcOp = (svcOp) => {
  const [svc, op] = svcOp.split('/')
  service.value = svc
  $OP.value = op
  org.value = ''
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


/* SetSvcOpStatus fixe le status du service: { st, at, txt }
  st: code 9: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSvcOpStatus (stx) : Promise<void> {
  const op = new SetSvcOpStatus(service.value)
  const res = await op.run($OP.value, stx, mewComment.value)
  await svcOpStatus()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
