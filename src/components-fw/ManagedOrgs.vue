<template>
<dialog-std0 v-model="ui.dModels[idc].managedorgs" :title="$t('PanelManager')">
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
import { ref, computed } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import DialogStd0 from '../components-fw/DialogStd0.vue'
import { ListManagers } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'

const ui = stores.ui
const sf = stores.safe

const props = defineProps({
  idc: Number
})

const managedOrgs: Map<string, Set<string>> = sf.managedOrgs()
const services = Array.from(managedOrgs.keys())

const SVC = ref(services[0])
const orgs = computed(() => Array.from(managedOrgs.get(SVC.value)) )
const org = ref(orgs.value[0])

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
