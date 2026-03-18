<!-- Barre de menu à gauche (component)
Contrôlé par ui.leftMenu
-->
<template>
<q-layout container view="hHh lpR fFf">
  <q-header :class="sty()">
    <q-toolbar class="tbs">
      <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.closeMenu()"/>
      <q-toolbar-title class="titre-md text-center q-mx-sm">
        {{sf.userName || sf.userId || $t('guest')}}
      </q-toolbar-title>
      <help-button page="help"/>
    </q-toolbar>
    <div v-if="sf.userId" class="column items-center">
      <input-A  class="q-ma-sm" prefix="orgcode"
        v-model="session.currentOrg" size="org"/>
    </div>
  </q-header>
  <q-page-container>
    <btn-cond  v-if="sf.step === 0" class="q-mb-sm q-pa-sm"
      flat icon="exit_to_app" color="warning" :label="$t('endsession')" 
      @ok="ui.closeMenu(); backToOpenSession()"/>
    <safe-tools v-if="sf.userId && sf.step !== 1" short class="q-mb-sm q-pa-sm"/>
    <div v-if="sf.step === 0" class="column q-px-sm">
      <btn-cond v-if="sf.userId && hasManagedOrgs" class="q-mb-sm"
        flat icon="img:icons/superman.jpg" 
        color="warning" :label="$t('PanelManager')"
        @ok="openManager"/>
      <btn-cond v-if="sf.userId && sf.auth.admins" class="q-mb-sm"
        flat icon="img:icons/superman.jpg" 
        color="warning" :label="$t('PAGEadmin')"
        @ok="openAdmin"/>
      <btn-cond v-if="ui.page !== 'app'" class="q-mb-sm"
        flat :label="$t('PAGEapp')"
        @ok="ui.closeMenu(); ui.setPage('app')"/>
      <btn-cond class="q-mb-sm" icon="add_circle"
        flat :label="$t('INVbtn1')"
        @ok="ui.closeMenu(); dialogs.NewInvit = true"/>
      <btn-cond class="q-mb-sm" icon="search"
        flat :label="$t('INVbtn2')"
        @ok="ui.closeMenu(); dialogs.ScanInvit = true"/>
      <btn-cond v-if="ui.page !== 'test'" class="q-mb-sm"
        flat :label="$t('PAGEtest')"
        @ok="ui.closeMenu(); ui.setPage('test')"/>
      <div class="q-my-lg q-pa-sm">
        <div v-for="n in 10" :key="n">Drawer {{ n }} / 50</div>
      </div>
    </div>
  </q-page-container>

  <managed-orgs v-model="dialogs.ManagedOrgs"/>

  <dialog-std2 v-model="dialogs.NewInvit" 
    :title="$t('INVtit_1_label')" tbclass="tbs">
    <template #default>
      <invit-newrequest/>
    </template>
  </dialog-std2>

  <dialog-std2 v-model="dialogs.ScanInvit" 
    :title="$t('INVtit_2_label')" tbclass="tbs">
    <template #default>
      <invit-scanrequests/>
    </template>
  </dialog-std2>
</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'
import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import HelpButton from '../components-fw/HelpButton.vue'
import InputA from '../components-fw/InputA.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import SafeTools from '../components-fw/SafeTools.vue'
import InvitNewrequest from '../components-fw/InvitNewrequest.vue'
import InvitScanrequests from '../components-fw/InvitScanrequests.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import ManagedOrgs from '../dialogs-fw/ManagedOrgs.vue'

const sf = stores.safe
const ui = stores.ui
// const config = stores.config
const session = stores.session

const dialogs = reactive({
  ManagedOrgs: false, NewInvit: false, ScanInvit: false
})

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
  dialogs.ManagedOrgs = true
  ui.closeMenu()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
