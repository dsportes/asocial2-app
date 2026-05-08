<!-- Bouton d'ouverture d'un panneau permettant d'ouvrir
tous les dialogues de gestion des "dsonnées de sécurité".
-->
<template>
<div>
  <btn-cond v-if="short" class="q-mb-sm" flat color="primary"
    @ok="dialogs.SafeTools = true">
    <img :src="safebox" class="q-mr-xs" width="24px"/>
    <div>{{ $t('SFTtits') }}</div>
  </btn-cond>
  <btn-cond v-else :label="$t('SFTtit')" flat color="none"
    @ok="dialogs.SafeTools = true"/>

  <dialog-std0 v-model="dialogs.SafeTools" :title="$t('SFTtit')" vue="SafeTools"
    vh="90" @close="emit('close', true)">
    <template #default>
      <user-profile/>
      <q-separator color="orange" class="q-my-xs"/>

      <bar-open :bubble="$t('SFTalias_bub')" :disbubble="$t('SFTalias_bub')"
        :title="$t('SFTalias_label')"
        :disable="!session.hasNet"
        @open="dialogs.SafeCrA = true"/>

      <bar-open :bubble="$t('SFTphrase_bub')" :disbubble="$t('SFTphrase_bub')"
        :title="$t('SFTphrase_label')"
        :disable="!session.hasNet"
        @open="dialogs.SafeCrP = true"/>

      <bar-open v-if="trustingMe === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPtrust_1')"
        @open="dialogs.DevTrustit = true"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPchgpin_1')"
        @open="dialogs.DevTrustit = true"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPuntrust_1')"
        @open="openUntrust"/>

      <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
        :title="$t('HPtrustings_1')"
        :disable="!session.hasNet || session.incognito"
        @open="dialogs.DevTrustings = true"/>
        
      <bar-open :bubble="$t('HPadminA_bub')" :disbubble="$t('HPadminA_bub')"
        :title="$t('HPadminA_label')"
        :disable="!session.hasNet"
        @open="dialogs.AdminMgr = true"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPmanusers')"
        @open="dialogs.ManageUsers = true"/>

      <q-separator clor="blue" class="q-my-sm"/>

      <bar-open :bubble="$t('CRRtit_bub')" :disbubble="$t('CRRtit_bub')"
        :title="$t('CRRtit_label')"
        :disable="!session.hasNet"
        @open="dialogs.CredsReview = true"/>

      <bar-open :bubble="$t('SESconfig')" :disbubble="$t('SESconfig')"
        :title="$t('SESconfig')"
        :disable="!session.hasNet"
        @open="dialogs.CredsMgr = true"/>

      <bar-open :bubble="$t('LCRtit_bub')" :disbubble="$t('LCRtit_bub')"
        :title="$t('LCRtit_label')"
        :disable="!session.hasNet"
        @open="dialogs.ListcredsMgr = true"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="!session.hasNet || session.incognito"
        @open="dialogs.PrefsMgr = true"/>

      <q-separator color="orange" class="q-mx-lg q-my-xs"/>
      <div class="titre-md text-italic text-bold text-warning">{{ $t('SFTopal') }}</div>

      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPexpsafe_1')"
        @open="dialogs.ExportSafe = true"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.incognito || !session.hasNet"
        :title="$t('HPdelsafe_1')"
        @open="dialogs.delsafe = true"/>

    </template>
  </dialog-std0>

  <safe-cr v-if="dialogs.SafeCrA" v-model="dialogs.SafeCrA" mode="a" @close="fnc"/>
  <safe-cr v-if="dialogs.SafeCrP" v-model="dialogs.SafeCrP" mode="p" @close="fnc"/>
  <dev-trustit v-if="dialogs.DevTrustit" v-model="dialogs.DevTrustit" @close="fnc" @done="fnc"/>
  <dev-untrustit v-if="dialogs.DevUntrustit" v-model="dialogs.DevUntrustit" @close="fnc" @done="fnc"/>
  <dev-trustings v-if="dialogs.DevTrustings" v-model="dialogs.DevTrustings" @close="fnc"/>
  <admin-mgr v-if="dialogs.AdminMgr" v-model="dialogs.AdminMgr" @close="fnc"/>
  <manage-users v-if="dialogs.ManageUsers" v-model="dialogs.ManageUsers" @close="fnc" />

  <creds-review v-if="dialogs.CredsReview" v-model="dialogs.CredsReview" @close="fnc"/>
  <!--creds-mgr v-if="dialogs.CredsMgr" v-model="dialogs.CredsMgr" @close="fnc"/-->
  <listcreds-mgr v-if="dialogs.ListcredsMgr" v-model="dialogs.ListcredsMgr" @close="fnc"/>
  <prefs-mgr v-if="dialogs.PrefsMgr" v-model="dialogs.PrefsMgr" @close="fnc"/>

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
        <btn-cond :label="$t('iconfirm')" confirm @ok="delSafe"/>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t, sty, coolBye } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import UserProfile from '../components-fw/UserProfile.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import PrefsMgr from '../dialogs-fw/PrefsMgr.vue'
import AdminMgr from '../dialogs-fw/AdminMgr.vue'
import ListcredsMgr from '../dialogs-fw/ListcredsMgr.vue'
import CredsReview from '../dialogs-fw/CredsReview.vue'
import ManageUsers from '../dialogs-fw/ManageUsers.vue'
import SafeCr from '../dialogs-fw/SafeCr.vue'
import DevTrustings from '../dialogs-fw/DevTrustings.vue'
import DevTrustit from '../dialogs-fw/DevTrustit.vue'
import DevUntrustit from '../dialogs-fw/DevUntrustit.vue'
import SafeExport from '../dialogs-fw/SafeExport.vue'

// @ts-ignore
import safebox from '../assets/safe-box.png'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const emit = defineEmits(['close'])
const props = defineProps({
  short: Boolean
})
const dialogs = reactive({
  SafeCrA: false,
  SafeCrP: false,
  SafeTools: false,
  PrefsMgr: false,
  AdminMgr: false,
  ContactMgr: false,
  CredsMgr: false,
  ListcredsMgr: false,
  CredsReview: false,
  ManageUsers: false,
  DevTrustings: false,
  DevTrustit: false,
  DevUntrustit: false,
  SafeExport: false,
  delSafe: false
})

const trustingMe = computed(() => sf.myTrusting )

const openUntrust = async () => {
  await sf.getMySessions()
  dialogs.DevUntrustit = true
}

const fnc = () => {
  dialogs.SafeTools = false
  emit('close', true)
}

const delSafe = async () => {
  const status = await sf.delSafe()
  if (status === 0) {
    await ui.diagDisplay($t('HPcsret_9'), true)
    dialogs.SafeTools = false
    coolBye()
  } else {
    await ui.diagDisplay($t('HPopsret_' + status), true)
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
