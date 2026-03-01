<template>
<div>
  <div v-if="sf.auth && sf.auth.admins">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div class="row q-gutter-md">
      <div v-for="[k,svcOp] of svcOps" :key="k"
        @click=setSvcOp(svcOp)
        class="font-mono text-bold cursor-pointer"
        style="text-decoration: underline;">
        {{svcOp.svc + ' ' + svcOp.op}}
      </div>
    </div>
  </div>

  <div class="row q-my-sm q-px-xs">
    <q-select class="col-5" dense filled v-model="SVC"
      :options="Array.from(services)" emit-value :label="$t('service')"/>
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
      <div :class="resping.st === 9 ? 'text-warning text-bold' : ''">
        {{$t('svcStatus_' + resping.st, [dhcool(resping.at)])}}</div>
      <div>{{resping.txt || $t('svcnocomment')}}</div>
    </div>
  </div>

  <q-separator color="orange" class="q-my-sm"/>

  <div v-if="maySetSt">
    <div class="titre-md text-italic text-bold">{{$t('svcStatus_maj')}}</div>
    <input-a prefix="svcStatus" v-model="newComment"/>
    <div class="q--mt-sm row justify-end q-gutter-sm">
      <btn-cond color="primary" :label="$t('up')" padding="none sm"
        @ok="setSvcOpStatus(1)"/>
      <btn-cond color="warning" :label="$t('down')" padding="none sm"
        @ok="setSvcOpStatus(9)"/>
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

  <div v-if="maySetSt">
    <div class="titre-md text-italic text-bold">{{$t('svcStatus_maj')}}</div>
    <input-a prefix="svcStatus" v-model="newComment"/>
    <div class="q--mt-sm row justify-end q-gutter-sm">
      <btn-cond color="primary" :label="$t('up')" padding="none sm"
        @ok="setSvcOrgStatus(1)"/>
      <btn-cond color="warning" :label="$t('readonly')" padding="none sm"
        @ok="setSvcOrgStatus(2)"/>
      <btn-cond color="warning" :label="$t('down')" padding="none sm"
        @ok="setSvcOrgStatus(9)"/>
    </div>
    <q-separator color="orange" class="q-my-sm"/>
  </div>

</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'
import { sty, dhcool } from '../src-fw/util'
import BtnCond from './BtnCond.vue'
import InputA from './InputA.vue'
import { GetSvcOpStatus, GetSvcOrgStatus, SetSvcOpStatus, SetSvcOrgStatus } from '../src-fw/operations'

const ui = stores.ui
const config = stores.config
const session = stores.session
const sf = stores.safe

const services = Array.from(Object.keys(config.K.SERVICES))

type Elt = {
  svc: string
  op: string
}
const svcOps: Ref<Map<string, Elt>> = ref(new Map())
const services2: Ref<string> = ref(new Set())

const SVC = ref('')
const $OP = ref('')
const org = ref('')

const resping = ref(null)
const resping2 = ref(null)
const newComment = ref('')

const reset = () => {
  org.value = ''
  $OP.value = ''
  SVC.value = ''
  resping.value = null
  resping2.value = null
  newComment.value = ''
  services2.value.clear()
  svcOps.value.clear()
  const x = sf.auth && sf.auth.admins ? sf.auth.admins : ''
  if (x) {
    const y = x.split('/')
    let b = true
    for (const k of y) {
      const z = k.split('.')
      svcOps.value.set(k, { svc: z[0], op: z[1]})
      services2.value.add(z[0])
      if (b) {
        SVC.value = z[0]
        $OP.value = z[1]
      }
    }
  }
}

reset()

const maySetSt = computed(() => svcOps.value.has(SVC.value + '.' + $OP.value))

const setSvcOp = (svcOp) => {
  SVC.value = svcOp.svc
  $OP.value = svcOp.op
  org.value = ''
}

const svcOpStatus = async () => {
  resping.value = null
  try {
    resping.value = await new GetSvcOpStatus(SVC.value).run($OP.value)
  } catch (e) { }
}

const svcOrgStatus = async () => {
  await svcOpStatus()
  resping2.value = null
  try {
    resping2.value = await new GetSvcOrgStatus(SVC.value).run(org.value)
  } catch (e) { }
}

/* SetSvcOpStatus fixe le status du service: { st, at, txt }
  st: code 9: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSvcOpStatus (stx) : Promise<void> {
  const op = new SetSvcOpStatus(SVC.value)
  const res = await op.run($OP.value, stx, newComment.value)
  // res.svcOpStatus contient le status mis à jour
  await svcOpStatus()
  newComment.value = ''
}

/* SetSvcOrgStatus fixe le status de l'otganisation pour le service: { st, at, txt }
  st: code 9: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSvcOrgStatus (stx) : Promise<void> {
  const op = new SetSvcOrgStatus(SVC.value)
  const res = await op.run(org.value, stx, newComment.value)
  // res.svcOrgStatus contient le status mis à jour
  await svcOrgStatus()
  newComment.value = ''
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
