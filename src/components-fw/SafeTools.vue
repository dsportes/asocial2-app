<!-- Bouton d'ouverture d'un panneau permettant d'ouvrir
tous les dialogues de gestion des "dsonnées de sécurité".
-->
<template>
<div>
  <btn-cond v-if="short" :label="$t('SFTtits')" flat color="warning"
    icon="settings"
    @ok="dialogs.SafeTools = true"/>
  <btn-cond v-else :label="$t('SFTtit')" flat color="none"
    @ok="dialogs.SafeTools = true"/>

  <dialog-std0 v-model="dialogs.SafeTools" :title="$t('SFTtit')"
    vh="90" @close="emit('close', true)">
    <template #default>
      <user-profile/>
      <q-separator color="orange" class="q-my-xs"/>

      <bar-open :bubble="$t('SESconfig')" :disbubble="$t('SESconfig')"
        :title="$t('SESconfig')"
        :disable="!session.hasNet"
        @open="dialogs.CredsMgr = true"/>

      <bar-open :bubble="$t('HPadminA_bub')" :disbubble="$t('HPadminA_bub')"
        :title="$t('HPadminA_label')"
        :disable="!session.hasNet"
        @open="admins = true; dialogs.AdminMgr = true"/>

      <bar-open :bubble="$t('HPadmin_bub')" :disbubble="$t('HPadmin_bub')"
        :title="$t('HPadmin_label')"
        :disable="!session.hasNet"
        @open="admins = false; dialogs.AdminMgr = true"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="!session.hasNet || session.incognito"
        @open="dialogs.PrefsMgr = true"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPmanusers')" 
        @open="dialogs.ManageUsers = true"/>

      <q-separator color="orange" class="q-mx-lg q-my-xs"/>
      <div class="titre-md text-italic">{{ $t('SFTopaf') }}</div>

      <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
        :title="$t('HPtrustings_1')"
        :disable="!session.hasNet || session.incognito || sf.openMode > 2"
        @open="dialogs.DevTrustings = true"/>

      <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')"
        :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
        @open="dialogs.SafeCr = true"/>

      <bar-open v-if="trustingMe === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
        @open="dialogs.DevTruistit = true"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
        @open="dialogs.DevTruistit = true"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
        @open="openUntrust"/>

      <q-separator color="orange" class="q-mx-lg q-my-xs"/>
      <div class="titre-md text-italic text-bold text-warning">{{ $t('SFTopal') }}</div>

      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.incognito || !session.hasNet || sf.openMode > 2"
        :title="$t('HPexpsafe_1')" 
        @open="dialogs.ExportSafe = true"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.incognito || !session.hasNet || sf.openMode > 2"
        :title="$t('HPdelsafe_1')" 
        @open="dialogs.delsafe = true"/>
      
    </template>
  </dialog-std0>

  <!-- Enregistrement / Changement des codes -->
  <creds-mgr v-model="dialogs.CredsMgr" @close="fnc"/>
  <prefs-mgr v-model="dialogs.PrefsMgr" @close="fnc"/>
  <admin-mgr v-model="dialogs.AdminMgr" admins @close="fnc"/>
  <manage-users v-model="dialogs.ManageUsers" @close="fnc" />
  <safe-cr v-model="dialogs.SafeCr" :mode="1" @close="fnc"/>
  <dev-trustings v-model="dialogs.DevTrustings" @close="fnc"/>
  <dev-trustit v-model="dialogs.TrustIt" @close="fnc" @done="fnc"/>
  <dev-untrustit v-model="dialogs.UntrustIt" @close="fnc" @done="fnc"/>
  <safe-export v-model="dialogs.SafeExport" @close="fnc" @done="fnc"/>

  <!-- Confirmation de destruction du safe -->
  <q-dialog v-model="dialogs.delSafe" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_9')}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_8')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="dialogs.delSafe = false"/>
        <btn-confirm actif @confirm="delSafe"/>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t, sty, coolBye } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import UserProfile from '../components-fw/UserProfile.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import PrefsMgr from '../dialogs-fw/PrefsMgr.vue'
import AdminMgr from '../dialogs-fw/AdminMgr.vue'
import CredsMgr from '../dialogs-fw/CredsMgr.vue'
import ManageUsers from '../dialogs-fw/ManageUsers.vue'
import SafeCr from '../dialogs-fw/SafeCr.vue'
import DevTrustings from '../dialogs-fw/DevTrustings.vue'
import DevTrustit from '../dialogs-fw/DevTrustit.vue'
import DevUntrustit from '../dialogs-fw/DevUntrustit.vue'
import SafeExport from '../dialogs-fw/SafeExport.vue'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const emit = defineEmits(['close'])
const props = defineProps({ 
  short: Boolean 
})
const dialogs = reactive({
  SafeTools: false,
  PrefsMgr: false,
  AdminMgr: false,
  CredsMgr: false,
  ManageUsers: false,
  SafeCr: false,
  DevTrustings: false,
  DevTrustit: false,
  DevUntrustit: false,
  SafeExport: false,
  delSafe: false
})

const trustingMe = computed(() => sf.myTrusting )
const admins = ref(false)

const openUntrust = async () => {
  await sf.getMySessions()
  dialogs.DevTrustit = true
}

const fnc = (st) => {
  dialogs.SafeTools = false
}

const delSafe = async () => {
  const status = await sf.delSafe()
  if (status === 0) {
    await ui.diagDisplay($t('HPcsret_9'))
    dialogs.SafeTools = false
    coolBye()
  } else {
    await ui.diagDisplay($t('HPopsret_' + status))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>