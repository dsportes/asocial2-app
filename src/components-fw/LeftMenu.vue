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
  </q-header>
  <q-page-container>
    <!--div><btn-cond label="Test Erreur" @ok="test"/></div-->
    <div v-if="sf.step === 0" class="q-mt-sm q-mb-lg q-px-sm">
      <btn-cond flat icon="exit_to_app" color="warning" :label="$t('endsession')"
        @ok="ui.closeMenu(); ui.sessionClose()"/>
    </div>

    <safe-tools v-if="sf.userId && sf.step !== 1" short class="q-mb-sm q-px-sm"
      @close="ui.closeMenu()"/>
    <div v-if="sf.step === 0" class="column q-px-sm">
      <btn-cond class="q-mb-sm" flat color="primary"
        @ok="openDemands" :disable="ui.page === 'demands'">
        <img :src="invitation" class="q-mr-xs" width="24px"/>
        <div>{{ $t('PAGEdemands') }}</div>
      </btn-cond>
      <btn-cond class="q-mb-sm" flat color="primary"
        @ok="openSponsorings" :disable="ui.page === 'sponsorings'">
        <img :src="invitation" class="q-mr-xs" width="24px"/>
        <div>{{ $t('PAGEsponsorings') }}</div>
      </btn-cond>
      <btn-cond v-if="sf.userId && (sf.auth.admins || hasManagedOrgs)"
        class="q-mb-sm" flat color="warning"
        @ok="openAdmin" :disable="ui.page === 'admin'">
        <img :src="superman" class="q-mr-xs" width="24px"/>
        <div>{{ $t('PAGEadmin') }}</div>
      </btn-cond>

      <btn-cond :disable="ui.page === 'app'" class="q-mb-sm"
        flat :label="$t('PAGEapp')"
        @ok="ui.closeMenu(); ui.setPage('app')"/>
      <btn-cond :disable="ui.page === 'auteur'" class="q-mb-sm"
        flat :label="$t('PAGEauteur')"
        @ok="ui.closeMenu(); ui.setPage('auteur')"/>
      <btn-cond v-if="ui.page !== 'test'" class="q-mb-sm"
        flat :label="$t('PAGEtest')"
        @ok="ui.closeMenu(); ui.setPage('test')"/>
      <!--div class="q-my-lg q-pa-sm">
        <div v-for="n in 10" :key="n">Drawer {{ n }} / 50</div>
      </div-->
    </div>
  </q-page-container>

</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive } from 'vue'
import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'
import { ErrorTest } from '../src-fw/operations'

import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import SafeTools from '../components-fw/SafeTools.vue'

// @ts-ignore
import superman from '../assets/superman.jpg'
// @ts-ignore
import invitation from '../assets/invitation.png'

const sf = stores.safe
const ui = stores.ui
// const session = stores.session

const test = async () => {
  await new ErrorTest('AS2', 'doda').run()
}

const hasManagedOrgs = computed(() => sf.managerCreds().size !== 0)

const openAdmin = (svc) => {
  ui.closeMenu()
  ui.setPage('admin')
}

const openDemands = (svc) => {
  ui.closeMenu()
  ui.setPage('demands')
}

const openSponsorings = (svc) => {
  ui.closeMenu()
  ui.setPage('sponsorings')
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
