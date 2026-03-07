<template>
<div class="column">
  <div class="row q-gutter-sm">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div v-for="[k,svcOp] of svcOps" :key="k"
      @click=setSvcOp(svcOp)
      class="font-mono text-bold cursor-pointer"
      style="text-decoration: underline;">
      {{svcOp.svc + ' ' + svcOp.op}}
    </div>
  </div>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('svcStatus')">
    <service-status/>
  </q-expansion-item>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('APnewManager')">
    <div class="column items-center">
      <div class="q-my-md wmd full-width column items-center">
        <input-a class="col q-mr-sm" prefix="orgcode"
            v-model="areq.org.inp" size="org"/>
        <q-separator color="orange" class="q-my-sm"/>

        <input-a class="q-my-xs full-width" prefix="HPstore"
          :objerr="areq.safeStore" v-model="areq.safeStore.inp"/>
        <input-a class="q-my-xs full-width" prefix="FCtarget" size="p0"
          :objerr="areq.targetUser" v-model="areq.targetUser.inp"/>
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
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import { GrantNewManager, ListManagers } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'
import ScrollArea from '../components-fw/ScrollArea.vue'
import { Crypt, toPem, fromPem } from '../src-fw/crypt'
/*
import { saveAs } from 'file-saver'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import InputPs from '../components-fw/InputPs.vue'

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
const config = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const services = Array.from(Object.keys(config.K.SERVICES))

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

const diagReq = computed(() => {
  if (areq.targetUser.err) return $t('APdiagtarget')
  return ''
})

const areq = reactive({
  targetUser: { inp: '', err: ''},
  safeStore: { inp: '', err: ''},
  org: { inp: session.currentOrg || '' }
})

const resetAreq = () => {
  areq.targetUser = { inp: '', err: ''}
  areq.safeStore =  { inp: '', err: ''}
  areq.org = { inp: '' }
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
