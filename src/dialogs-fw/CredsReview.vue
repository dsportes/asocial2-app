<!-- Dialogue de revue des crdentials par service / org:
- Events:
  - close
  - done: après mise à jour
-->
<template>
<div>
  <dialog-std2 v-model="model" :title="$t('CRRtit_label')" vue="CredsReview"
    tbclass="tbs" noclose @close="checkClose">
    <template #hdr>
      <q-toolbar v-if="step === 1" dense color="none">
        <q-toolbar-title class="titre-md text-center">{{ $t('CRRstep_1') }}</q-toolbar-title>
      </q-toolbar>
      <div v-if="step === 1" class="row justify-between q-pa-xs items-center">
        <btn-bubble :text="$t('CRRstep_1_bub')" class="col-auto"/>
        <div class="wmd col-auto row items-center full-width">
          <service-org v-model="svcorg" class="col"/>
          <btn-cond class="q-ml-md col-auto"round icon="add" size="md"
            :disable="svcorg.org.err !== ''"
            @ok="addSvcorg"/>
        </div>
      </div>
      <q-separator v-if="step === 1" class="q-my-sm" color="orange"/>

      <q-toolbar v-if="step === 2" dense color="none">
        <btn-cond class="q-ml-sm" round color="primary" icon="arrow_upward"
          @ok="backTo1"/>
        <q-toolbar-title class="titre-md text-center">
          {{ $t('CRRstep_2', [$t('services_' + curso.svc), curso.org]) }}
        </q-toolbar-title>
      </q-toolbar>
    </template>

    <template #default>
      <div v-if="step === 1" class="full-width column items-center">
        <div class="pwsm q-mt-md q-pa-xs">
          <div v-for="x in smso" :key="x.svc + '/' + x.org" class="row items-center">
            <div class="col-1">
              <btn-cond v-if="x.n === 0" icon="delete" color="warning" size="sm" round
                @ok="delSvcOrg(x)"/>
            </div>
            <div :class="'col-11 row cursor-pointer select q-my-xs ' + dkli() + curSty(x)"
              @click="selectSo(x)">
              <div class="col-1 font-mono">{{ x.n }}</div>
              <div class="col-6 ellipsis q-pr-md">{{ $t('services_' + x.svc) }}</div>
              <div class="col-5 ellipsis font-mono">{{ x.org}}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="step === 2"class="full-width column items-center">
        <div class="pwsm q-pa-xs">
        </div>
      </div>

    </template>
  </dialog-std2>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { Credential } from '../src-fw/credential'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import ServiceOrg from '../components-fw/ServiceOrg.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui

const model = defineModel()
const emit = defineEmits(['close'])

const checkClose = () => {
  model.value = false
  emit('close', true)
}

const step = ref(1)
const backTo1 = () => {
  step.value = 1
}

const svcorg = reactive({
  org: { inp: '', err: 'tooshort' },
  SVC: ''
})

/* Credential
  id: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  time: number = 0 // epoch en seconde de génération
  pems: string = '' // clé PRIVEE de signature, le texte de 400c.
  name: string = '' // libellé / label etc. lisible de docId
  skey: string = ''// clé AES spécifique de docId, cryptée par la clé K de l'utilisateur et mise en base 64.
  comment: string = '' // un texte court libre de l'utilisateur.
*/
const mcreds: Ref<Map<string, Credential>> = ref()

type svcOrgN = {
  svc: string,
  org: string,
  n: number
}

const mso: Ref<Map<string, svcOrgN>> = ref()
const smso : Ref<svcOrgN[]> = ref()
const curso: Ref<svcOrgN> = ref()

const curSty = (x: svcOrgN) =>
  !curso.value ? ' nocurrent' : (curso.value.svc === x.svc && curso.value.org === x.org ? ' current' : ' nocurrent')

const selectSo = (x: svcOrgN) => {
 curso.value = x
 step.value = 2
}

const addedSo: Ref<Set<string>> = ref(new Set())

const reset = () => {
  mcreds.value = sf.mySafeCreds as Map<string, Credential>
  const m = new Map<string, svcOrgN>()
  for (const [, c] of mcreds.value) {
    const x = c.svc + '/' + c.org
    let e = m.get(x)
    if (!e) { e = { svc: c.svc, org: c.org, n: 0 }; m.set(x, e)}
    e.n++
  }
  if (addedSo.value.size) for (const x of addedSo.value) {
    const i = x.indexOf('/')
    m.set(x, { svc: x.substring(0, i), org: x.substring(i + 1), n: 0 })
  }
  mso.value = m
  sortMso()
}

const sortMso = () => {
  const l = Array.from(mso.value.values()) as svcOrgN[]
  l.sort((a: svcOrgN, b: svcOrgN) => 
    a.svc < b.svc ? -1 : (a.svc > b.svc ? 1 : a.org < b.org ? -1 : (a.org > b.org ? 1 : 0)))
  smso.value = l
}

const addSvcorg = () => {
  const x = svcorg.SVC + '/' + svcorg.org.inp
  let e = mso.value.get(x)
  if (!e) { 
    e = { svc: svcorg.SVC, org: svcorg.org.inp, n: 0 }
    mso.value.set(x, e)
    addedSo.value.add(x)
    sortMso()
  }
}

const delSvcOrg = (so: svcOrgN) => {
  const x = so.svc + '/' + so.org
  addedSo.value.delete(x)
  mso.value.delete(x)
  sortMso()
  if (curso.value && curso.value.svc === so.svc && curso.value.org === so.org)
    curso.value = null
}

reset()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>