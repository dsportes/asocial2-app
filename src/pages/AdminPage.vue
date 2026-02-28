<template>
<div class="column">
  <div class="row q-gutter-sm">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div v-if="session.admin" v-for="svcOp in session.admin.svcOps" :key="svcOp"
      class="font-mono text-bold">{{svcOp.replace('/', ' / ')}}</div>
  </div>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('svcStatus')">
    <service-status/>
  </q-expansion-item>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('APnewOrg')">
    <div class="q-py-sm q-px-md">
      <input-a class="q-my-xs" prefix="orgcode" size="org" v-model="neworg.neworg"/>
      <input-a class="q-my-xs" prefix="APdbcode" size="stdb" v-model="neworg.db"/>
      <input-a class="q-my-xs" prefix="APstcode" size="stdb" v-model="neworg.st"/>
      <div class="q-my-md row items-center justify-end q-gutter-sm">
        <btn-cond icon="undo" :label="$t('giveup')" flat
          @ok="resetNewOrg"/>
        <btn-cond icon="check" color="warning" :label="$t('validate')"
          @ok="neworg.val = true"/>
        <btn-confirm :actif="neworg.val" :confirm="cfNewOrg"/>
      </div>
    </div>
  </q-expansion-item>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('APnewManager')">
    <div class="column items-center">
    <div class="q-my-md wmd full-width column items-center">
      <input-a class="q-my-xs full-width" prefix="HPstore"
        :objerr="areq.safeStore" v-model="areq.safeStore.inp"/>
      <input-a class="q-my-xs full-width" prefix="FCtarget" size="p0"
        :objerr="areq.targetUser" v-model="areq.targetUser.inp"/>
      <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
      <btn-cond class="q-my-xs self-end" :label="$t('ok')" icon="check"
        :disable="diagReq !== ''"
        @ok="setTargetUser"/>
    </div>
  </div>
  </q-expansion-item>

  <form-cred v-if="ui.dModels[idc].formcred" :validatefn="recordManager"
    v-model="formCred" org dtime infou infos
    :idc="idc" :title="$t('APnewManager')"/>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import { NewOrg } from '../src-fw/operations'
import { $t } from '../src-fw/util'
import { CredObj, CredRequest, Credential } from '../src-fw/credential'
import { Crypt, toPem, fromPem } from '../src-fw/crypt'
import FormCred from '../components-fw/FormCred.vue'
/*
// @ts-ignore
import { saveAs } from 'file-saver'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import InputPs from '../components-fw/InputPs.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import ChooseIt from '../components-fw/ChooseIt.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'
*/
// import anonymousW from '../assets/anonymous_white.png'
// import anonymousB from '../assets/anonymous_black.png'
// import databaseW from '../assets/database_white.png'
// import databaseB from '../assets/database_black.png'
// @ts-ignore
import superman from '../assets/superman.jpg'

const encoder = new TextEncoder()

const ui = stores.ui
const sf = stores.safe
const session = stores.session
// const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const neworg = reactive({ neworg: '', db: '', st: '', val: false })

const resetNewOrg = () => {
  neworg.neworg = ''; neworg.db = ''; neworg.st = ''; neoworg.val = false
}

const cfNewOrg = async () => {
  // run (svc: string, neworg: string, st: number, db: string)
  const cr = await new NewOrg().run(session.SVC, neworg.neworg, neworg.st, neworg.db)
  if (cr >= 0 ) {
    await ui.diagDisplay($t('APcr_' + cr, [neworg.neworg]))
    resetNewOrg()
  } else {
    await ui.diagDisplay($t('APko', [neworg.neworg]))
  }
}

const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: { inp: '', err: ''}
})
const resetAreq = () => {
  areq.targetUser = { inp: '', err: ''}
  areq.safeStore =  { inp: '', err: ''}
}
const formCred = reactive({ org: '', dtime: 0, infou: '', infos: '' })
const resetFormCred = () => {
  const f = formCred
  f.org = ''; f.dtime = 0; f.infou = ''; f.infos = ''
}
const targetId = ref()
const pemC = ref()

const diagReq = computed(() => {
  if (areq.targetUser.err) return $t('APdiagtarget')
  return ''
})

const setTargetUser = async () => {
  const p = await sf.getPublicKeys(areq.safeStore.inp, areq.targetUser.inp)
  if (!p) {
    await ui.diagDisplay($t('APnouser'))
    return
  }
  const [id, pubc, ] = p
  targetId.value = id
  pemC.value = pubc
  resetFormCred()
  ui.oD(idc, 'formcred')
}

/*
export type CredRequest = {
  userId: string
  role: string
  org: string
  entid: string
  hpems: string
  pemv: string
  ctime: number
  dtime: number
  infou: Uint8Array
  infous: Uint8Array
  infos: Uint8Array
  setterId: string
  cond: Object
}

export type CredObj = {
  svc: string // code du service
  id: string // hash court de `[role, org, entid]`.
  about: string // un texte court _à propos_ du `entid`.
  role: string // un des codes de rôle connu du service.
  org: string // le code de l'organisation.
  entid: string // identifiant d'une entité interprétable pour le service.
  entkey: string // clé AES spécifique de l'entité, cryptée par la clé K de l'utilisateur et mise en base 64.
  pems: string // clé PRIVEE de signature, le texte de 400c.
  hpems: string // hash court de `pems`.
}
*/

const recordManager = async () => {
  const sv = await Crypt.getSVKeyPair()
  const pems = toPem(sv.priv)
  const hpems = Crypt.shaS(encoder.encode(pems))
  const pemv = toPem(sv.pub, true)
  const aess = formCred.infos ? await Crypt.getAESKey(fromPem(sf.auth.C, true), fromPem(sf.auth.D)) : null
  const aesu = formCred.infou ? await Crypt.getAESKey(fromPem(pemC.value, true), fromPem(sf.auth.D)) : null
  const infos = formCred.infos ? await Crypt.crypt(aess, encoder.encode(formCred.infos)) : null
  const infou = formCred.infou ? await Crypt.crypt(aesu, encoder.encode(formCred.infou)) : null
  const infous = formCred.infou ? await Crypt.crypt(aess, encoder.encode(formCred.infou)) : null

  const x = new Date(formCred.dtime).toISOString()
  /* Les données suivantes sont en fait surchargées / fixées
  par l'opération newManager du service:
  role entid ctime setterId cond
  Ne sont fixées ici que pour information
  */
  const credRequest: CredRequest = {
    userId: targetId.value,
    org: formCred.org,
    hpems,
    pemv,
    dtime: formCred.dtime || 0,
    infou,
    infous,
    infos,

    role: 'manager',
    entid: '',
    ctime: 0,
    setterId: sf.userId,
    cond: null
  }

  const op = new GrantNewManager()
  const ok = await op.run(session.SVC, credRequest)
  if (!ok) {
    await ui.diagDisplay($t('APkomanager'))
    return
  }

  // Pour transmettre un nouveau Credential à l'utilisateur cible
  const credObj: CredObj = {
    svc: session.SVC,
    id: '',
    about: infou,
    role: 'manager',
    org: formCred.org,
    entid: '',
    entkey: '',
    pems: pems,
    hpems: hpems
  }
  const cred = new Credential(credObj)
  const status = await sf.transmitCred(areq.safeStore.inp, cred, targetId.value)
  if (status === 0) await ui.diagDisplay($t('APokmanager'))
  else await ui.diagDisplay($t('APkomanager'))
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
