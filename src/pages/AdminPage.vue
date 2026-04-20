<template>
<div class="column items-center q-pa-xs">

  <div v-if="ui.adminPage.tab === 'svcstatus'" class="pwsm">
    <div v-if="sf.auth.admins">
      <service-status v-if="ui.adminPage.SVC && ui.adminPage.$OP"
        :svc="ui.adminPage.SVC" :op="ui.adminPage.$OP"/>
      <div v-else class="titre-md text-italic">{{ $t('svcStatus_no') }}</div>
    </div>
    <div v-else>
      <service-op class="q-mb-md" v-model="ui.adminPage"/>
      <q-separator color="orange" class="q-my-sm"/>
      <service-status v-if="ui.adminPage.SVC && ui.adminPage.$OP"
        :svc="ui.adminPage.SVC" :op="ui.adminPage.$OP"/>
    </div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" class="pwsm">

    <div v-if="sf.auth.admins">
      <div v-if="!ui.adminPage.SVC" class="titre-md text-italic">{{ $t('svcStatus_no2') }}</div>
      <div class="q-my-md full-width column">
        <input-b prefix="orgcode" v-model="org" size="org"
          :disable="!ui.adminPage.SVC"
          @validate="doOrgOk"/>
      </div>
    </div>
    <div v-else class="q-my-md">
      <q-select v-if="hasManagedOrgs"
        dense class="full-width" options-dense filled clearable
        transition-show="flip-up" transition-hide="flip-down"
        v-model="svcOrg"
        :options="sorgs" :label="$t('MNOorgs')"/>
      <div v-else class="titre-md text-italic">{{ $t('svcStatus_no3') }}</div>
    </div>

    <div class="row q-mt-sm titre-sm text-italic">
      <q-icon name="delete" class="col-1" size="16px"/>
      <div class="col-3">ID</div>
      <div class="col-4">{{$t('mtime')}}</div>
      <div class="col-4">{{$t('ltime')}}</div>
    </div>
    <scroll-area v-if="hasManagedOrgs || sf.auth.admins"
      class="full-width bord1">
      <div class="q-my-xs" v-for="(m, idx) in lstMgr" :key="idx" :class="dkli(idx)">
        <div class="row">
          <btn-cond v-if="!m.limit && (sf.auth.admins || m.userId  === sf.userId)"
            class="col-1" icon="delete" color="warning"
            @ok="revoke(m)"/>
          <div v-else class="col-1"></div>
          <div v-if="m.userId === sf.userId" class="col-3 font-mono text-bold">({{$t('me')}})</div>
          <div v-else class="col-3 font-mono ellipsis">{{m.userId}}</div>
          <div class="col-4">{{dhcool(m.time)}}</div>
          <div class="col-4">{{m.limit ? dhcool(m.limit) : $t('APnolimit')}}</div>
        </div>
        <div class="row">
          <div class="col-1"></div>
          <div class="col-11 text-italic">{{m.cond.info}}</div>
        </div>
      </div>
    </scroll-area>

    <div v-if="sf.auth.admins && org.ok" class="q-my-md">
      <q-separator color="orange"/>
      <div class="titre-lg text-italic text-center q-my-sm">{{$t('APdeclmgr')}}</div>
      <security-site class="q-my-sm" v-model="areq.safeStore"/>

      <input-b class="full-width" prefix="FCtarget" size="p0" noval
        v-model="areq.targetUser"/>
      <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
      <div class="column items-center">
        <btn-cond :label="$t('APgrantmgr')" icon="check"
          :disable="diagReq !== ''" @ok="grantManager"/>
        <btn-cond class="q-mt-sm" flat :label="$t('APlstmgr')"
          :disable="!org.inp" @ok="dolist"/>
      </div>
    </div>

  </div>

  <choose-it v-model="dialogs.confirmrevoke"
    :prefix="'APrevcf' + (autorev ? 'a' : '')" options="pw"
    @giveup="dialogs.confirmrevoke = false"
    @option="doConfirmRevoke"/>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, computed, reactive, watch } from 'vue'
import stores from '../stores/all'
import { ICVS } from '../stores/safe-store'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import { NewManager, ListManagers, RevokeCred } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'
import ScrollArea from '../components-fw/ScrollArea.vue'
import SecuritySite from '../components-fw/SecuritySite.vue'
import ServiceOp from '../components-fw/ServiceOp.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const dialogs = reactive({ confirmrevoke: false })

const sorgs = ref(sf.managedOrgs())
watch(() => sf.mySafeCreds, () => {
  sorgs.value = sf.managedOrgs()
  if (sorgs.value.length) svcOrg.value = sorgs.value[0]
})

const hasManagedOrgs = computed(() => sorgs.value.length !== 0)
const svcOrg = ref()
const lstMgr = ref([])

const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: ''
})
const org = reactive({ inp: session.currentOrg || '', err: '', ok: false })

const arDone = ref(new Set()) // id des creds DEJA auto-révoqués

/* Pour l'organisation courante suppression
des Credential Org.manager de l'utilisateur ayant une limite (à auto-révoquer)
*/
watch(lstMgr, async (l) => {
  if (!l.length) return
  const me = sf.userId
  const s = new Set()
  for (const x of sorgs.value) s.add(x.org)
  const lx : string[] = []
  for (const x of l) if (x.limit && x.userId === me) {
    if (!arDone.value.has(x.id)) {
      lx.push(x.id)
      arDone.value.add(x.id)
    }
  }
  if (!lx.length) return
  await ui.diagDisplay($t('MNOinvalid'))
  await sf.autoRevokeCreds(lx)
  await dolist()
})

watch(() => org.inp, async (x) => {
  org.ok = false
  if (lstMgr.value.length) lstMgr.value = []
})

const doOrgOk = async () => {
  org.ok = true
  await dolist()
}

const dolist = async () => {
  lstMgr.value = []
  const op = sf.auth.admins ? new ListManagers(ui.adminPage.SVC, org.inp)
    : new ListManagers(svcOrg.value.svc, svcOrg.value.org)
  const [s, l] = await op.run(true) as [string, any]
  if (s) await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

watch(svcOrg, async (x) => {
  if (x) await dolist()
  else lstMgr.value = []
})

const diagReq = computed(() => {
  if (areq.targetUser.err) return $t('APdiagtarget')
  return ''
})

const resetAreq = () => {
  areq.targetUser.inp = ''
  areq.targetUser.err = ''
  areq.safeStore = ''
}

const grantManager = async () => {
  // TODO mdUserGetICVS icvo
  const targetId = areq.targetUser.inp
  const icvs = await sf.getUserICVS(areq.safeStore, targetId) as ICVS
  if (!icvs) {
    await ui.diagDisplay($t('APnouser'))
    return
  }
  const ok = await NewManager(ui.adminPage.SVC, org.inp, areq.safeStore, icvs.i, icvs.c)
  if (!ok) {
    await ui.diagDisplay($t('APkomanager'))
  } else {
    await ui.diagDisplay($t('APokmanager'))
    await dolist()
    resetAreq()
  }
}

const revokeC = ref()
const autorev = computed(() => revokeC.value && (revokeC.value.userId === sf.userId))
const revoke = async (c) => {
  revokeC.value = c
  dialogs.confirmrevoke = true
}

const doConfirmRevoke = async () => {
  dialogs.confirmrevoke = false
  let op = sf.auth.admins ? new RevokeCred(ui.adminPage.SVC, org.inp)
    : new RevokeCred(svcOrg.value.svc, svcOrg.value.org)
  const status = await op.run(revokeC.value.userId, 'Org.manager', '')
  if (status) {
    await ui.diagDisplay($t('APrevko'))
  } else {
    if (autorev.value)
      sf.autoRevokeCreds([revokeC.value.id])
    await ui.diagDisplay($t('APrevok'))
    await dolist()
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
