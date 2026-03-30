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
    <!--div v-if="sf.userId" class="column items-center">
      <input-A  class="q-ma-sm" prefix="orgcode"
        v-model="session.currentOrg" size="org"/>
    </div-->
  </q-header>
  <q-page-container>
    <btn-cond  v-if="sf.step === 0" class="q-my-sm q-pa-sm"
      flat icon="exit_to_app" color="warning" :label="$t('endsession')" 
      @ok="ui.closeMenu(); dialogs.SessionClose = true"/>
    <safe-tools v-if="sf.userId && sf.step !== 1" short class="q-mb-sm q-pa-sm"/>
    <div v-if="sf.step === 0" class="column q-px-sm">
      <btn-cond v-if="sf.userId && (sf.auth.admins || hasManagedOrgs)" 
        class="q-mb-sm" flat color="warning" :label="$t('PAGEadmin')"
        icon="img:icons/superman.jpg" 
        @ok="openAdmin"/>
      <btn-cond class="q-mb-sm" flat color="primary" :label="$t('PAGEdemands')"
        @ok="openDemands"/>
      <btn-cond v-if="ui.page !== 'app'" class="q-mb-sm"
        flat :label="$t('PAGEapp')"
        @ok="ui.closeMenu(); ui.setPage('app')"/>
      <btn-cond v-if="ui.page !== 'test'" class="q-mb-sm"
        flat :label="$t('PAGEtest')"
        @ok="ui.closeMenu(); ui.setPage('test')"/>
      <!--div class="q-my-lg q-pa-sm">
        <div v-for="n in 10" :key="n">Drawer {{ n }} / 50</div>
      </div-->
    </div>
  </q-page-container>

  <choose-it v-model="dialogs.SessionClose"
    prefix="HPbackopen" options="pw" 
    @giveup="dialogs.SessionClose = false"
    @option="sessionClose"/>

</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed, reactive, watch } from 'vue'
import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import HelpButton from '../components-fw/HelpButton.vue'
// import InputA from '../components-fw/InputA.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import SafeTools from '../components-fw/SafeTools.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const dialogs = reactive({
  SessionClose: false
})

const sessionClose = (n) => {
  if (n === 1) ui.backToOpenSession()
}

const hasManagedOrgs = computed(() => sf.managedOrgs().length !== 0)

const openAdmin = (svc) => {
  ui.closeMenu()
  ui.setPage('admin')
  session.SVC = ''
  session.$OP = ''
  session.org = ''
}

const openDemands = (svc) => {
  ui.closeMenu()
  ui.setPage('demands')
  ui.demandsPage.SVC = ''
  ui.demandsPage.org = ''
  ui.demandsPage.tab = 'list'
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
