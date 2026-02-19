<template>
<div class="column">
  <div class="row q-gutter-sm">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div v-if="adminServices" v-for="svc in adminServices" :key="svc"
      class="font-mono text-bold">{{svc}}</div>
  </div>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('svcStatus')">
    <service-status/>
  </q-expansion-item>
  <q-expansion-item switch-toggle-side expand-separator dense
    header-class="full-width tbs" :label="$t('APnewOrg')">
    <div class="q-py-sm q-px-md">
      <input-a class="q-my-xs" prefix="orgcode" size="org" v-model="neworg.neworg"/>
      <input-a class="q-my-xs" prefix="APdbcode" size="stdb" v-model="neworg.db"/>
      <input-a class="q-my-xs" prefix="APstcode" size="stdb" v-model="neworg.st"/>
      <div class="q-my-md row items-center justify-end q-gutter-sm">
        <btn-cond icon="undo" :label="$t('giveup')" flat
          @ok="resetNewOrg"/>
        <btn-cond icon="check" color="warning" :label="$t('validate')"
          @ok="neworg.val = true"/>
        <btn-confirm :actif="neworg.val" :confirm="cfNewOrg"/>
      </div>
    </div>
  </q-expansion-item>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'

import ServiceStatus from '../components-fw/ServiceStatus.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import { NewOrg } from '../src-fw/operations'
import { $t } from '../src-fw/util'
/*
// @ts-ignore
import { saveAs } from 'file-saver'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import InputPs from '../components-fw/InputPs.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import ChooseIt from '../components-fw/ChooseIt.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'
import { Crypt } from '../src-fw/crypt'
*/
// import anonymousW from '../assets/anonymous_white.png'
// import anonymousB from '../assets/anonymous_black.png'
// import databaseW from '../assets/database_white.png'
// import databaseB from '../assets/database_black.png'
// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
// const sf = stores.safe
const session = stores.session
// const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const adminServices = computed(() => session.admin.services )

const neworg = reactive({ neworg: '', db: '', st: '', val: false })

const resetNewOrg = () => {
  neworg.neworg = ''; neworg.db = ''; neworg.st = ''; neoworg.val = false
}

const cfNewOrg = async () => {
  // run (svc: string, neworg: string, st: number, db: string)
  const cr = await new NewOrg().run(session.admin.svc, neworg.neworg, neworg.st, neworg.db)
  if (cr >= 0 ) {
    await ui.diagDisplay($t('APcr_' + cr, [neworg.neworg]))
    resetNewOrg()
  } else {
    await ui.diagDisplay($t('APko', [neworg.neworg]))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
