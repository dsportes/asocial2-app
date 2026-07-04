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
      <div v-else>
        <div class="q-my-md full-width row q-gutter-sm items-center">
          <select-org @change="doOrgOk"/>
          <btn-cond round icon="refresh" @ok="doOrgOk" size="lg"/>
        </div>

        <div class="q-my-md">
          <q-select v-if="hasManagedOrgs"
            dense class="full-width" options-dense filled clearable
            transition-show="flip-up" transition-hide="flip-down"
            v-model="svcOrg"
            :options="sorgs" :label="$t('MNOorgs')"/>
          <div v-else class="titre-md text-italic">{{ $t('svcStatus_no3') }}</div>
        </div>

        <scroll-area v-if="hasManagedOrgs || sf.auth.admins"
          class="full-width bord1">
          <div class="q-my-xs" v-for="(m, idx) in lstMgr" :key="idx" :class="dkli(idx)">
            <div class="row">
              <btn-cond class="col-1" icon="edit" color="warning" @ok="edit(m)"/>
              <div class="col-11 ellipsis">{{$t('CREDON_' + m.docCl)}}</div>
            </div>
            <div class="row">
              <div class="col-1"></div>
              <div class="col-5 row">
                <div v-if="sf.mySafeCreds.has(m.credId)" class="col-auto text-bold font-mono q-mr-sm">[{{ $t('me') }}]</div>
                <div class="col ellipsis">{{m.props.name || '?'}}</div>
              </div>
              <div class="font-mono">{{m.props.limit ? dhcool(m.props.limit * 60000) : $t('APnolimit')}}</div>
            </div>
          </div>
        </scroll-area>
      </div>
    </div>

  </div>

  <dialog-std0 v-if="dialogs.edit" v-model="dialogs.edit" @onClose="dialogs.edit = false">
    <template #btn>
      <btn-cond :label="$t('confirm')" @ok="confirm" :disable="!changes || diag"/>
    </template>
    <template #default>
      <div class="colum items-center q-my-md">
        <btn-cond icon="close" :label="$t('APdelcred')" color="warning" @ok="delcred"/>
        <btn-cond v-if="!toDel && !hadLimit"
          icon="add" :label="$t('APaddlimit')" @ok="addlimit"/>
        <btn-cond v-if="!toDel && hadLimit"
          icon="delete" :label="$t('APdellimit')" @ok="dellimit"/>
        <btn-cond v-if="!toDel && hadLimit"
          icon="check" :label="$t('APchglimit')" @ok="chglimit"/>
      </div>

      <input-b class="full-width" prefix="APtarget" size="about" noval
        v-model="targetUser" :disable="toDel"/>

      <div v-if="current.props.limit || edLimit" class="row justify-around">
        <q-date v-model="dateed" minimal :disable="!edLimit || toDel"/>
        <q-time v-model="timeed" format24h :disable="!edLimit || toDel"/>
      </div>

      <div v-if="diag" class="msg q-my-xs">{{  diag }}</div>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, reactive, watch } from 'vue'
import stores from '../stores/all'
import { ListManagers, UpdateCred } from '../src-fw/operations'
import { $Cred } from '../src-fw/documents'
import { $t, dkli, dhcool } from '../src-fw/util'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import ServiceOp from '../components-fw/ServiceOp.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

ui.adminPage.tab = 'svcstatus'

const dialogs = reactive({ 
  confirmrevoke: false,
  edit: false
})

const sorgs = ref(sf.managedOrgs())
watch(() => sf.mySafeCreds, () => {
  sorgs.value = sf.managedOrgs()
  if (sorgs.value.length) svcOrg.value = sorgs.value[0]
})

const hasManagedOrgs = computed(() => sorgs.value.length !== 0)

const svcOrg = ref()
const lstMgr: Ref<$Cred[]> = ref([]) // Cred []
watch(svcOrg, async (x) => {
  if (x) await dolist()
  else lstMgr.value = []
})
/* export type $Cred = {
  credId: string
  svc: string
  org: string
  docCl: string
  docPk: string
  props: any
}*/

const doOrgOk = async () => {
  await dolist()
}

const dolist = async () => {
  lstMgr.value = []
  const op = new ListManagers(ui.adminPage.SVC, svcOrg.value.org)
  lstMgr.value = await op.run()
}

const d2s = (d: Date) : [string, string] => {
  const s0 = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
  const s1 = d.getHours() + ':' + d.getMinutes()
  return [s0, s1]
}

const diag = ref('')
const current = ref()
const hadLimit = computed(() => current.value.props.limit ? true : false)
const nextlimit: Ref<Date> = ref(null)
const timeed = ref()
const dateed = ref()
const toDel = ref(false)
const edLimit = ref(false)
const resetLimit = ref(false)

const edit = (m) => {
  current.value = m
  targetUser.inp = m.props.name || ''
  targetUser.err = ''
  dialogs.edit = true
  toDel.value = false
  edLimit.value = false
  resetLimit.value = false
}

const changes = computed(() => {
  targetUser.inp !== (current.value.props.name || '') ||
  (!nextlimit.value && hadLimit.value) ||
  (nextlimit.value && !hadLimit.value) ||
  (nextlimit.value.getTime() !== current.value.props.limit * 60000)
})

watch([dateed, timeed], () => {
  const x = dateed.value + ' ' + timeed.value
  nextlimit.value = new Date(x)
  diag.value = nextlimit.value.getTime() < Date.now() ? $t('APlimitpast') : ''
  changes()
})

const targetUser = reactive({ inp: '', err: ''})

watch(() => targetUser.inp, () => {
  changes()
})

const delcred = () => {
  toDel.value = true
}

const addlimit = () => {
  edLimit.value = true
  const dh = d2s(new Date(Date.now() + 8640000))
  dateed.value = dh[0] 
  timeed.value = dh[1]
}

const chglimit = () => {
  edLimit.value = true
  const dh = d2s(current.value.props.limit ? new Date(current.value.props.limit * 60000) : new Date())
  dateed.value = dh[0] 
  timeed.value = dh[1]
}

const dellimit = () => {
  resetLimit.value = true
}

const confirm = async () => {
  const c = current.value
  const props = c.props
  if (toDel.value) props.limit = 1
  else {
    if (nextlimit.value)
      props.limit = Math.floor(nextlimit.value.getTime() / 60000)
  }
  c.props.name = targetUser.inp
  const op = new UpdateCred(c.svc, c.org)
  const res = await op.run(c.credId, c.docCl, c.docPk, props)
  if (res.status) await ui.diagDisplay($t('APupdko'))
  else await ui.diagDisplay($t(toDel.value ? 'APdelok' : 'APupdok'))
  dialogs.edit = false
  await dolist()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
