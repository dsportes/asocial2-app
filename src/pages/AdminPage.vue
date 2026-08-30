<template>
<div class="column items-center q-pa-xs">

  <div v-if="adp.tab === 'sites'" class="pwsm">
    <text-zoom class="q-my-md q-mr-md" :label="$t('APsvclabels')"
      :text="edLabels" :rows="15" :checklabel="$t('record')" :zctrl="zctrl"
      :rw="adp.mdAdmin" @done="saveLabels"/>

    <div class="titre-md text-italic q-mb-sm">{{ $t(sites.length ? 'APsites' : 'APnosites') }}</div>
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

    <div v-if="curSite.site">
      <div v-if="!adp.pingop && !adp.pingst" class="msg q-my-xs">
        {{ $t('site_err') }}
      </div>
      <div v-else class="titre-md text-italic q-my-xs">
        {{ $t('site_ok', [adp.pingop || adp.pingst]) }}
      </div>
      <div v-if="adp.pingop">
        <select-svc :ctx="{ incl: curSite.services }" @select="selSvcx1"/>
        <status-site v-if="curSite.svc" v-model="curSite" class="q-mt-md"/>
      </div>
    </div>

    <div class="q-my-md tb1">
      <div class="column full-width tbs">
        <div class="row items-center q-ma-xs">
          <q-icon name="security" color="negative" size="24px" class="q-mr-sm"/>
          <!--img :src="superman" class="q-mr-xs" width="24px"/-->
          <div class="fs-lg text-bold">{{ $t('APdeclorg') }}</div>
        </div>
        <div :class="sty() + ' row items-center no-wrap'">
          <div class="q-mr-md col-auto">{{ $t('APchorg') }}</div>
          <select-org class="col" @select="selOrg" initval="?"/>
          <btn-cond class="q-ml-sm col-auto" icon="refresh" 
            :disable="!org" round @ok="selOrg(org)"/>
          <btn-cond class="q-ml-sm col-auto" icon="check" 
            round @ok="doreset"/>
        </div>
      </div>

      <div v-if="org">
        <div  v-if="adp.mdAdmin" class="q-mb-lg">
          <div class="text-italic q-ml-sm">
            {{ $t(orgSvcs && orgSvcs.size ? 'APnewsvcorg' : 'APneworg', [org]) }}
          </div>
          <div class="row items-center full-width">
            <select-svc class="col q-px-sm" @select="selSvc" initval="?"
              :ctx="ctxSvc" :reset="reset"/>
            <select-site class="col q-px-sm" @select="selSiteNv" initval="?"
              :reset="reset"/>
            <btn-cond class="col-auto q-mx-sm self-end"
              icon="add" round
              :disable="!org || !svc || !siteNv" @ok="declare"/>
          </div>
        </div>

        <div v-if="orgSvcs && orgSvcs.size">
          <div v-for="([svc, sx], idx) in orgSvcs" :key="svc">
            <div :class="'row q-my-sm q-mx-xs items-center nowrap ' + dkli(idx)">
              <div class="col font-mono q-mx-sm">{{ labelSvc(svc) }}</div>
              <select-site class="col q-mx-sm" @select="updSite" :initval="sx"
                :ctx="{ svc: svc, sitebf: sx }" :disable="!adp.mdAdmin"/>
              <btn-cond v-if="adp.mdAdmin" class="col-auto q-mx-sm" round color="warning" icon="delete"
                @ok="delSvc(svc)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <choose-it v-model="dialogs.cf"
    :prefix="'APcfupd' + cascf" :args="argscf" options="pw"
    @giveup="confirm(0)"
    @option="confirm"/>

  <choose-it v-model="dialogs.ds"
    prefix="APcfdelsite" options="pw"
    @giveup="confirmDS(0)"
    @option="confirmDS"/>

  <div v-if="adp.tab === 'orgs'" class="pwmd">
    <div class="full-width q-mx-xs"><select-svcorg initorg="?" initsvc="?" @select="setOS"/></div>

    <status-site v-if="so.site" v-model="so" class="q-mt-md"/>

    <div v-if="so.site" class="q-my-sm titre-md">
      <div v-if="so.admin" class="row q-gutter-sm items-center">
        <img :src="superman" width="24px"/>
        <div class="titre-md text-bold">{{ $t('APsiteadmin') }}</div>
      </div>
      <div class="titre-md">{{ $t('APsinfo', [so.site, surl]) }}</div>
    </div>

    <div v-if="so.site && so.org" class="q-my-md">
      <div class="q-mb-sm titre-md">{{ $t('orgStatus', [so.org, so.svcLabel, so.site]) }}</div>
      <status-org v-model="so"/>
    </div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers'" class="pwsm">
    <select-svcorg initorg="?" initsvc="?" @select="setOS2"/>

    <div v-if="so.ready && !so.admin">
      <div class="msg q-my-sm">{{ $t('APnoadm') }}</div>
    </div>
    <div v-if="so.admin">
      <div class="row nowrap justify-between q-gutter-sm q-my-sm items-center">
        <div class="titre-md text-italic">{{ $t('APlstmanagers') }}</div>
        <btn-cond class="col-auto q-mx-sm self-end"
          icon="refresh" round @ok="setOS2"/>
      </div>

      <scroll-area v-if="lstMgr.length"
        class="full-width bord1">
        <div class="q-my-xs" v-for="(m, idx) in lstMgr" :key="m.credId" :class="dkli(idx)">
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

  <dialog-std0 v-if="dialogs.edit" v-model="dialogs.edit" @close="dialogs.edit = false"
    :title="$t('APlistmgr')" vh="75">
    <template #hdr>
      <div class="row justify-between q-pa-xs">
        <btn-cond icon="close" :label="$t('APdelcred')" color="warning" @ok="delcred"/>
        <btn-cond :label="$t('iconfirm')" confirm @ok="confirm2" 
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
import { ref, Ref, computed, reactive, onMounted, watch  } from 'vue'
import stores from '../stores/all'
import { $t, dkli, dhcool, sty, zp } from '../src-fw/util'
import { SOA } from '../src-fw/registry'
import StatusSite from '../components-fw/StatusSite.vue'
import StatusOrg from '../components-fw/StatusOrg.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import SelectSite from '../components-fw/SelectSite.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import { $Cred } from '../src-fw/documents'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { AOperation, MDOperation, isAdmin, services, pingStore } from '../src-fw/operation'
import { ListManagers, UpdateCredential } from '../src-fw/operations'
// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
const sf = stores.safe

const dialogs = reactive({
  confirmrevoke: false,
  edit: false,
  cf: false,
  ds: false
})

const adp = computed(() => ui.adminPage )
const sites: Ref<Map<string, string>> = ref(new Map())
const svcLabels : Ref<Map<string, string>> = ref(new Map())
const edLabels = ref()
const edLabelsAv = ref()
const zctrl = ref(0)

const loadSites = async (force?: boolean) => {
  const ls = Array.from(await AOperation.getSites(force))
  ls.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  sites.value = ls
}

const labelSvc = (svc: string) => {
  const l = svcLabels.value.get(svc) || ''
  return !l ? svc : (l + ' [' + svc + ']')
}

const loadLabels = async (force?: boolean) => {
  svcLabels.value = await AOperation.getServicesLabels(force)
  const x = []
  for(const [svc, label] of svcLabels.value) x.push([svc, label])
  x.sort((a,b) => a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0))
  const t = []
  for(const y of x) t.push('  "' + y[0] + '": "' + y[1] + '"')
  edLabels.value = '{\n' + t.join(',\n') + '\n}'
  edLabelsAv.value = edLabels.value
}

onMounted(async () => {
  await loadLabels()
  await loadSites()
})

const saveLabels = async (json: string) => {
  try {
    const x = JSON.parse(json)
    await AOperation.setServicesLabels(JSON.stringify(x, null, '\t'))
    await loadLabels(true)
    zctrl.value = Date.now()
  } catch (e) {
    ui.diagDisplay($t('APjsonerr', [e.message]))
  }
}

const curSite = reactive({
  org: '',
  site: '',
  services: new Set(),
  svc: '',
  admin: false
})
const newsite = ref(false)
const nsite = reactive({ inp: '', err: ''})
const nurl = reactive({ inp: '', err: ''})
const sitedel = ref('')
const orgSvcs: Ref<Map<string, string>> = ref(new Map())
const svc = ref()
const org = ref()
const site = ref()
const siteNv = ref()
const cascf = ref('')
const argscf = ref()
const excl = ref()
const ctxSvc = ref()

const reset = ref(1)
const doreset = () => { setTimeout(() => { reset.value++ }, 5) }

const init1 = () => {
  curSite.site = ''
  curSite.svc = ''
  curSite.svcLabel = ''
  curSite.admin = false
  curSite.services = new Set(),
  adp.value.site = ''
  newsite.value = false
  nsite.inp = ''; nsite.err = ''
  nurl.inp = ''; nurl.err = ''
  sitedel.value = ''
  orgSvcs.value = new Map()
  svc.value = ''
  site.value = ''
  siteNv.value = ''
  cascf.value = ''
  argscf.value = null
  excl.value = null
  ctxSvc.value = newCtx()
}

const setCurSite = async (site: string) => {
  if (adp.value.site === site) {
    curSite.site = ''
    adp.value.site = ''
  } else {
    curSite.site = site
    curSite.admin = false
    curSite.svc = ''
    curSite.services = new Set()
    curSite.svcLabel = ''
    adp.value.site = site
    if (site) {
      adp.value.pingop = ''
      adp.value.pingst = ''
      if (site.endsWith('st')) {
        const r = await pingStore(site)
        if (r) {
          // console.log('PINGSTORE: ' + r)
          adp.value.pingst = r
        }
      } else {
        const r = await services(site)
        if (r) {
          adp.value.pingop = new Date(r.at).toISOString()
          curSite.services = new Set(r.services)
          // console.log(new Date().toISOString(), 'Services: ' + r.services.join(' / '))
          curSite.admin = await isAdmin(site)
        }
      }
    }
  }
}

const selSvcx1 = (x) => {
  curSite.svc = x.svc
  curSite.svcLabel = x.label
}

const delSite = async (site: string) => {
  sitedel.value = site
  dialogs.ds = true
}

const confirmDS = async (c: number) => {
  if (!c) return
  if (await setSite(sitedel.value, ''))
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

const selSvc = (optSvc: { svc: string, label: string }) => {
  svc.value = optSvc.svc
}

const selOrg = async (_org: string) => {
  if (_org) {
    org.value = _org
    svc.value = ''
    site.value = ''
    siteNv.value = ''
    orgSvcs.value = await AOperation.getOrgSvc(_org)
    ctxSvc.value = newCtx(true)
  } else org.value = ''
}

const updSite = (_site, ctx) => {
  site.value = _site
  svc.value = ctx.svc
  argscf.value = [org.value, ctx.svc, ctx.sitebf, ctx.site]
  cascf.value = 'b'
  dialogs.cf = true
}

const delSvc = (_svc: string) => {
  svc.value = _svc
  argscf.value = [org.value, svc.value]
  cascf.value = orgSvcs.value.size > 1 ? 'a' : 'c'
  dialogs.cf = true
}

const newCtx = (opt?: boolean) => {
  const c = new Object()
  if (opt) c['excl'] = new Set(Array.from(orgSvcs.value.keys()))
  return c
}

const selSiteNv = (site, ctx) => {
  siteNv.value = site
}

const declare = async () => {
  orgSvcs.value = await AOperation.setOrgSvc(org.value, svc.value, siteNv.value)
  svc.value = ''
  site.value = ''
  siteNv.value = ''
  doreset()
  ctxSvc.value = newCtx(true)
}

const confirm = async (c) => {
  dialogs.cf = false
  if (!c) org.value = ''
  else {
    if (cascf.value !== 'c') {
      orgSvcs.value = await AOperation.setOrgSvc(org.value, svc.value, site.value)
    } else {
      orgSvcs.value = await AOperation.setOrgSvc(org.value, svc.value, '')
      org.value = ''
    }
    ctxSvc.value = newCtx(true)
  }
  svc.value = ''
  site.value = ''
  siteNv.value = ''
}

const so = reactive({
  org: '',
  site: '',
  svc: '',
  ready: false,
  admin: false
})

const surl = computed(() => AOperation.urls.get(so.site) || '?')

const setOS = async (soa: SOA) => {
  so.org = soa.org
  so.svc = soa.svc
  so.svcLabel = soa.svcLabel
  so.site = soa.site
  so.admin = soa.admin
  so.ready = true
}

const lstMgr: Ref<$Cred[]> = ref([]) // Cred []

const init2 = () => {
  so.org = ''; so.site = ''; so.svc = ''; so.ready = false
  lstMgr.value = []
}

watch(() => adp.tab, (t) => {
  if (t === 'sites') init1()
  if (t === 'orgs') init2()
  if (t === 'managers') init2()
})

adp.value.tab = 'sites'
init2()

const setOS2 = async (soa: SOA) => {
  await setOS(soa)
  await dolist()
}

const dolist = async () => {
  lstMgr.value = []
  const op = new ListManagers(so.svc, so.org)
  lstMgr.value = await op.run()
  // console.log(lstMgr.value.length)
}

const timeed = ref('')
const dateed = ref('')
const initName = ref('')
const current = ref({ props: {} })
const toDel = ref(false)

const targetUser = reactive({ inp: '', err: '' })

const edit = (m) => {
  current.value = m
  initName.value = m.props.name || ''
  targetUser.inp = m.props.name || ''
  targetUser.err = ''
  dialogs.edit = true
  toDel.value = false
  undolimit()
}

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

const undolimit = () => {
  setD(current.value.props.limit ? new Date(current.value.props.limit * 60000) : null)
}

const changes = computed(() =>
  toDel.value || chgT.value || targetUser.inp !== (current.value.props.name || '') )


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

const confirm2 = async (b) => {
  if (b === false) {
    undoAll()
    return
  }
  const c = current.value
  if (toDel.value) c.props.limit = 1
  else c.props.limit = !curT.value ? 0 : Math.floor(curT.value / 60000)
  if (targetUser.inp !== (c.props.name || '')) c.props.name = targetUser.inp
  const op = new UpdateCredential(so.svc, so.org)
  const status = await op.run(c.credId, c.docCl, c.docPk, c.props)
  if (status) await ui.diagDisplay($t('APupdko'))
  else await ui.diagDisplay($t(toDel.value ? 'APdelok' : 'APupdok'))
  dialogs.edit = false
  await dolist()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.tb1 { border: 1px solid var(--q-secondary) }
</style>
