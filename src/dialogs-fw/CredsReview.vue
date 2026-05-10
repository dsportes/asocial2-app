<!-- Dialogue de revue des crdentials par service / org:
- Events:
  - close
  - done: après mise à jour
-->
<template>
<div>
  <dialog-std2 v-model="model" :title="$t('CRRtit_label')" vue="CredsReview"
    hdrclass="tbs" noclose @close="checkClose">
    <template #btn>
      <btn-cond :label="$t('validate')" icon="check" :disable="!todel.size"
        @ok="cleanUp">
        <q-badge color="red" floating>{{ todel.size }}</q-badge>
      </btn-cond>
    </template>
    <template #hdr>
    <div :class="sty()">
      <div class="column items-center">
        <scroll-area v-if="svcOrgs.length" size="sm" class="pwsm q-mt-sm q-pa-xs">
          <div v-for="(x, idx) in svcOrgs" :key="x.svc + '/' + x.org" class="row items-center">
            <div :class="'full-width ' + dkli(idx) + curSty(x)">
              <div class="col-11 row cursor-pointer select q-my-xs" @click="selectSo(x)">
                <div class="col-2 font-mono">{{ x.creds.length }}</div>
                <div class="col-5 ellipsis q-pr-md text-center">{{ $t('services_' + x.svc) }}</div>
                <div class="col-5 ellipsis font-mono text-center">{{ x.org}}</div>
              </div>
            </div>
          </div>
        </scroll-area>
        <div v-else class="titre-lg text-italic">{{ $t('CRRnocred') }}</div>
      </div>
    </div>
    </template>

    <template #default>
    <q-separator color="orange" class="q-my-sm"/>
    <div>
      <div v-if="step >= 2" class="sep full-width column items-center q-my-sm">
        <div class="itre-md text-italic">{{ $t('CRRstep_2', [$t('services_' + curso.svc), curso.org]) }}</div>
        <scroll-area size="sm" class="q-pa-xs pwmd" noborder>
          <div v-for="(c, idx) in curso.creds" :key="c.credId"
            :class="'row cursor-pointer select q-my-xs ' + dkli(idx) + curSty2(c)">
            <cred-row2 :cred="c" @undo="undodel(c)" @select="selectCr(c)"/>
          </div>
        </scroll-area>
      </div>

      <div v-if="step === 3" class="column items-center q-mt-sm q-mb-sm">
        <div class="pwmd">

          <line-edit class="q-my-sm" prefix="CRRabout" :text="curcr.comment"
            @change="chgComment"/>

          <div v-if="curcr.cond" class="q-mb-sm">
            <div class="titre-md text-bold text-italic">{{ $t('CRRcond') }}</div>
            <cond-role class="q-ml-md" :cred="curcr"/>
          </div>

          <div v-if="curcr.alert === 1" 
            class="q-mb-sm titre-md text-bold text-warning">{{ $t('CRRobs1') }}</div>
          <div v-if="curcr.alert === 2" class="row">
            <div class="q-mb-sm titre-md text-bold text-warning">{{ $t('CRRobs2') }}</div>
            <btn-cond class="col-auto q-ml-xs" round icon="delete" color="warning"
              @ok="todelcr"/>
          </div>

          <div v-if="curcr.alert === 3" class="row">
            <div class="col titre-md text-bold">{{ $t('CRRobs3') }}</div>
            <btn-cond v-if="curcr.alert === 3" class="col-auto q-ml-xs" round 
              icon="undo" color="primary"
              @ok="undodel"/>
          </div>

          <div v-if="curcr.alert === 0" class="row">
            <div class="col titre-md text-bold text-warning">{{ $t('CRRdel') }}</div>
            <btn-cond class="col-auto q-ml-xs" round icon="delete" color="negative"
              confirm @ok="cftodel"/>
          </div>

          <div v-if="curcr.alert === 4" class="row">
            <div class="col titre-md text-bold">{{ $t('CRRdel2') }}</div>
            <btn-cond class="col-auto q-ml-xs" round 
              icon="undo" color="primary"
              @ok="undodel"/>
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
import { ref, Ref } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { GetCredLimitCond, AutoRevokeCred } from '../src-fw/operations'
import { Credential } from '../src-fw/documents'

import BtnCond from '../components-fw/BtnCond.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import CredRow2 from '../components-fw/CredRow2.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import CondRole from '../components/CondRole.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe

const model = defineModel()
const emit = defineEmits(['close'])

const checkClose = async () => {
  if (todel.value.size) await cleanUp()
  model.value = false
  emit('close', true)
}

const todel = ref(new Map<string, Credential>())

const step = ref(1)

/* alert
- 1: à supprimer du Safe - pas de cond
- 2: limit dépassée
- 3: à supprimer pour cause de limite
- 4: à supprimer décision user
*/
const cleanUp = async () => {
  console.log('cleanup', todel.value.size)
  const lst: string[] = []
  for(const [credId, c] of todel.value) {
    if (c.alert === 1 || c.alert === 3 || c.alert === 4)
      lst.push(credId)
    if (c.alert === 3 || c.alert === 4) {
      const op = new AutoRevokeCred(c.svc, c.org)
      if (!await op.run(c.credId, c.role, c.docId)) {
        todel.value.clear()
        return
      }
    }
  }
  if (lst.length)
    await sf.autoRevokeCreds(lst)
  todel.value.clear()
  reset(true)
}

/* Credential (fusion avec cond / limit)
  credId: string = '' // ID du credential.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  pubv: string = '' // clé PUBLIQUE de vérification (base64 sans bannière).
  comment: string

  limit?: number = 0 // date-heure en seconde de fin de validité (0 si toujors valide)
  cond?: any = null // Objet contenant les conditions d'application

  svc?: string
  org?: string
*/
type svcOrg = {
  k: string,
  svc: string,
  org: string,
  creds: Credential[]
}

const svcOrgs: Ref<svcOrg[]> = ref([])
const curso: Ref<svcOrg> = ref()
const curcr: Ref<Credential> = ref()

const reset = (keepCur: boolean) => {
  const before = curso.value ? curso.value.k : ''
  svcOrgs.value.length = 0
  const m = sf.mySafeCreds as Map<string, Credential>
  const mx: Map<string, svcOrg> = new Map()
  const so: string[] = []
  for(const [credId, c] of m) {
    const k = c.svc + '/' + c.org
    let e: svcOrg | undefined = mx.get(k)
    if (!e) {
      so.push(k)
      e = { svc: c.svc, org: c.org, k, creds: [] } as svcOrg
      mx.set(k, e)
    }
    e.creds.push(c)
  }
  so.sort()
  for(const k of so) svcOrgs.value.push(mx.get(k))
  if (keepCur) {
    let svo = null
    for(const x of svcOrgs.value) if (x.k === before) svo = x
    if (svo)
      setTimeout(async () => { await selectSo(svo) }, 50)
    else {
      curso.value = null
      curcr.value = null
      step.value = 1
    }
  } else {
    curso.value = null
    curcr.value = null
    step.value = 1
  }
}

const curSty = (x: svcOrg) =>
  !curso.value ? ' nocurrent' : (curso.value.svc === x.svc && curso.value.org === x.org ? ' current' : ' nocurrent')
const curSty2 = (x: Credential) =>
  !curcr.value ? ' nocurrent' : (curcr.value.credId === x.credId ? ' current' : ' nocurrent')

const selectSo = async (x: svcOrg) => {
  curso.value = x
  step.value = 2
  await reset2()
}

const reset2 = async () => {
  if (todel.value.size) await cleanUp()
  const now = Date.now()
  const so = curso.value
  for(const c of so.creds) {
    const op = new GetCredLimitCond(c.svc, c.org)
    const x = await op.run(c)
    if (x) {
      c.limit = x[0]
      c.cond = x[1]
    }
    c.alert = !c.cond ? 1 : (c.limit && c.limit * 1000 < now ? 2 : 0)
    if (c.alert === 1) todel.value.set(c.credId, c)
  }
  so.creds.sort((a: Credential, b: Credential) => 
    a.role < b.role ? -1 : (a.role > b.role ? 1 : a.docId < b.docId ? -1 : (a.docId > b.docId ? 1 : 0)))
  if (so.creds.length) selectCr(so.creds[0])
}

const selectCr = (c) => {
  curcr.value = c
  step.value = 3
}

const todelcr = () => {
  curcr.value.alert = 3
  todel.value.set(curcr.value.credId, curcr.value)
}

const undodel = () => {
  const c = curcr.value
  c.alert = c.alert === 3 ? 2 : 0
  todel.value.delete(c.credId)
}

const cftodel = () => {
  curcr.value.alert = 4
  todel.value.set(curcr.value.credId, curcr.value)
}

const chgComment = async (text) => {
  const c = curcr.value
  console.log('New comment', text)
  if (sf.updateCredComment(c.credId, text)) {
    c.comment = text
  }
}

reset(false)
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.sep { border-bottom:1px solid rgba(255, 255, 255, 0.3); padding-bottom: 3px; margin-bottom: 5px;}
</style>