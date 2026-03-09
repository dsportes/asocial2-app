<template>
<div>
  <btn-cond :label="$t('SFTtit')" flat color="none"
    @ok="ui.oD(myidc, 'safetools')"/>

  <dialog-std0 v-model="ui.dModels[myidc].safetools" :title="$t('SFTtit')"
    @close="emit('close', myidc)">
    <template #default>
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

      <!--
      <bar-open :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
        @open="ui.oD(myidc, 'trustings')" size="sm"/>
      
      <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
        @open="openTrust" size="sm"/>

    -->

      <bar-open :bubble="$t('SESconfig')" :disbubble="$t('SESconfig')"
        :title="$t('SESconfig')"
        :disable="!session.hasNet"
        @open="ui.oD(myidc, 'credsmgr')" size="sm"/>

      <bar-open :bubble="$t('HPadmin_bub')" :disbubble="$t('HPadmin_bub')"
        :title="$t('HPadmin_label')"
        :disable="!session.hasNet"
        @open=" ui.oD(myidc, 'adminmgr')" size="sm"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="!session.hasNet || session.incognito"
        @open=" ui.oD(myidc, 'prefsmgr')" size="sm"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPmanusers')" 
        @open="ui.oD(myidc, 'manusers')"/>
      <!--
      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPexpsafe_1')" 
        @open="exportSafe"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPdelsafe_1')" 
        @open="opDelSafe"/>
      -->
    </template>
  </dialog-std0>

  <!-- Enregistrement / Changement des codes -->
  <creds-mgr :idc="myidc" @close="fnc"/>
  <prefs-mgr :idc="myidc" @close="fnc"/>
  <admin-mgr :idc="myidc" @close="fnc"/>
  <manage-users :idc="myidc" @close="fnc" />
  <safe-cr :idc="myidc" :mode="1" @close="fnc"/>
  <dev-trustings :idc="myidc" @close="fnc"/>
  <dev-trustit :idc="myidc" @close="fnc" @done="fnc"/>
  <dev-untrustit :idc="myidc" @close="fnc" @done="fnc"/>

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { computed, onUnmounted } from 'vue'

import stores from '../stores/all'
import DialogStd0 from '../components-fw/DialogStd0.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import PrefsMgr from '../components-fw/PrefsMgr.vue'
import AdminMgr from '../components-fw/AdminMgr.vue'
import CredsMgr from '../components-fw/CredsMgr.vue'
import ManageUsers from '../components-fw/ManageUsers.vue'
import SafeCr from '../components-fw/SafeCr.vue'
import DevTrustings from '../components-fw/DevTrustings.vue'
import DevTrustit from '../components-fw/DevTrustit.vue'
import DevUntrustit from '../components-fw/DevUntrustit.vue'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const myidc = ui.getIdc('SafeTools')
onUnmounted(() => ui.closeVue(myidc.value))

const emit = defineEmits(['close'])

const trustingMe = computed(() => sf.myTrusting )

const openUntrust = async () => {
  await sf.getMySessions()
  ui.oD(myidc, 'untrustit')
}

const fnc = (st) => {
  ui.fD()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>