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
    </q-tabs>
    <div class="titre-md text-italic text-center full-width">
      {{$t('MNOtit' + (tab === 'managers' ? '1' : '2'))}}</div>

    <div class="full-width q-my-md q-px-sm">
      <q-select dense options-dense filled clearable
        transition-show="flip-up" transition-hide="flip-down"
        v-model="svcOrg"
        :options="sf.managedOrgs()" :label="$t('MNOorgs')"/>
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

</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { ListManagers } from '../src-fw/operations'
import { $t, dkli, dhcool } from '../src-fw/util'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const svcOrg = ref()
const SVC = ref('')
const org = ref('')
const tab = ref('managers') // managers

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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
