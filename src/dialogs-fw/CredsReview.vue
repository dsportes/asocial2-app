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
    <div class="sep">
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
      <div>{{ todel.size }}</div>
    </div>
    </template>

    <template #default>
    <div>
      <div v-if="step >= 1" class="sep full-width column items-center">
        <scroll-area size="sm" class="pwmd q-mt-sm q-pa-xs" noborder>
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

      <div v-if="step >= 2" class="sep full-width column items-center q-mb-sm">
        <div class="itre-md text-italic">{{ $t('CRRstep_2', [$t('services_' + curso.svc), curso.org]) }}</div>
        <scroll-area size="sm" class="q-pa-xs pwmd" noborder>
          <div v-for="(c, idx) in fusion" :key="c.credId"
            :class="'row cursor-pointer select q-my-xs ' + dkli(idx) + curSty2(c)">
            <cred-row2 :cred="c" @undo="undodel(c)" @select="selectCr(c)"/>
          </div>
        </scroll-area>
      </div>

      <div v-if="step === 3" class="column items-center q-mt-sm q-mb-sm">
        <div class="pwmd">
          <div v-if="curcr.cond" class="q-mb-sm">
            <div class="titre-md text-bold text-italic">{{ $t('CRRcond') }}</div>
            <cond-role class="q-ml-md" :role="curcr.role" :cond="curcr.cond"/>
          </div>
          <div v-if="curcr.alert === 1" 
            class="q-mb-sm titre-md text-bold text-warning">{{ $t('CRRobs1') }}</div>
          <div v-if="curcr.alert === 2" 
            class="q-mb-sm titre-md text-bold text-warning">{{ $t('CRRobs2') }}</div>
          <div v-if="curcr.alert === 3 || curcr.alert === 4" class="row">
            <div class="col titre-md text-bold text-warning">{{ $t('CRRobs3') }}</div>
            <btn-cond class="col-auto q-ml-xs" round icon="delete" color="warning"
              @ok="todelcr"/>
            <btn-cond v-if="curcr.alert === 4" class="col-auto q-ml-xs" round 
              icon="undo" color="primary"
              @ok="undodel(curcr)"/>
          </div>
          <div v-if="curcr.alert === 0 || curcr.alert === 5" class="row">
            <div class="col titre-md text-bold text-warning">
              {{ $t('CRRdel' + (curcr.alert === 5 ? '2' : '')) }}
            </div>
            <btn-cond v-if="curcr.alert === 0" class="col-auto q-ml-xs" round icon="delete" color="negative"
              confirm @ok="cftodel"/>
            <btn-cond v-if="curcr.alert === 5" class="col-auto q-ml-xs" round 
              icon="undo" color="primary"
              @ok="undodel(curcr)"/>
          </div>
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
import { ListUserCreds, SCred } from '../src-fw/operations'
import { Credential } from '../src-fw/documents'

import BtnCond from '../components-fw/BtnCond.vue'
import CredRow2 from '../components-fw/CredRow2.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import CondRole from '../components/CondRole.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const model = defineModel()
const emit = defineEmits(['close'])

const checkClose = async () => {
  if (todel.value.size) await cleanUp()
  model.value = false
  emit('close', true)
}

const todel = ref(new Map<string, Credential>())

const step = ref(1)
watch(step, async (s) => {
  if (todel.value.size) await cleanUp()
})

/* alert
- 1: supprimer du Safe
- 2: supprimer de DB
- 4 et 5: supprimer des deux
*/
const cleanUp = async () => {
  console.log('cleanup', todel.value.size)
  
  todel.value.clear()
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
  const now = Date.now()
  // alert?: number // 0:safe et db,  1:safe pas db, 2:db pas safe 3: limit dépassée
  const op = new ListUserCreds(curso.value.svc, curso.value.org)
  const lst: SCred[] = await op.run() as SCred[]
  const m = new Map<string, Credential>()
  for (const x of lst) {
    const c = Credential.fromSCred(x, curso.value.svc, curso.value.org)
    // c.limit = 12
    if (c.limit && c.limit * 1000 < now) c.alert = 3
    m.set(x.credId, c)
  }
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
  for(const c of l)
    if (c.alert && c.alert > 0 && c.alert < 3) todel.value.set(c.credId, c)
}

const selectCr = (c) => {
  curcr.value = c
  step.value = 3
}

const todelcr = () => {
  curcr.value.alert = 4
  todel.value.set(curcr.value.credId, curcr.value)
}

const undodel = (c) => {
  c.alert = c.alert === 4 ? 3 : 0
  todel.value.delete(c.credId)
}

const cftodel = () => {
  curcr.value.alert = 5
  todel.value.set(curcr.value.credId, curcr.value)
}

reset()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.sep { border-bottom:1px solid rgba(255, 255, 255, 0.3); padding-bottom: 3px; margin-bottom: 3px;}
</style>