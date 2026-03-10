<template>
<dialog-std0 :title="$t('UPtitle')" v-model="ui.dModels['0'].userprofile">
<template #default>
  <div class="q-pa-sm column q-gutter-sm">
    <div class="row full-width items-center q-mt-md">
      <div class="col-6 text-right text-italic q-pr-md">{{$t('UPid')}}</div>
      <div class="col-6 font-mono fs-lg text-bold">{{sf.userId}}</div>
    </div>
    <div class="row full-width items-start">
      <div class="col-6 text-right text-italic q-pr-md">{{$t('UPpseudo')}}</div>
      <div class="col-6 font-mono text-bold">{{sf.userName || $t('UPnone')}}</div>
    </div>
    <div class="row full-width items-start">
      <div class="col-6 text-right text-italic q-pr-md">{{$t('UPcontact')}}</div>
      <div class="col-6 font-mono text-bold">{{sf.auth.contact || $t('UPnone')}}</div>
    </div>
    <div v-if="admins" class="row full-width items-start">
      <div class="col-6 text-right text-italic q-pr-md">{{$t('UPadmins')}}</div>
      <div class="col-6 font-mono text-bold">{{admins}}</div>
    </div>
    <div class="row full-width items-start">
      <div class="col-6 text-right text-italic q-pr-md">{{$t('UPsessionid')}}</div>
      <div class="col-6 font-mono text-bold">{{session.sessionId}}</div>
    </div>
  </div>
</template>
</dialog-std0>
</template>

<script setup lang="ts">
/*
  UPtitle: 'Profil utilisateur',
  UPid: 'ID',
  UPpseudo: 'Pseudo local à ce terminal',
  UPnone: '(aucun)',
  UPcontact: 'Pseudo ou phrase de contact externe',
  UPsessionid: 'ID de synchronisation de la session',
  UPadmins: 'Administrateur technique de :',
*/
// @ts-ignore
import { ref } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import DialogStd0 from '../components-fw/DialogStd0.vue'

const sf = stores.safe
// const config = stores.config
const session = stores.session
const ui = stores.ui

const admins = ref('')

if (sf.auth.admins) {
  let x = sf.auth.admins
  x.replaceAll('/', ' ')
  admins.value = x
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
