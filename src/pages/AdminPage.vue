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
          <line-edit v-else width="sm" :text="url" :ctx="{site: site}"
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
    <status-site v-if="ui.adminPage.soa.site" v-model="ui.adminPage.soa" class="q-mt-md"/>

    <div v-if="ui.adminPage.soa.site" class="q-my-sm titre-md">
      <div v-if="ui.adminPage.soa.admin" class="row q-gutter-sm items-center">
        <img :src="superman" width="24px"/>
        <div class="titre-md text-bold">{{ $t('APsiteadmin') }}</div>
      </div>
      <div class="titre-md">{{ $t('APsinfo', [ui.adminPage.soa.site, surl]) }}</div>
    </div>

    <div v-if="ui.adminPage.soa.site && ui.adminPage.soa.org" class="q-my-md">
      <div class="q-mb-sm titre-md">
        {{ $t('orgStatus', [ui.adminPage.soa.org, ui.adminPage.soa.svcLabel, ui.adminPage.soa.site]) }}
      </div>
      <status-org v-model="ui.adminPage.soa"/>
    </div>
  </div>

  <div v-if="ui.adminPage.tab === 'managers' && ui.adminPage.soa.svc && ui.adminPage.soa.org" class="pwmd">
    <div v-if="!lstMgr.length" class="titre_md text-italic">{{ $t('APnomanagers') }}</div>

    <div v-else class="q-my-xs" v-for="(m, idx) in lstMgr" :key="m.credId" :class="dkli(idx)">
      <div class="ellipsis">{{$t('CREDON_' + m.docCl)}}</div>
      <div class="row">
        <div v-if="sf.mySafeCreds.has(m.credId)" class="col-auto text-bold font-mono q-mr-sm">[{{ $t('me') }}]</div>
        <line-edit class="col" width="sm" :text="m.props.name || '?'"
          :ctx="{ m: m }" @change="chgName"/>
      </div>
      <div class="row q-gutter-sm no-wrap">
        <btn-cond class="col-auto" icon="edit" @ok="edCred(m)"/>
        <div class="col font-mono">{{ m.editSusp() }}</div>
      </div>
    </div>
  </div>

  <rev-susp v-if="dialogs.credmgnt" v-model="dialogs.credmgnt"
    :svc="ui.adminPage.soa.svc" :org="ui.adminPage.soa.org" :curcred="curcred"
    :title="tit"
    @done="onDone" />

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, reactive, onMounted, watch  } from 'vue'
import stores from '../stores/all'
import { $t, dkli, dhcool, sty, zp } from '../src-fw/util'
import StatusSite from '../components-fw/StatusSite.vue'
import StatusOrg from '../components-fw/StatusOrg.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import SelectSite from '../components-fw/SelectSite.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import { $Cred } from '../src-fw/documents'
import RevSusp from '../dialogs-fw/RevSusp.vue'
// import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { AOperation, MDOperation, isAdmin, services, pingStore } from '../src-fw/operation'
import { ListManagers, UpdateCredential } from '../src-fw/operations'
// @ts-ignore
import superman from '../assets/superman.jpg'


/* export type SOA = {
  svc: string
  org: string
  svcLabel?: string
  site?: string
  admin? : boolean
} */

const ui = stores.ui
const sf = stores.safe

const dialogs = reactive({
  confirmrevoke: false,
  credmgnt: false,
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
  adp.value.soa.site = ''
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
  if (adp.value.soa.site === site) {
    curSite.site = ''
    adp.value.soa.site = ''
  } else {
    curSite.site = site
    curSite.admin = false
    curSite.svc = ''
    curSite.services = new Set()
    curSite.svcLabel = ''
    adp.value.soa.site = site
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

const surl = computed(() => AOperation.urls.get(ui.adminPage.soa.site) || '?')

const lstMgr: Ref<$Cred[]> = ref([]) // Cred []

watch(() => adp.value.tab, (t) => {
  if (t === 'sites') init1()
})

watch(() => adp.value.soa, async (soa) => {
  if (adp.value.tab === 'managers' && adp.value.soa.svc && adp.value.soa.org) 
    await dolist()
})

const dolist = async () => {
  lstMgr.value = []
  const op = new ListManagers(adp.value.soa.svc, adp.value.soa.org)
  lstMgr.value = await op.run()
  // console.log(lstMgr.value.length)
}

const chgName = async (ctx) => {
  const op = new UpdateCredential(ui.adminPage.soa.svc, ui.adminPage.soa.org)
  const props = { ...ctx.m.props, name: ctx.value }
  const status = await op.run(ctx.m.credId, ctx.m.docCl, ctx.m.docPk, props)
  if (status) await ui.diagDisplay($t('APupdko'))
  else await dolist()
}

const curcred = ref()
const tit = ref()
const edCred = (m) => {
  curcred.value = m
  tit.value = $t('CREDON_' + m.docCl) + ' - ' + m.props.name
  dialogs.credmgnt = true
}

const onDone = async () => {
  dialogs.credmgnt = false
  await dolist()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.tb1 { border: 1px solid var(--q-secondary) }
</style>
