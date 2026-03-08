<template>
<div>
  <btn-cond :label="$t('SFTtit')" flat color="none"
    @ok="ui.oD(idc, 'safetools')"/>

  <dialog-std0 v-model="ui.dModels[idc].safetools" :title="$t('SFTtit')"
    @close="emit('close', null)">
    <template #default>
      <!--
      <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')"
        :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
        :fnopen="openChgCodes" size="sm"/>

      <bar-open v-if="trustingMe === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
        :fnopen="openTrust" size="sm"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
        :fnopen="openTrust" size="sm"/>

      <bar-open v-if="trustingMe !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')"
        :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
        :fnopen="openUntrust" size="sm"/>

      <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
        :title="$t('HPtrustings_1')"
        :disable="!session.hasNet || session.incognito || sf.openMode > 2"
        :fnopen="openTrustings" size="sm"/>
    -->

      <bar-open :bubble="$t('SESconfig')" :disbubble="$t('SESconfig')"
        :title="$t('SESconfig')"
        :disable="!session.hasNet"
        :fnopen="credsmgr" size="sm"/>

      <bar-open :bubble="$t('HPadmin_bub')" :disbubble="$t('HPadmin_bub')"
        :title="$t('HPadmin_label')"
        :disable="!session.hasNet"
        :fnopen="adminmgr" size="sm"/>

      <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
        :title="$t('HPprefs_1')"
        :disable="!session.hasNet || session.incognito"
        :fnopen="prefsmgr" size="sm"/>

      <bar-open :bubble="$t('HPmanuinfo')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPmanusers')" :fnopen="manusers"/>
      <!--
      <bar-open :bubble="$t('HPexpsafe_2')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPexpsafe_1')" :fnopen="exportSafe"/>

      <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
        :disable="session.incognito || !session.hasNet" size="sm"
        :title="$t('HPdelsafe_1')" :fnopen="opDelSafe"/>
      -->
    </template>
  </dialog-std0>

  <creds-mgr :idc="idc" @close="fnc"/>
  <prefs-mgr :idc="idc" @close="fnc"/>
  <admin-mgr :idc="idc" @close="fnc"/>
  <manage-users :idc="idc" @close="fnc" />

</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'

import stores from '../stores/all'
import DialogStd0 from '../components-fw/DialogStd0.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import PrefsMgr from '../components-fw/PrefsMgr.vue'
import AdminMgr from '../components-fw/AdminMgr.vue'
import CredsMgr from '../components-fw/PrefsMgr.vue'
import ManageUsers from '../components-fw/ManageUsers.vue'

const ui = stores.ui
const session = stores.session

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const emit = defineEmits(['close'])

const fnc = () => {
  ui.fD()
}

const credsmgr = () => { ui.oD('0', 'credsmgr') }
const adminmgr = () => { ui.oD(idc, 'adminmgr') }
const prefsmgr = () => { ui.oD(idc, 'prefsmgr') }
const manusers = () => { ui.oD(idc, 'manusers') }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>