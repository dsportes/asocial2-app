<template>
<div class="column items-center q-pa-xs">

  <div v-if="adp.tab === 'sites'" class="pwsm">
    <div class="titre-md text-italic text-center">{{ $t(sites.length ? 'APsites' : 'APnosites') }}</div>
    <scroll-area size="sm" class="pwsm">
      <div v-for="([site, url], idx) of sites" :key="site" 
        :class="'row items-center cursor-pointer ' + dkli(idx) + (site === ui.adminPage.site ? ' current': ' nocurrent')"
        @click="setCurSite(site)">
        <div class="col-1">
          <btn-cond v-if="adp.mdAdmin" round color="warning" icon="delete" 
            @ok="delSite(site)"/>
        </div>
        <div class="col-3 font-mono">{{ site }}</div>
        <div class="col-8 font-mono">
          <div v-if="!adp.mdAdmin" class="font-mono">{{ url }}</div>
          <line-edit v-else size="sm" :text="url" :ctx="{site: site}"
            @change="editSite"/>
        </div>
      </div>
    </scroll-area>

    <q-expansion-item v-model="newsite" v-if="adp.mdAdmin" class="q-my-sm" dense
     icon="add" :label="$t('APnewsite')" header-class="tbs">
     <div class="column">
        <input-b class="q-my-sm" size="site" prefix="APsite" v-model="nsite"/>
        <input-b class="q-my-sm" size="url" prefix="APurl" v-model="nurl"/>
        <btn-cond icon="add" :label="$t('validate')" class="q-my-sm self-end"
          :disable="nsite.err !== '' || nurl.err !== ''" @ok="newSite"/>
     </div>
    </q-expansion-item>

    <div v-if="adp.site" class="row justify-between q-mt-md">
      <btn-cond class="col-auto q-pr-sm" :label="$t('status')" @ok="siteStatus"/>
      <div v-if="status !== null" class="col">
        <div>{{$t('svcStatus_now', [dhcool(status.now)])}}</div>
        <div :class="status.st === 9 ? 'text-warning text-bold' : ''">
          {{$t('svcStatus_' + status.st, [dhcool(status.at)])}}</div>
        <div>{{status.txt || $t('nocomment')}}</div>

      <q-expansion-item v-model="setstat" v-if="siteadmin" 
        class="q-my-sm" dense
        :label="$t('APsetstsite')" icon="security" header-class="tbs">
      <div class="column">
        <input-a prefix="svcStatus" v-model="newComment"/>
        <div class="row justify-end q-gutter-sm">
          <btn-cond color="primary" :label="$t('up')" padding="none sm"
            @ok="setSiteSt(1)"/>
          <btn-cond color="warning" :label="$t('readonly')" padding="none sm"
            @ok="setSiteSt(2)"/>
          <btn-cond color="warning" :label="$t('down')" padding="none sm"
            @ok="setSiteSt(9)"/>
        </div>
      </div>
      </q-expansion-item>
      </div>
    </div>
  </div>

  <!--
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
-->

  <!-- dialog-std0 v-if="dialogs.edit" v-model="dialogs.edit" @onClose="dialogs.edit = false"
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
  </dialog-std0-->

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, reactive, onMounted } from 'vue'
import stores from '../stores/all'
// import { ListManagers, UpdateCredential } from '../src-fw/operations'
// import { $Cred } from '../src-fw/documents'
import { $t, dkli, dhcool, zp } from '../src-fw/util'

// import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import InputA from '../components-fw/InputA.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
// import ServiceOp from '../components-fw/ServiceOp.vue'
// import SelectOrg from '../components-fw/SelectOrg.vue'
// import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { AOperation, MDOperation, isAdmin,
  getSiteStatus, setSiteStatus, ADMIN$Status } from 'src/src-fw/operation'
import { FW$getStatus, FW$setStatus } from '../src-fw/operations'
// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
// const sf = stores.safe

const adp = computed(() => ui.adminPage )
const sites: Ref<Map<string, string>> = ref(new Map())

const loadSites = async (force?: boolean) => {
  const ls = Array.from(await AOperation.getSites(force))
  ls.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  sites.value = ls
}

onMounted(async () => {
  await loadSites()
})

const status: Ref<ADMIN$Status> = ref(null)
const siteadmin = ref(false)
const setstat = ref(false)

const setCurSite = async (site: string) => {
  adp.value.site = site
  siteadmin.value = false
  if (site)
    siteadmin.value = await isAdmin(site)
  await siteStatus()
}
const newsite = ref(false)
const nsite = reactive({ inp: '', err: ''})
const nurl = reactive({ inp: '', err: ''})

const delSite = async (site: string) => {
  if (await setSite(site, ''))
    setCurSite('')
}

const editSite = async ({site, value}: { site: string, value: string }) => {
  if (await setSite(site, value))
    setCurSite(site)
}

const newSite = async () => {
  if (await setSite(nsite.inp, nurl.inp)) {
    setCurSite(nsite.inp)
    nsite.inp = ''; nsite.err = ''
    nurl.inp = ''; nurl.err = ''
    newsite.value = false
  }
}

const setSite = async (site: string, url: string) => {
  const op = new MDOperation('$SetSiteUrl')
  op.args.params = [site, url]
  try {
    await op.post()
    await loadSites(true)
    return true
  } catch (e) {
    await op.ko(e)
    return false
  }
}

const siteStatus = async () => {
  status.value = null
  if (!adp.value.site) return
  const now = Date.now()
  status.value = await getSiteStatus(adp.value.site)
  newComment.value = status.value.txt
  status.value.now = now
}

const newComment = ref('')

const setSiteSt = async (st: number) => {
  const now = Date.now()
  status.value = await setSiteStatus(adp.value.site, st, newComment.value || '')
  status.value.now = now
  newComment.value = status.value.txt
  setstat.value = false
}

/*
const dialogs = reactive({ 
  confirmrevoke: false,
  edit: false
})

const org = ref()

const lstMgr: Ref<$Cred[]> = ref([]) // Cred []

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
  if (toDel.value) c.props.limit = 1
  else c.props.limit = !curT.value ? 0 : Math.floor(curT.value / 60000)
  if (targetUser.inp !== (c.props.name || '')) c.props.name = targetUser.inp
  const op = new UpdateCredential(c.svc, c.org)
  const status = await op.run(c.credId, c.docCl, c.docPk, c.props)
  if (status) await ui.diagDisplay($t('APupdko'))
  else await ui.diagDisplay($t(toDel.value ? 'APdelok' : 'APupdok'))
  dialogs.edit = false
  await dolist()
}
  */

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.ellipsis { text-decoration: ellipsis}
</style>
