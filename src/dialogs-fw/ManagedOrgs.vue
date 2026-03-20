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

    <div class="row full-width q-my-xs q-px-xs items-center">
      <q-select class="col-5" dense filled v-model="SVC"
        :options="services" emit-value :label="$t('service')"/>
      <div class="col-1"/>
      <q-select class="col-5" dense filled v-model="org"
        :options="orgs" emit-value :label="$t('org')"/>
      <btn-cond class="col-1 text-right" round icon="check" @ok="doList"/>
    </div>
    
    <div v-if="tab==='invits'"class="q-mx-xs">
      <bar-title prefix="MNOmajor"/>
      <div class="row items-center">
        <q-select class="col q-mr-md"
          dense filled v-model="major" style="margin-left:20px"
          :disable="org === ''"
          :options="majOpts" :label="$t('INVmajor_c')"/>
        <btn-cond class="col-auto" icon="search" color="primary" round
          :disable="org === '' || major === ''"
          @ok="getInvits"/>
      </div>
      <q-separator color="orange" class="q-my-sm"/>
      <invit-hdr v-if="zoomed" class="q-mb-sm"
        :invit="selInv" :sponsor="isSponsor" back="INVtitlst"
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
import { ref, computed, Ref, watch } from 'vue'

import stores from '../stores/all'
import { ListManagers, ListInvits } from '../src-fw/operations'
import { $t, dkli, dhcool, sty } from '../src-fw/util'

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

const services = ref([])
const SVC = ref('')
const orgs = ref([])
const org = ref('')
const major = ref('')
const tab = ref('invits') // managers

const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV_' + m)})

const managedOrgs: Ref<Map<string, Set<string>>> = ref()

const init = () => {
  managedOrgs.value = sf.managedOrgs() || new Map()
  services.value = Array.from(managedOrgs.value.keys())
  SVC.value = services.value.length ? services.value[0] : ''
  orgs.value = Array.from(managedOrgs.value.get(SVC.value) || [])
  org.value = orgs.value.length ? orgs.value[0] : ''
  major.value = ''
}

const isSponsor = computed(() => {
  const e = managedOrgs.value.get(SVC.value)
  return e && e.has(org.value)
})

const lstMgr = ref([])

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

const init2 = () => {
  search.value = 0
  selInv.value = null
  zoomed.value = false
  invits.value = []
}

watch([major, SVC, org], (v) => { init2() })

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
init2()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
