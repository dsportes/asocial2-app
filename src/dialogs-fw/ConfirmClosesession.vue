<!-- Dialogue sur APP de confirmation de "fermeture"
- confirmation de fermeture (fin d'édition)
- lisser ouvert (l'édition continue)
-->
<template>
  <q-dialog v-model="ui.appDialogs.ConfirmCloseSession" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">
          {{ ui.editingInCourse ? $t('closeCf') : $t('backopen')}}
        </q-toolbar-title>
      </q-toolbar>
      <sd-nb class="q-ma-sm q-my-md" :text="$t(ui.editingInCourse ? 'closeCf_label' : 'backopen_label')"/>
      <q-card-actions vertical align="center" class="titre-md q-gutter-sm">
        <btn-cond flat icon="logout" color="warning"
          :label="$t('closeCf_1')" @ok="ui.cfSessionClose"/>
        <btn-cond flat icon="arrow_forward"
          :label="$t('closeCf_2')" @ok="ui.appDialogs.ConfirmCloseSession = false"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import SdNb from '../components-fw/SdNb.vue'

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>