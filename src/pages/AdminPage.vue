<template>
<div>

  <div v-if="ui.adminPage.tab === 'svcstatus'" class="q-pa-sm">
    <service-status v-if="ui.adminPage.SVC"
      fromadmin :svc="ui.adminPage.SVC" :op="ui.adminPage.$OP"/>
    <div v-else class="titre-md text-italic">{{ $t('svcStatus_no') }}</div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" class="column items-center q-pa-sm">
    <div v-if="!ui.adminPage.SVC" class="titre-md text-italic">{{ $t('svcStatus_no2') }}</div>
    <div v-else class="q-my-md wmd full-width column">
      <input-b class="q-mr-sm wsm" prefix="orgcode" v-model="areq.org" size="org"/>

      <security-site class="q-my-sm" v-model="areq.safeStore.inp"/>

      <input-b class="q-my-xs full-width" prefix="FCtarget" size="p0"
        v-model="areq.targetUser"/>
      <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
      <btn-cond class="col-auto" :label="$t('APgrantmgr')" icon="check"
        :disable="diagReq !== ''" @ok="grantManager"/>

      <btn-cond class="q-my-sm" flat :label="$t('APlstmgr')" 
        :disable="!areq.org.inp" @ok="dolist"/>

      <scroll-area class="full-width bord1">
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
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, computed, reactive } from 'vue'
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

const diagReq = computed(() => {
  if (areq.targetUser.err) return $t('APdiagtarget')
  return ''
})

const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: { inp: '', err: ''},
  org: { inp: session.currentOrg || '', err: '' }
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
    resetAreq()
  }
}

const lstMgr = ref([])

const dolist = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(ui.adminPage.SVC, areq.org.inp).run()
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

const revoke = async (userId) => {

}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
