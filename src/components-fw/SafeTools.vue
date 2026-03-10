<template>
<div>
  <btn-cond :label="$t('SFTtit')" flat color="none"
    @ok="ui.oD(myidc, 'safetools')"/>

  <dialog-std0 v-model="ui.dModels[myidc].safetools" :title="$t('SFTtit')"
    vh="75" @close="emit('close', myidc)">
    <template #default>
      <div class="row q-gutter-sm q-my-xs items-end">
        <div class="titre-md text-italic">{{ $t('SFTus') }}</div>
        <div class="fs-lg font-mono">{{ sf.userId }}</div>
      </div>
      <div class="row q-gutter-sm q-my-xs items-end">
        <div class="titre-md text-italic">{{ $t('SFT' + (sf.userName !== '' ? 'ps' : 'nops')) }}</div>
        <div v-if="sf.userName !== ''" class="font-mono">{{ sf.userName }}</div>
      </div>
      <div class="row q-gutter-sm q-my-xs items-end">
        <div class="titre-md text-italic">{{ $t('SFT' + (sf.auth.contact !== '' ? 'ct' : 'noct')) }}</div>
        <div v-if="sf.auth.contact !== ''" class="font-mono">{{ sf.auth.contact }}</div>
      </div>
      <div v-if="sf.auth.admins" class="row q-gutter-sm q-my-xs items-end">
        <div class="titre-md text-italic">{{ $t('SFTadmin')}}</div>
        <div class="font-mono">{{ sf.auth.admins }}</div>
      </div>
      <text-zoom class="q-my-xs" :label="$t('HPexppub')" 
        :text="infopub" :rows="15"/>

      <q-separator color="orange" class="q-my-xs"/>

      <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')"
        :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
        @open="ui.oD(myidc, 'createsafe')" size="sm"/>

      <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
        :title="$t('HPtrustings_1')"
        :disable="!session.hasNet || session.incognito || sf.openMode > 2"
        @open="ui.oD(myidc, 'trustings')"/>

      <bar-open v-if="trustingMe === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
        @open="ui.oD(myidc, 'trust')" size="sm"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
        @open="ui.oD(myidc, 'trustit')" size="sm"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
        @open="openUntrust" size="sm"/>

      <bar-open :bubble="$t('SESconfig')" :disbubble="$t('SESconfig')"
        :title="$t('SESconfig')"
        :disable="!session.hasNet"
        @open="ui.oD(myidc, 'credsmgr')"/>

      <bar-open :bubble="$t('HPadminA_bub')" :disbubble="$t('HPadminA_bub')"
        :title="$t('HPadminA_label')"
        :disable="!session.hasNet"
        @open="admins = true; ui.oD(myidc, 'adminmgr')"/>

      <bar-open :bubble="$t('HPadmin_bub')" :disbubble="$t('HPadmin_bub')"
        :title="$t('HPadmin_label')"
        :disable="!session.hasNet"
        @open="admins = false; ui.oD(myidc, 'adminmgr')"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="!session.hasNet || session.incognito"
        @open=" ui.oD(myidc, 'prefsmgr')"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPmanusers')" 
        @open="ui.oD(myidc, 'manusers')"/>

      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPexpsafe_1')" 
        @open="ui.oD(myidc, 'exportsafe')"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPdelsafe_1')" 
        @open="ui.oD(myidc, 'delsafe')"/>
      
    </template>
  </dialog-std0>

  <!-- Enregistrement / Changement des codes -->
  <creds-mgr :idc="myidc" @close="fnc"/>
  <prefs-mgr :idc="myidc" @close="fnc"/>
  <admin-mgr :idc="myidc" admins @close="fnc"/>
  <manage-users :idc="myidc" @close="fnc" />
  <safe-cr :idc="myidc" :mode="1" @close="fnc"/>
  <dev-trustings :idc="myidc" @close="fnc"/>
  <dev-trustit :idc="myidc" @close="fnc" @done="fnc"/>
  <dev-untrustit :idc="myidc" @close="fnc" @done="fnc"/>
  <safe-export :idc="myidc" @close="fnc" @done="fnc"/>

  <!-- Confirmation de destruction du safe -->
  <q-dialog v-model="ui.dModels[myidc].delsafe" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_9')}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_8')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm actif :confirm="delSafe"/>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, computed, onUnmounted, watch } from 'vue'

import stores from '../stores/all'
import DialogStd0 from '../components-fw/DialogStd0.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import PrefsMgr from '../components-fw/PrefsMgr.vue'
import AdminMgr from '../components-fw/AdminMgr.vue'
import CredsMgr from '../components-fw/CredsMgr.vue'
import ManageUsers from '../components-fw/ManageUsers.vue'
import SafeCr from '../components-fw/SafeCr.vue'
import DevTrustings from '../components-fw/DevTrustings.vue'
import DevTrustit from '../components-fw/DevTrustit.vue'
import DevUntrustit from '../components-fw/DevUntrustit.vue'
import SafeExport from '../components-fw/SafeExport.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, sty } from '../src-fw/util'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const myidc = ui.getIdc('SafeTools')
onUnmounted(() => ui.closeVue(myidc))
const emit = defineEmits(['close', 'done'])
const me = computed(() => ui.dModels[myidc].safetools)
watch(() => me.value, (v: boolean) => { 
  if (v) init(); else { cleanup(); emit('close', myidc) } })
const init = () => {}
const cleanup = () => {}

const trustingMe = computed(() => sf.myTrusting )
const admins = ref(false)

const openUntrust = async () => {
  await sf.getMySessions()
  ui.oD(myidc, 'untrustit')
}

const infopub = computed(() => JSON.stringify([sf.auth.C, sf.auth.V], null, '\t'))

const fnc = (st) => {
  ui.fD()
}

const delSafe = async () => {
  const status = await sf.delSafe()
  if (status === 0) {
    await ui.diagDisplay($t('HPcsret_9'))
    ui.fD()
    sf.backToAuth()
  } else {
    await ui.diagDisplay($t('HPopsret_' + status))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>