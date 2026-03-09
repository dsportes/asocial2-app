<template>
<q-layout container view="hHh lpR fFf">
  <q-header :class="sty()">
    <q-toolbar class="tbs">
      <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.closeMenu()"/>
      <q-toolbar-title class="titre-md text-center q-mx-sm">{{sf.userName || sf.userId}}</q-toolbar-title>
      <help-button page="help"/>
    </q-toolbar>
    <div class="column items-center">
      <input-A  class="q-ma-sm" prefix="orgcode"
        v-model="session.currentOrg" size="org"/>
    </div>
  </q-header>
  <q-page-container>
    <div v-if="sf.step === 0" class="column q-pa-sm">
      <btn-cond  class="q-mb-sm"
        flat icon="exit_to_app" color="warning"
        :label="$t('endsession')" @ok="ui.closeMenu(); backToOpenSession()"/>
      <btn-cond v-if="hasManagedOrgs" class="q-mb-sm"
        flat icon="img:icons/superman.jpg" color="warning" :label="$t('PanelManager')"
        @ok="openManager"/>
      <btn-cond v-if="sf.auth.admins" class="q-mb-sm"
        flat icon="img:icons/superman.jpg" color="warning" :label="$t('PAGEadmin')"
        @ok="openAdmin"/>
      <btn-cond v-if="ui.page !== 'app'" class="q-mb-sm"
        flat :label="$t('PAGEapp')"
        @ok="ui.closeMenu(); ui.setPage('app')"/>
      <btn-cond v-if="ui.page !== 'test'" class="q-mb-sm"
        flat :label="$t('PAGEtest')"
        @ok="ui.closeMenu(); ui.setPage('test')"/>
      <div class="q-my-lg q-pa-sm">
        <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div>
      </div>
    </div>
  </q-page-container>

  <managed-orgs v-if="ui.dModels[idc].managedorgs" :idc="idc"/>
</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch, onUnmounted } from 'vue'
import stores from '../stores/all'
import HelpButton from '../components-fw/HelpButton.vue'
import InputA from '../components-fw/InputA.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ManagedOrgs from '../components-fw/ManagedOrgs.vue'
import { $t, sty } from '../src-fw/util'

const sf = stores.safe
const ui = stores.ui
// const config = stores.config
const session = stores.session

const idc = ui.getIdc('LeftMenu')
onUnmounted(() => ui.closeVue(idc))

const backToOpenSession = async () => {
  const ok = await ui.diagDisplay($t('HPbackopen'), true)
  if (ok)
    ui.backToOpenSession()
}

watch(() => ui.leftmenu, (v) => { 
  onOpen() 
})

const hasManagedOrgs = ref(false)

const onOpen = () => {
  const m = sf.managedOrgs()
  hasManagedOrgs.value = m.size !== 0
}
onOpen()

const openAdmin = (svc) => {
  ui.closeMenu()
  ui.setPage('admin')
  session.SVC = ''
  session.$OP = ''
  session.org = ''
}

const openManager = () => {
  ui.closeMenu()
  ui.oD(idc, 'managedorgs')
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
