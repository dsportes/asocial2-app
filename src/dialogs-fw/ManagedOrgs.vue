<!-- Affiche la liste des managers pour:
- le Service sélectionné,
- l'organisation sélectionnée. 
-->
<template>
<dialog-std0 v-model="model" :title="$t('PanelManager')">
  <template #hdr>
    <div class="row full-width q-my-sm q-px-xs items-center">
      <q-select class="col-5" dense filled v-model="SVC"
        :options="services" emit-value :label="$t('service')"/>
      <div class="col-1"/>
      <q-select class="col-5" dense filled v-model="org"
        :options="orgs" emit-value :label="$t('org')"/>
      <btn-cond class="col-1 text-right" round icon="check" @ok="doList"/>
    </div>
  </template>

  <template #default>
    <div class="full-width q-pa-xs">
      <div class="q-my-xs full-width" v-for="(m, idx) in lstMgr" :key="idx" :class="dkli(idx)">
        <div class="row">
          <div class="col-4 font-mono ellipsis">{{m.userId}}</div>
          <div class="col-4">{{dhcool(m.time)}}</div>
          <div class="col-4">{{m.limit ? dhcool(m.limit) : $t('APnolimit')}}</div>
        </div>
        <div class="row">
          <div class="col-1"></div>
          <div class="col-11 text-italic">{{m.cond.info}}</div>
        </div>
      </div>
    </div>
  </template>
</dialog-std0>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

import stores from '../stores/all'
import { ListManagers } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const services = ref([])
const SVC = ref('')
const orgs = ref([])
const org = ref('')

const init = () => {
  const managedOrgs: Map<string, Set<string>> = sf.managedOrgs() || new Map()
  services.value = Array.from(managedOrgs.keys())
  SVC.value = services.value.length ? services.value[0] : ''
  orgs.value = Array.from(managedOrgs.get(SVC.value) || [])
  org.value = orgs.value.length ? orgs.value[0] : ''
}

init()

const lstMgr = ref([])

const doList = async () => {
  lstMgr.value = []
  const [s, l] = await new ListManagers(SVC.value).run(org.value, true)
  if (s) 
    await ui.diagDisplay($t('APmgrnolst'))
  lstMgr.value = l || []
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
