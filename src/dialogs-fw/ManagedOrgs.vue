<!-- Pour:
- le Service sélectionné,
- l'organisation sélectionnée. 
Affiche: 
- la liste des managers
- les invitations en cours
-->
<template>
<dialog-std2 v-model="model" :title="$t('PanelManager')" tbclass="tbp"  vue="ManagedOrgs">
  <template #hdr>
    <q-tabs dense v-model="tab" breakpoint="2000px"
      class="full-width bg-primary text-white shadow-2">
      <q-tab name="managers" icon="img:icons/superman.jpg" :label="$t('MNOtab1')" />
      <q-tab name="invits" icon="img:icons/flowers.png" :label="$t('MNOtab2')" />
    </q-tabs>
    <div class="titre-md text-italic text-center full-width">
      {{$t('MNOtit' + (tab === 'managers' ? '1' : '2'))}}</div>

    <div class="full-width q-my-md q-px-sm">
      <q-select dense options-dense filled clearable
        transition-show="flip-up" transition-hide="flip-down"
        v-model="svcOrg"
        :options="sf.managedOrgs()" :label="$t('MNOorgs')"/>
    </div>

    <div v-if="tab==='invits'"class="q-mx-xs">
      <bar-title prefix="MNOmajor"/>
      <q-select class="col q-mr-md" style="margin-left:20px"
        dense filled options-dense clearable
        v-model="major" 
        :disable="org === ''"
        :options="majOpts" :label="$t('INVmajor_c')"/>

      <q-separator color="orange" class="q-my-sm"/>

      <invit-hdr v-if="zoomed" class="q-mb-sm"
        :invit="selInv" :sponsor="sf.isManager(SVC, org)" back="INVtitlst"
        @back="zoomed = false"
        @validate="validate" @reject="reject" @accept="accept" @decline="decline" />
    </div>
  </template>

  <template #default>
  <div v-if="tab === 'managers'" class="full-width q-pa-xs">
    <div class="q-my-xs full-width" v-for="(m, idx) in lstMgr" :key="idx" :class="dkli(idx)">
      <div class="row">
        <div class="col-6 font-mono ellipsis">{{m.userId}}</div>
        <div class="col-3 q-pl-sm">{{dhcool(m.time)}}</div>
        <div class="col-3 q-pl-sm">{{m.limit ? dhcool(m.limit) : $t('APnolimit')}}</div>
      </div>
      <div class="row">
        <div class="col-1">
          <div v-if="m.userId === sf.userId" class="text-bold">[{{$t('me')}}]</div>
        </div>
        <div class="col-11 text-italic">{{m.cond.info}}</div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'invits' && !zoomed" class="full-width q-pa-xs">
    <div v-if="search === 0" class="titre-md text-italic q-my-md text-center full-width">
      {{$t('MNOsearch0')}}
    </div>
    <div v-if="search === 1" class="titre-md text-italic q-my-md text-center full-width">
      {{$t('MNOsearch1')}}
    </div>
    <div v-if="search === 2 && !invits.length" 
      class="titre-md text-italic text-warning text-bold q-my-md text-center full-width">
      {{$t('MNOnoinvits')}}
    </div>

    <div v-for="(inv, idx) in invits" :key="inv.invitId" :class="dkli(idx) + ' q-pa-xs'">
      <invit-line :invit="inv" :selinvit="selInv" @zoom="zoom(inv)"/>
    </div>
  </div>

  <div v-if="tab === 'invits' && zoomed" class="full-width q-pa-xs">
    <invit-zoom :invit="selInv" />
  </div>

</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { ListManagers, ListInvits } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InvitLine from '../components-fw/InvitLine.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const ui = stores.ui
const sf = stores.safe
const config = stores.config

const model = defineModel()

const svcOrg = ref()
const SVC = ref('')
const org = ref('')
const major = ref(null)
const tab = ref('invits') // managers

const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV_' + m)})

const lstMgr = ref([])

watch(svcOrg, async (x) => {
  SVC.value = x ? x.svc : ''
  org.value = x ? x.org : ''
  if (x) await doList()
  else lstMgr.value = []
})

const doList = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(SVC.value, org.value).run(true)
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

const invits = ref()
const search = ref(0) // 0: repos 1:en recherche 2:recherche faite
const selInv = ref()
const zoomed = ref(false)

const init = () => {
  major.value = null
  search.value = 0
  selInv.value = null
  zoomed.value = false
  invits.value = []
}

watch([SVC, org], (v) => { init() })

watch(() => major.value, async (v) => {
  if (v) await getInvits()
  else init()
})

const getInvits = async () => {
  search.value = 1
  invits.value = []
  const op = new ListInvits(SVC.value, org.value)
  invits.value = await op.run(major.value.value, true)
  search.value = 2
  selInv.value = null
  zoomed.value = false
}

const zoom = (inv) => {
  selInv.value = inv
  zoomed.value = true
}

const validate = () => { // SP valide l'invitation selInv
  console.log('validate')
}

const reject = (txt: string) => { // SP rejete l'invitation selInv
// txt: justificatif
  console.log('reject', txt)
}

const accept = () => { // U accepte l'invitation selInv
  console.log('accept')
}

const decline = (txt: string) => { // U décline l'invitation selInv
// txt: justificatif
  console.log('decline', txt)
}

init()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
