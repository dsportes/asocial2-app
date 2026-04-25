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
      <bar-title v-if="step === 1" prefix="CRRstep_1" :class="'full-width ' + sty()"/>
      <div v-if="step === 1" class="wmd row items-center full-width">
        <service-org v-model="svcorg" class="col"/>
        <btn-cond class="q-ml-md col-auto"round icon="add" size="md"
          :disable="svcorg.org.err !== ''"
          @ok="addSvcorg"/>
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
          <div v-for="(x, idx) in smso" :key="x.svc + '/' + x.org" class="row items-center">
            <div class="col-1">
              <btn-cond v-if="x.n === 0" icon="delete" color="warning" size="sm" round
                @ok="delSvcOrg(x)"/>
            </div>
            <div :class="'col-11 row cursor-pointer select q-my-xs ' + dkli(idx) + curSty(x)"
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
          <div v-for="(c, idx) in fusion" :key="c.id"
            :class="'row cursor-pointer select q-my-xs ' + dkli(idx) + curSty2(c)"
            @click="selectCr(c)">
            <cred-row2 :cred="c"/>
          </div>
        </div>
      </div>

    </template>
  </dialog-std2>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { ListUserCreds } from '../src-fw/operations'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import ServiceOrg from '../components-fw/ServiceOrg.vue'
import CredRow2 from '../components-fw/CredRow2.vue'

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
const curcr: Ref<Credential> = ref()

const curSty = (x: svcOrgN) =>
  !curso.value ? ' nocurrent' : (curso.value.svc === x.svc && curso.value.org === x.org ? ' current' : ' nocurrent')
const curSty2 = (x: Credential) =>
  !curcr.value ? ' nocurrent' : (curcr.value.id === x.id ? ' current' : ' nocurrent')

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

const selectSo = async (x: svcOrgN) => {
 curso.value = x
 step.value = 2
 await reset2()
}

const fusion: Ref<Credential[]> = ref()

const reset2 = async () => {
  const lp = [ 'id', 'role', 'docId', 'time', 'comment' ]

  const op = new ListUserCreds(curso.value.svc, curso.value.org)
  const m :Map<string, Credential> = await op.run() as Map<string, Credential>
  for(const [id, rc] of mcreds.value) {
    if (rc.svc !== curso.value.svc || rc.org !== curso.value.org) continue
    let c = m.get(id)
    if (!c) {
      c = new Credential()
      c.from = 1
      m.set(id, c)
    } else c.from = 3
    for(const p of lp) c[p] = rc[p]
  }
  const l = Array.from(m.values())
  l.sort((a: Credential, b: Credential) => 
    a.role < b.role ? -1 : (a.role > b.role ? 1 : a.docId < b.docId ? -1 : (a.docId > b.docId ? 1 : 0)))
  fusion.value = l
}

const selectCr = (c) => {
  curcr.value = c
}

reset()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>