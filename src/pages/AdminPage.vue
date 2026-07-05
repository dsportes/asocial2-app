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
          <select-org v-model="org" @change="dolist"/>
          <btn-cond round icon="refresh" @ok="dolist" size="lg"/>
        </div>

        <div v-if="org">
          <scroll-area v-if="lstMgr.length"
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
          <div v-else class="titre_md text-italic">{{ $t('APnomanagers') }}</div>
        </div>
      </div>
    </div>

  </div>

  <dialog-std0 v-if="dialogs.edit" v-model="dialogs.edit" @onClose="dialogs.edit = false"
    :title="$t('APlistmgr')" vh="75">
    <template #hdr>
      <div class="row justify-between q-pa-xs">
        <btn-cond icon="close" :label="$t('APdelcred')" color="warning" @ok="delcred"/>
        <btn-cond :label="$t('iconfirm')" confirm @ok="confirm" 
          :disable="!changes"/>
      </div>
      <div class="row items-center q-my-xs q-gutter-xs">
        <div class="titre-md text-italic text-bold">{{ $t('APvallimit') }}</div>
        <btn-cond v-if="chgT"
          icon="undo" :label="$t('APundolimit')" @ok="undolimit"/>
        <btn-cond v-if="!current.props.limit && !curT"
          icon="add" :label="$t('APaddlimit')" @ok="addlimit"/>
        <btn-cond v-if="current.props.limit"
          icon="delete" :label="$t('APdellimit')" @ok="dellimit"/>
      </div>
    </template>
    <template #default>
      <div v-if="!toDel">
      <input-b class="full-width" prefix="APtarget" size="about" noval
        :initval="initName"
        v-model="targetUser" :disable="toDel"/>

      <div v-if="curT" class="column items-center q-gutter-sm">
        <div v-if="diagD" class="msg">{{  diagD }}</div>
        <q-date v-model="dateed" :title="dhcool(curT)" today-btn/>
        <q-time v-model="timeed" format24h/>
      </div>
      <div v-else class="titre-lg text-italic text-center q-my-md">{{$t('APnovallimit')}}</div>
      </div>
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
import { $t, dkli, dhcool, zp } from '../src-fw/util'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import ServiceOp from '../components-fw/ServiceOp.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const ui = stores.ui
const sf = stores.safe

ui.adminPage.tab = 'svcstatus'

const dialogs = reactive({ 
  confirmrevoke: false,
  edit: false
})

const org = ref()

const lstMgr: Ref<$Cred[]> = ref([]) // Cred []
/* export type $Cred = {
  credId: string
  svc: string
  org: string
  docCl: string
  docPk: string
  props: any
}*/

const dolist = async () => {
  lstMgr.value = []
  const op = new ListManagers(ui.adminPage.SVC, org.value)
  lstMgr.value = await op.run()
}

const timeed = ref('')
const dateed = ref('')
const initName = ref('')
const current = ref({ props: {} })
const toDel = ref(false)

const setD = (d: Date) => {
  dateed.value = !d ? '' : d.getFullYear() + '/' + zp(d.getMonth() + 1) + '/' + zp(d.getDate())
  timeed.value = !d ? '' : zp(d.getHours()) + ':' + zp(d.getMinutes())
}

const curT = computed(() => 
  dateed.value && timeed.value ? new Date(dateed.value + ' ' + timeed.value).getTime() : 0)
const diagD = computed(() => 
  !curT.value || curT.value > Date.now() ? '' : $t('APlimitpast'))
const chgT = computed(() => 
  (current.value.props.limit || 0) * 60000 !== curT.value)

const edit = (m) => {
  current.value = m
  initName.value = m.props.name || ''
  targetUser.inp = m.props.name || ''
  targetUser.err = ''
  dialogs.edit = true
  toDel.value = false
  undolimit()
}

const undolimit = () => {
  setD(current.value.props.limit ? new Date(current.value.props.limit * 60000) : null)
}

const changes = computed(() =>
  toDel.value || chgT.value || targetUser.inp !== (current.value.props.name || '') )

const targetUser = reactive({ inp: '', err: ''})

const delcred = () => {
  toDel.value = true
}

const addlimit = () => {
  setD(new Date(Date.now() + 3600000))
}

const dellimit = () => {
  setD(null)
}

const undoAll = () => {
  undolimit()
  targetUser.inp = initName.value
  toDel.value = false
}

const confirm = async (b) => {
  if (b === false) {
    undoAll()
    return
  }
  const c = current.value
  const props = c.props
  if (toDel.value) props.limit = 1
  else props.limit = Math.floor(curT.value / 60000)
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
