<!-- Affiche la liste des managers pour:
- le Service sélectionné,
- l'organisation sélectionnée. 
-->
<template>
<dialog-std2 v-model="model" :title="$t('PanelManager')" tbclass="tbs">
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
    <div v-if="tab==='invits'"class="q-mx-md">
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
      <q-toolbar v-if="zoomed" class="q-mt-sm tbp">
        <btn-cond color="warning" size="md" icon="chevron_left"
          @ok="zoomed = false" :label="$t('INVtitlst')"/>
        <q-toolbar-title class="fs-md">
          <div class="row">
            <div class="font-mono">{{$t('INVst_' + selInv.status)}}</div>
            <div class="q-ml-sm">{{dhcool(selInv.time * 1000)}}</div>
          </div>
        </q-toolbar-title>
        <btn-cond v-if="selInv.status === 1" :label="$t('INVbtn_val')"
          class="q-mr-xs" icon="check" @ok="validate"/>
        <btn-cond v-if="selInv.status === 1" :label="$t('INVbtn_rej')"
          icon="close" @ok="reject" color="warning"/>
      </q-toolbar>
      <q-separator v-else color="orange" class="q-mt-sm"/>
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

    <div v-for="(inv, idx) in invits" :key="inv.invitId" 
      :class="dkli(idx) + ' q-pa-xs'">
      <div :class="clinv(inv)" @click="zoom(inv)">
        <div class="row full-width">
          <div class="col-2 font-mono">{{$t('INVst_' + inv.status)}}</div>
          <div class="col-4">{{dhcool(inv.time * 1000)}}</div>
          <div class="col-3 text-center">{{ inv.minor || '-'}}</div>
          <div class="col-3 text-center">{{ inv.label || '-na-'}}</div>
        </div>
        <div class="row full-width">
          <div class="col-2"></div>
          <div class="col-10 text-italic ellipsis">
            {{ inv.txtx || inv.txtm }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'invits' && zoomed" class=" full-width q-pa-xs">
    <div v-if="selInv.minor" class="q-mt-sm row items-center">
      <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
      <div class='font-mono'>{{selInv.minor}}</div>
    </div>

    <div class="q-mt-sm row items-center">
      <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
      <div class='font-mono'>
        <span>{{selInv.userId}}</span>
        <span v-if="selInv.safeStore" class="q-ml-md">[{{selInv.safeStore}}]</span>
      </div>
    </div>

    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtm')}}</div>
    <q-input class="q-pa-xs bord1" v-model="selInv.txtm" type="textarea"
      readonly borderless :rows="5"/>

    <div v-if="selInv.me">
      <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_me')}}</div>
      <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txti')}}</div>
      <q-input class="q-pa-xs bord1" v-model="selInv.txti" type="textarea"
        readonly borderless :rows="5"/>
    </div>

    <div v-if="selInv.status === 5">
      <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtx')}}</div>
      <q-input class="q-pa-xs bord1" v-model="selInv.txtx" type="textarea"
        readonly borderless :rows="5"/>
    </div>

    <div v-if="selInv.status === 2 || selInv.status >= 4"
      class="q-mt-sm row items-center">
      <div class='titre-md text-italic q-mr-md'>{{$t('INVx_cred')}}</div>
      <div class='font-mono'>
        <span>{{selInv.role}}</span>
        <span v-if="selInv.docId" class="q-ml-md">[{{selInv.docId}}]</span>
      </div>
    </div>

  </div>

</template>
</dialog-std2>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'

import stores from '../stores/all'
import { ListManagers, ListInvits } from '../src-fw/operations'
import { $t, dkli, dhcool, sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'

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

const init = () => {
  const managedOrgs: Map<string, Set<string>> = sf.managedOrgs() || new Map()
  services.value = Array.from(managedOrgs.keys())
  SVC.value = services.value.length ? services.value[0] : ''
  orgs.value = Array.from(managedOrgs.get(SVC.value) || [])
  org.value = orgs.value.length ? orgs.value[0] : ''
  major.value = ''
}

const lstMgr = ref([])

const clinv = (inv) => (selInv.value && (inv.invitId = selInv.value.invitId) ? 'current' : 'nocurrent') +
 ' column q-py-xs full-width select cursor-pointer'

const doList = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(SVC.value).run(org.value, true)
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
  zoomed.value = false
}

watch(major, (v) => {
  search.value = 0
  selInv.value = null
  zoomed.value = false
})
const getInvits = async () => {
  search.value = 1
  invits.value = []
  const op = new ListInvits(SVC.value)
  invits.value = await op.run(org.value, major.value.value, true)
  search.value = 2
  selInv.value = null
  zoomed.value = false
}
const zoom = (inv) => {
  selInv.value = inv
  zoomed.value = true
}

const validate = () => {

}

const reject = () => {
  
}

init()
init2()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>
