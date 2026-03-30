<template>
<div class="column items-center q-pa-xs">

  <div v-if="ui.adminPage.tab === 'svcstatus'" class="pwsm">
    <div v-if="sf.auth.admins">
      <service-status v-if="svcop.SVC && svcop.$OP" :svc="svcop.SVC" :op="svcop.$OP"/>
      <div v-else class="titre-md text-italic">{{ $t('svcStatus_no') }}</div>
    </div>
    <div v-else>
      <service-op class="q-mb-md" v-model="svcop"/>
      <q-separator color="orange" class="q-my-sm"/>
      <service-status v-if="svcop.SVC && svcop.$OP" :svc="svcop.SVC" :op="svcop.$OP"/>
    </div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" class="pwsm">

    <div v-if="sf.auth.admins" class="q-my-md">
      <div v-if="!ui.adminPage.SVC" class="titre-md text-italic">{{ $t('svcStatus_no2') }}</div>
      <div v-else class="q-my-md full-width column">
        <input-b prefix="orgcode" v-model="areq.org" size="org"
          @validate="doOrgOk"/>
      </div>
    </div>
    <div v-else class="q-my-md">
      <q-select v-if="hasManagedOrgs" 
        dense class="full-width" options-dense filled clearable
        transition-show="flip-up" transition-hide="flip-down"
        v-model="svcOrg"
        :options="sorgs" :label="$t('MNOorgs')"/>
    </div>

    <scroll-area v-if="hasManagedOrgs || sf.auth.admins" 
      class="full-width bord1">
      <div class="q-my-xs" v-for="(m, idx) in lstMgr" :key="idx" :class="dkli(idx)">
        <div class="row">
          <btn-cond class="col-1" icon="delete" color="warning"
            :disable="!sf.auth.admins"
            @ok="revoke(m)"/>
          <div class="col-3 font-mono ellipsis">{{m.userId}}</div>
          <div class="col-4">{{dhcool(m.time)}}</div>
          <div class="col-4">{{m.limit ? dhcool(m.limit) : $t('APnolimit')}}</div>
        </div>
        <div class="row">
          <div class="col-1"></div>
          <div class="col-11 text-italic">{{m.cond.info}}</div>
        </div>
      </div>
    </scroll-area>

    <div v-if="sf.auth.admins && areq.orgOk" class="q-my-md">
      <q-separator color="orange"/>
      <div class="titre-lg text-italic text-center q-my-sm">{{$t('APdeclmgr')}}</div>
      <security-site class="q-my-sm" v-model="areq.safeStore.inp"/>

      <input-b class="full-width" prefix="FCtarget" size="p0"
        v-model="areq.targetUser"/>
      <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
      <div class="column items-center">
        <btn-cond :label="$t('APgrantmgr')" icon="check"
          :disable="diagReq !== ''" @ok="grantManager"/>
        <btn-cond class="q-mt-sm" flat :label="$t('APlstmgr')" 
          :disable="!areq.org.inp" @ok="dolist"/>
      </div>
    </div>

  </div>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, computed, reactive, watch } from 'vue'
import stores from '../stores/all'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import { GrantNewManager, ListManagers } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'
import ScrollArea from '../components-fw/ScrollArea.vue'
import SecuritySite from '../components-fw/SecuritySite.vue'
import ServiceOp from '../components-fw/ServiceOp.vue'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const hasManagedOrgs = computed(() => sf.managedOrgs().length !== 0)
const sorgs = ref()
const svcOrg = ref()
const lstMgr = ref([])

const svcop = reactive({
  SVC: ui.adminPage.SVC,
  $OP: ui.adminPage.$OP
})
watch(() => [ui.adminPage.SVC, ui.adminPage.$OP], () => {
  svcop.$OP = ui.adminPage.$OP
  svcop.SVC = ui.adminPage.SVC
})

const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: { inp: '', err: ''},
  org: { inp: session.currentOrg || '', err: '' },
  orgOk: false
})

watch(() => areq.org.inp, async (x) => {
  areq.orgOk = false
  lstMgr.value = []
})

const doOrgOk = async () => {
  areq.orgOk = true
  await dolist()
}

const dolist = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(svcop.SVC, areq.org.inp).run()
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

const dolist2 = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(svcOrg.value.SVC, svcOrg.value.org).run(true)
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

watch(svcOrg, async (x) => {
  if (x) await dolist2()
  else lstMgr.value = []
})

const reset = () => {
  sorgs.value = sf.managedOrgs()
  if (sorgs.value.length) svcOrg.value = sorgs.value[0]
}
reset()

const diagReq = computed(() => {
  if (areq.targetUser.err) return $t('APdiagtarget')
  return ''
})

const resetAreq = () => {
  areq.targetUser.inp = ''; areq.targetUser.err = ''
  areq.safeStore.inp = ''; areq.safeStore.err = ''
  areq.org.inp = ''; areq.org.err = ''
}

const grantManager = async () => {
  const safeStore = areq.safeStore.inp
  const p = await sf.getPublicKeys(safeStore, areq.targetUser.inp)
  if (!p) {
    await ui.diagDisplay($t('APnouser'))
    return
  }
  const [targetId, pubc, pubV] = p
  const ok = await new GrantNewManager(svcop.SVC, areq.org.inp)
    .run(safeStore, targetId, pubc, areq.targetUser.inp)
  if (!ok) await ui.diagDisplay($t('APkomanager'))
  else {
    await ui.diagDisplay($t('APokmanager'))
    await dolist()
    resetAreq()
  }
}

const revoke = async (userId) => {
  // TODO
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
