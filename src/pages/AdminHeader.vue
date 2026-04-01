<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>

    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEadmin')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <help-button class="" page="DOCpg"/>
    <div style="color:transparent;width:3px">*<q-tooltip>AdminPage</q-tooltip></div>
  </q-toolbar>

  <div v-if="svcOps.size" :class="sty() + ' row q-gutter-sm q-pa-sm'">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <btn-cond v-for="[k,svcOp] of svcOps" :key="k"
      @ok="setSvcOp(svcOp)"
      :color="svcOp.svc === ui.adminPage.SVC && svcOp.op === ui.adminPage.$OP ? 'warning' : 'primary'"
      :label="'[' + $t('services_' + svcOp.svc) + '] / ' + svcOp.op"/>
    <!--btn-cond label="ASSO2$BLUE" @ok="ui.adminPage.SVC='ASSO2'; ui.adminPage.$OP='$BLUE'"/-->
  </div>

  <q-tabs dense v-model="ui.adminPage.tab" breakpoint="2000px"
    class="full-width tbp shadow-2">
    <q-tab name="svcstatus" icon="cloud" :label="$t('svcorg')" />
    <q-tab name="managers" icon="img:icons/superman.jpg" :label="$t('APnewManager_2')" />
  </q-tabs>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref } from 'vue'

import { $t, sty } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe

type Elt = {
  svc: string
  op: string
}
const svcOps: Ref<Map<string, Elt>> = ref(new Map())

const setSvcOp = (svcOp) => {
  ui.adminPage.SVC = svcOp.svc
  ui.adminPage.$OP = svcOp.op
}

const reset = () => {
  ui.adminPage.$OP = ''
  ui.adminPage.SVC = ''
  svcOps.value.clear()
  const x = sf.auth && sf.auth.admins ? sf.auth.admins : ''
  if (x) {
    const y = x.split('/')
    for (const k of y) {
      const z = k.split('.')
      svcOps.value.set(k, { svc: z[0], op: z[1]})
    }
  }
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
