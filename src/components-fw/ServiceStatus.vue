<!-- Boîte de gestion des status des services
-->
<template>
<div>
  <service-op v-if="!fromadmin" class="q-my-sm q-px-xs" v-model="svcop"/>

  <!--div v-if="!fromadmin" class="row q-my-sm q-px-xs">
    <q-select class="col-5" dense options-dense filled clearable
      transition-show="flip-up" transition-hide="flip-down"
      v-model="SVC"
      :options="Array.from(services)" emit-value :label="$t('service')"/>
    <div class="col-1"/>
    <input-A class="col-6" prefix="operator" v-model="$OP" size="oper"
      :list="config.K.FAVORITE_OPERATORS"/>
  </div-->

  <div class="row q-px-sm">
    <div class="col-5 column items-center q-pr-sm">
      <btn-cond :label="$t('service_status')" :disable="!svcop.$OP"
        @ok="svcOpStatus"/>
    </div>
    <div v-if="resping !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping.now)])}}</div>
      <div :class="resping.st === 9 ? 'text-warning text-bold' : ''">
        {{$t('svcStatus_' + resping.st, [dhcool(resping.at)])}}</div>
      <div>{{resping.txt || $t('nocomment')}}</div>
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
      <btn-cond :label="$t('org_status')" :disable="!svcop.$OP || !org"
        @ok="svcOrgStatus"/>
      <btn-cond :label="$t('APorgconfig')" :disable="!svcop.$OP || !org || !maySetSt" class="q-mt-sm"
        icon="open_in_new" @ok="openOrgConfig"/>
    </div>
    <div v-if="resping2 !== null" class="col-7">
      <div>{{$t('svcStatus_now', [dhcool(resping2.now)])}}</div>
      <div>{{$t('svcStatus_' + resping2.st, [dhcool(resping2.at)])}}</div>
      <div>{{resping2.txt || $t('nocomment')}}</div>
    </div>
  </div>

  <q-separator color="orange" class="q-my-sm q-mx-lg"/>

  <div v-if="maySetSt" class="column q-mx-lg">
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
  </div>

  <dialog-std0 v-model="dialogs.orgConfig" vue="ServiceStatus"
    :title="$t('APorgconfig')">
    <template #default>
      <div class="column full-width">
        <div class="row">
          <div class="col-6 titre-md text-italic text-right q-pr-lg">{{$t('APoc_svc')}}</div>
          <div class="col-6 font-mono text-bold">{{svcop.SVC}}</div>
        </div>
        <div class="row">
          <div class="col-6 titre-md text-italic text-right q-pr-lg">{{$t('APoc_op')}}</div>
          <div class="col-6 font-mono text-bold">{{svcop.$OP}}</div>
        </div>
        <div class="row">
          <div class="col-6 titre-md text-italic text-right q-pr-lg">{{$t('APoc_org')}}</div>
          <div class="col-6 font-mono text-bold">{{org}}</div>
        </div>
        <div class="row">
          <div class="col-6 titre-md text-italic text-right q-pr-lg">{{$t('APoc_db')}}</div>
          <div class="col-6 font-mono text-bold">{{oc.ac.db || $t('APnc')}}</div>
        </div>
        <div class="row">
          <div class="col-6 titre-md text-italic text-right q-pr-lg">{{$t('APoc_st')}}</div>
          <div class="col-6 font-mono text-bold">{{oc.ac.st || $t('APnc')}}</div>
        </div>

        <div class="row q-my-md q-px-xs">
          <q-select class="col-5" dense options-dense filled clearable
            transition-show="flip-up" transition-hide="flip-down" 
            v-model="oc.dbn"
            :options="oc.ac.dbs" emit-value :label="$t('APoc_dbs')"/>
          <div class="col-2"/>
          <q-select class="col-5" dense options-dense filled clearable
            transition-show="flip-up" transition-hide="flip-down" 
            v-model="oc.stn"
            :options="oc.ac.sts" emit-value :label="$t('APoc_sts')"/>
        </div>

        <div v-if="nch" class="self-center text-bold text-italic">{{$t('APoc_nch')}}</div>
        <btn-cond class="self-center q-mb-sm" icon="check" :label="$t('APoc_cfg')"
          :disable="nch" @ok="setOrgConfig"/>

        <btn-cond class="self-center q-mb-lg" icon="check" :label="$t('APoc_del')"
          @ok="delOrgConfig"/>

      </div>
    </template>
  </dialog-std0>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { dhcool } from '../src-fw/util'
import { GetSvcOpStatus, GetSvcOrgStatus, SetSvcOpStatus, SetSvcOrgStatus,
  GetOrgConfig, SetOrgConfig } from '../src-fw/operations'

import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import ServiceOp from '../components-fw/ServiceOp.vue'

import DialogStd0 from '../dialogs-fw//DialogStd0.vue'

const config = stores.config
const sf = stores.safe

const props = defineProps({ 
  short: Boolean,
  svc: String,
  op: String,
  fromadmin: Boolean
})
if (props.fromadmin) watch(() => [props.svc, props.op], () => {
  svcop.SVC = props.svc
  svcop.$OP = props.op
})

const dialogs = reactive({
  orgConfig: false
})

const services = Array.from(Object.keys(config.K.SERVICES))

type Elt = {
  svc: string
  op: string
}
const svcOps: Ref<Map<string, Elt>> = ref(new Map())
const services2: Ref<string> = ref(new Set())

const svcop = reactive({
  SVC: props.svc || '',
  $OP: props.op || ''
})

const org = ref('')

const resping = ref(null)
const resping2 = ref(null)
const newComment = ref('')

const reset = () => {
  org.value = ''
  svcop.$OP = ''
  svcop.SVC = ''
  resping.value = null
  resping2.value = null
  newComment.value = ''
  services2.value.clear()
  svcOps.value.clear()
  const x = sf.auth && sf.auth.admins ? sf.auth.admins : ''
  if (x) {
    const y = x.split('/')
    for (const k of y) {
      const z = k.split('.')
      svcOps.value.set(k, { svc: z[0], op: z[1]})
      services2.value.add(z[0])
    }
  }
}

reset()

const maySetSt = computed(() => svcOps.value.has(svcop.SVC + '.' + svcop.$OP))

const svcOpStatus = async () => {
  resping.value = null
  try {
    resping.value = await new GetSvcOpStatus(svcop.SVC, svcop.$OP).run()
  } catch (e) { }
}

const svcOrgStatus = async () => {
  await svcOpStatus()
  resping2.value = null
  try {
    resping2.value = await new GetSvcOrgStatus(svcop.SVC, org.value).run()
  } catch (e) { }
}

/* SetSvcOpStatus fixe le status du service: { st, at, txt }
  st: code 9: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSvcOpStatus (stx) : Promise<void> {
  const op = new SetSvcOpStatus(svcop.SVC, svcop.$OP)
  const res = await op.run(stx, newComment.value)
  // res.svcOpStatus contient le status mis à jour
  // await svcOpStatus()
  newComment.value = ''
}

/* SetSvcOrgStatus fixe le status de l'otganisation pour le service: { st, at, txt }
  st: code 9: DOWN, 1: UP
  txt: texte explicatif éventuel de l'administrateur
  ADMINISTRATEUR
*/
async function setSvcOrgStatus (stx) : Promise<void> {
  const op = new SetSvcOrgStatus(svcop.SVC, org.value)
  const res = await op.run(stx, newComment.value)
  // res.svcOrgStatus contient le status mis à jour
  await svcOrgStatus()
  newComment.value = ''
}

const oc = reactive({ ac : {db: '', st: '', dbs: [], sts: []}, dbn: '', stn: '' })

const nch = computed(() => oc.ac.db === oc.dbn && oc.ac.st === oc.stn)

const openOrgConfig = async () => {
  const ret = await new GetOrgConfig(svcop.SVC, org.value).run()
  if (ret) {
    oc.ac = ret
    oc.dbn = oc.ac.db || ''
    oc.stn = oc.ac.st
    dialogs.orgConfig = true
  }
}

const setOrgConfig = async () => {
  const { db, st } = await new SetOrgConfig(svcop.SVC, org.value).run(oc.dbn, oc.stn)
  oc.ac.db = db
  oc.ac.st = st
}

const delOrgConfig = async () => {
  const ret = await new SetOrgConfig(svcop.SVC, org.value).run()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
