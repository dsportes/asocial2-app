<template>
<div class="column">
  <div class="row q-gutter-sm q-pa-sm">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div v-for="[k,svcOp] of svcOps" :key="k"
      @click=setSvcOp(svcOp)
      class="font-mono text-bold cursor-pointer"
      style="text-decoration: underline;">
      {{svcOp.svc + ' ' + svcOp.op}}
    </div>
  </div>
  <q-expansion-item class="q-mt-sm" switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('svcStatus')">
    <service-status class="q-pa-sm"/>
  </q-expansion-item>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('APnewManager')">
    <div class="column items-center q-pa-sm">
      <div class="q-my-md wmd full-width column items-center">
        <input-b class="col q-mr-sm" prefix="orgcode"
            v-model="areq.org" size="org"/>
        <q-separator color="orange" class="q-my-sm"/>

        <security-site class="q-my-xs full-width" v-model="areq.safeStore.inp"/>
        <!--input-b class="q-my-xs full-width" prefix="HPstore"
          v-model="areq.safeStore"/-->
        <input-b class="q-my-xs full-width" prefix="FCtarget" size="p0"
          v-model="areq.targetUser"/>
        <div v-if="diagReq !== ''" class="q-my-sm msg2">{{diagReq}}</div>
        <btn-cond class="col-auto" :label="$t('APgrantmgr')" icon="check"
          :disable="diagReq !== ''" @ok="grantManager"/>
        <q-separator color="orange" class="q-my-sm"/>

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
  </q-expansion-item>

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, reactive } from 'vue'
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

// const services = Array.from(Object.keys(stores.config.K.SERVICES))

type Elt = {
  svc: string
  op: string
}
const svcOps: Ref<Map<string, Elt>> = ref(new Map())
const services2: Ref<string> = ref(new Set())

const SVC = ref('')
const $OP = ref('')

const reset = () => {
  $OP.value = ''
  SVC.value = ''
  services2.value.clear()
  svcOps.value.clear()
  const x = sf.auth && sf.auth.admins ? sf.auth.admins : ''
  if (x) {
    const y = x.split('/')
    let b = true
    for (const k of y) {
      const z = k.split('.')
      svcOps.value.set(k, { svc: z[0], op: z[1]})
      services2.value.add(z[0])
      if (b) {
        SVC.value = z[0]
        $OP.value = z[1]
      }
    }
  }
}

reset()

const setSvcOp = (svcOp) => {
  SVC.value = svcOp.svc
  $OP.value = svcOp.op
}

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
  const ok = await new GrantNewManager('AS2')
    .run(safeStore, targetId, pubc, areq.org.inp, areq.targetUser.inp)
  if (!ok) await ui.diagDisplay($t('APkomanager'))
  else {
    await ui.diagDisplay($t('APokmanager'))
    resetAreq()
  }
}

const lstMgr = ref([])

const dolist = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(SVC.value).run(areq.org.inp)
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

const revoke = async (userId) => {

}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.ellipsis { text-decoration: ellipsis}
</style>
