<template>
<div>

  <div v-if="ui.adminPage.tab === 'svcstatus'" class="q-pa-sm">
    <service-status v-if="locSVC && locOp"
      fromadmin :svc="locSVC" :op="locOp"/>
    <div v-else class="titre-md text-italic">{{ $t('svcStatus_no') }}</div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" class="column items-center q-pa-sm">

    <div v-if="sf.auth.admins">
      <div v-if="!ui.adminPage.SVC" class="titre-md text-italic">{{ $t('svcStatus_no2') }}</div>
      <div v-else class="q-my-md wmd full-width column">
        <input-b class="q-mr-sm wsm" prefix="orgcode" v-model="areq.org" size="org"
          @validate="doOrgOk"/>

        <div v-if="areq.orgOk" class="column items-center">
          <security-site class="q-my-sm" v-model="areq.safeStore.inp"/>

          <input-b class="q-my-xs full-width" prefix="FCtarget" size="p0"
            v-model="areq.targetUser"/>
          <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
          <btn-cond class="col-auto" :label="$t('APgrantmgr')" icon="check"
            :disable="diagReq !== ''" @ok="grantManager"/>

          <btn-cond class="q-my-sm" flat :label="$t('APlstmgr')" 
            :disable="!areq.org.inp" @ok="dolist"/>
        </div>
      </div>
    </div>
    <div v-else class="full-width q-my-md q-px-sm">
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
          <btn-cond class="col-1" icon="delete" color="warning" @ok="revoke(m)"/>
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

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const hasManagedOrgs = computed(() => sf.managedOrgs().length !== 0)
const sorgs = ref()
const svcOrg = ref()
const lstMgr = ref([])
const locOp = ref(ui.adminPage.$OP)
const locSVC = ref(ui.adminPage.SVC)
const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: { inp: '', err: ''},
  org: { inp: session.currentOrg || '', err: '' },
  orgOk: false
})

watch(() => [ui.adminPage.SVC, ui.adminPage.$OP], () => {
  locOp.value = ui.adminPage.$OP
  locSVC.value = ui.adminPage.SVC
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
  const [s, l] = await new ListManagers(ui.adminPage.SVC, areq.org.inp).run()
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
  const ok = await new GrantNewManager(ui.adminPage.SVC, areq.org.inp)
    .run(safeStore, targetId, pubc, areq.targetUser.inp)
  if (!ok) await ui.diagDisplay($t('APkomanager'))
  else {
    await ui.diagDisplay($t('APokmanager'))
    await dolist()
    resetAreq()
  }
}

const revoke = async (userId) => {

}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
