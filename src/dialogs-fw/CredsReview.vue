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
      <div class="column items-center">
        <div class="row items-center">
          <div class="row items-center q-gutter-sm">
            <select-svc/>
            <select-org/>
          </div>
          <btn-cond class="q-ml-md col-auto"round icon="add" size="md"
            :disable="session.orgs.c === ''"
            @ok="addSvcorg"/>
        </div>
      </div>
      <q-separator v-if="step === 1" class="q-my-sm" color="orange"/>

    </template>

    <template #default>
      <div v-if="step >= 1" class="full-width column items-center">
        <scroll-area size="sm" class="pwmd q-mt-sm q-pa-xs">
          <div v-for="(x, idx) in smso" :key="x.svc + '/' + x.org" class="row items-center">
            <div :class="'full-width ' + dkli(idx) + curSty(x)">
              <div class="col-1">
                <btn-cond v-if="x.n === 0" icon="delete" color="warning" size="sm" round
                  @ok="delSvcOrg(x)"/>
              </div>
              <div class="col-11 row cursor-pointer select q-my-xs" @click="selectSo(x)">
                <div class="col-1 font-mono">{{ x.n }}</div>
                <div class="col-6 ellipsis q-pr-md text-center">{{ $t('services_' + x.svc) }}</div>
                <div class="col-5 ellipsis font-mono text-center">{{ x.org}}</div>
              </div>
            </div>
          </div>
        </scroll-area>
      </div>

      <div v-if="step === 2"class="full-width column items-center q-mt-md q-mb-sm">
        <div class="itre-md text-italic">{{ $t('CRRstep_2', [$t('services_' + curso.svc), curso.org]) }}</div>
        <scroll-area size="sm" class="q-pa-xs pwmd">
          <div v-for="(c, idx) in fusion" :key="c.credId"
            :class="'row cursor-pointer select q-my-xs ' + dkli(idx) + curSty2(c)"
            @click="selectCr(c)">
            <cred-row2 :cred="c"/>
          </div>
        </scroll-area>
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
import { ListUserCreds, SCred } from '../src-fw/operations'
import { Credential } from '../src-fw/documents'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import CredRow2 from '../components-fw/CredRow2.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

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

/* Credential (fusion)
  credId: string = '' // ID du credential.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  pubv: string = '' // clé PUBLIQUE de vérification (base64 sans bannière).
  limit: number = 0 // date-heure en seconde de fin de validité (0 si toujors valide)
  cond: any = null // Objet contenant les conditions d'application

  from?: number
  svc?: string
  org?: string
  comment?: string
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
  !curcr.value ? ' nocurrent' : (curcr.value.credId === x.credId ? ' current' : ' nocurrent')

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

const addSvcorg = async () => {
  const x = session.currentSvc + '/' + session.orgs.c
  let e = mso.value.get(x)
  if (!e) { 
    const op = new ListUserCreds(session.currentSvc, session.orgs.c)
    try {
      await op.getBaseUrl()
    } catch (e) {
      await ui.diagDisplay($t('CRRnosvc', [session.currentSvc, session.orgs.c]), true)
      return
    }
    e = { svc: session.currentSvc, org: session.orgs.c, n: 0 }
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
  step.value = 1
}

const selectSo = async (x: svcOrgN) => {
  curso.value = x
  step.value = 2
  await reset2()
}

const fusion: Ref<Credential[]> = ref()

const reset2 = async () => {
  // alert?: number // 0:safe et db,  1:safe pas db, 2:db pas safe 3: limit dépassée
  const op = new ListUserCreds(curso.value.svc, curso.value.org)
  const lst: SCred[] = await op.run() as SCred[]
  const m = new Map<string, Credential>()
  for (const x of lst) m.set(x.credId, Credential.fromSCred(x, curso.value.svc, curso.value.org))
  for(const [credId, rc] of mcreds.value) {
    if (rc.svc !== curso.value.svc || rc.org !== curso.value.org) continue
    let c = m.get(credId)
    if (!c) {
      rc.alert = 1
      m.set(rc.credId, rc)
    } else {
      if (c.alert === 2) c.alert = 0
    }
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