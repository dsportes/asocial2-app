<!-- Dialogue sur APP de confirmation de "fermeture"
- confirmation de fermeture (fin d'édition)
- lisser ouvert (l'édition continue)
-->
<template>
  <q-dialog v-model="ui.appDialogs.ConfirmClose" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('closeCf')}}</q-toolbar-title>
      </q-toolbar>
      <sd-nb class="q-ma-sm q-my-md" :text="$t('closeCf_label')"/>
      <q-card-actions vertical align="center" class="titre-md q-gutter-sm">
        <btn-cond flat icon="logout" color="warning"
          :label="$t('closeCf_1')" @ok="ui.resolveEditing(true)"/>
        <btn-cond flat icon="arrow_forward"
          :label="$t('closeCf_2')" @ok="ui.resolveEditing(false)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>