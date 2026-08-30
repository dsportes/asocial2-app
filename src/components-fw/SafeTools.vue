<!-- Bouton d'ouverture d'un panneau permettant d'ouvrir
tous les dialogues de gestion des "dsonnées de sécurité".
-->
<template>
<div>
  <btn-cond v-if="short" class="q-mb-sm" flat
    @ok="dialogs.SafeTools = true">
    <img :src="safebox" class="q-mr-xs" width="24px"/>
    <div>{{ $t('SFTtit') }}</div>
  </btn-cond>
  <btn-cond v-else color="none" @ok="dialogs.SafeTools = true" flat >
    <img :src="safebox" class="q-mx-sm" width="24px"/>
    <div>{{ $t('SFTtit') }}</div>
  </btn-cond>

  <dialog-std2 v-model="dialogs.SafeTools" :title="$t('SFTtit')" vue="SafeTools"
    @close="emit('close', true)">
    <template #hdr>
      <div :class="sty() + ' bordb'">
        <user-profile/>
      </div>
    </template>

    <template #default>

      <bar-open :bubble="$t('SFTalias_bub')" :disbubble="$t('SFTalias_bub')"
        :title="$t('SFTalias_label')"
        :disable="session.noNet"
        @open="dialogs.SafeCrA = true"/>

      <bar-open :bubble="$t('SFTphrase_bub')" :disbubble="$t('SFTphrase_bub')"
        :title="$t('SFTphrase_label')"
        :disable="session.noNet"
        @open="dialogs.SafeCrP = true"/>

      <q-separator color="primary" class="q-my-xs q-mx-lg"/>
      
      <bar-open v-if="sf.myTrusting === null" :bubble="$t('HPtrust_2')"
        :title="$t('HPtrust_1')"
        @open="dialogs.DevTrustit = true"/>

      <bar-open v-if="sf.myTrusting !== null" :bubble="$t('HPchgpin_2')"
        :title="$t('HPchgpin_1')"
        @open="dialogs.DevTrustit = true"/>

      <bar-open v-if="sf.myTrusting !== null" :bubble="$t('HPuntrust_2')"
        :title="$t('HPuntrust_1', [sf.devName])"
        @open="dialogs.DevUntrustit = true"/>

      <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
        :title="$t('HPtrustings_1')"
        :disable="session.noNet || session.noLocal"
        @open="dialogs.DevTrustings = true"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.noNet"
        :title="$t('HPmanusers')"
        @open="dialogs.ManageUsers = true"/>

      <q-separator color="primary" class="q-my-xs q-mx-lg"/>

      <bar-open :bubble="$t('CRRtit_bub')" :disbubble="$t('CRRtit_bub')"
        :title="$t('CRRtit_label')"
        :disable="session.noNet"
        @open="dialogs.CredsReview = true"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="session.noNet"
        @open="dialogs.PrefsMgr = true"/>

      <q-separator color="orange" class="q-my-xs"/>
      <div class="titre-md text-italic text-bold text-warning text-center">{{ $t('SFTopal') }}</div>

      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.noNet"
        :title="$t('HPexpsafe_1')"
        @open="dialogs.SafeExport = true"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.noNet"
        :title="$t('HPdelsafe_1')"
        @open="dialogs.delSafe = true"/>

    </template>
  </dialog-std2>

  <safe-cr v-if="dialogs.SafeCrA" v-model="dialogs.SafeCrA" mode="a" @close="fnc"/>
  <safe-cr v-if="dialogs.SafeCrP" v-model="dialogs.SafeCrP" mode="p" @close="fnc"/>
  <dev-trustit v-if="dialogs.DevTrustit" v-model="dialogs.DevTrustit" @close="fnc" @done="fnc"/>
  <dev-trustings v-if="dialogs.DevTrustings" v-model="dialogs.DevTrustings" @close="fnc"/>
  <manage-users v-if="dialogs.ManageUsers" v-model="dialogs.ManageUsers" @close="fnc" />
  <creds-review v-if="dialogs.CredsReview" v-model="dialogs.CredsReview" @close="fnc"/>
  <prefs-mgr v-if="dialogs.PrefsMgr" v-model="dialogs.PrefsMgr" @close="fnc"/>

  <safe-export v-if="dialogs.SafeExport" v-model="dialogs.SafeExport" @close="fnc" @done="fnc"/>

  <!-- Confirmation de destruction du safe -->
  <q-dialog v-if="dialogs.delSafe" v-model="dialogs.delSafe" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-img :src="skull" style="height: 128px; max-width: 128px"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('SFXskull_9')}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('SFXskull_8')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="dialogs.delSafe = false"/>
        <btn-cond :label="$t('iconfirm')" confirm @ok="delSafe"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Confirmation de perte de confiance du terminal -->
  <q-dialog v-if="dialogs.DevUntrustit" v-model="dialogs.DevUntrustit" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
      <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPuntrust_1', [sf.devName])}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="dialogs.DevUntrustit = false"/>
        <btn-cond :label="$t('iconfirm')" confirm @ok="untrustit"/>
      </div>
    </q-card>
  </q-dialog>

  <select-optionsdial v-if="dialogs.options" v-model="dialogs.options"/>

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { reactive } from 'vue'

import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import UserProfile from '../components-fw/UserProfile.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import PrefsMgr from '../dialogs-fw/PrefsMgr.vue'
import CredsReview from '../dialogs-fw/CredsReview.vue'
import ManageUsers from '../dialogs-fw/ManageUsers.vue'
import SafeCr from '../dialogs-fw/SafeCr.vue'
import DevTrustings from '../dialogs-fw/DevTrustings.vue'
import DevTrustit from '../dialogs-fw/DevTrustit.vue'
import SafeExport from '../dialogs-fw/SafeExport.vue'
import SelectOptionsdial from '../dialogs-fw/SelectOptionsdial.vue'

// @ts-ignore
import skull from '../assets/skull.png'

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
  CredsMgr: false,
  ListcredsMgr: false,
  CredsReview: false,
  ManageUsers: false,
  DevTrustings: false,
  DevTrustit: false,
  DevUntrustit: false,
  SafeExport: false,
  delSafe: false,
  options: false
})

const untrustit = async () => {
  try {
    const status = await sf.setUntrust()
    if (status)
      await ui.diagDisplay($t('HPstuntrust_' + status))
    dialogs.DevUntrustit = false
    fnc()
  } catch (e: any) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
    dialogs.DevUntrustit = false
  }
}

const fnc = () => {
  dialogs.SafeTools = false
  emit('close', true)
}

const delSafe = async () => {
  const status = await sf.delSafe()
  if (status === 0) {
    await ui.diagDisplay($t('SFXdel'))
    dialogs.SafeTools = false
    emit('close', true)
    ui.backToLogin()
  } else {
    if (status !== -1) await ui.diagDisplay($t('STSF_' + status))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordb { border-bottom: 1px solid $grey-5 }
</style>
