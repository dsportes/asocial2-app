<template>
<div>
  <q-toolbar class="tbp">
    <btn-cond v-if="back" color="warning" size="md" icon="chevron_left"
      @ok="emit('back', true)" :label="$t(back)"/>
    <q-toolbar-title class="titre-sm">
      {{$t('INVtitzoom', [$t('INV_' + invit.major)])}}
    </q-toolbar-title>
    <btn-cond v-if="invit.isU && invit.status === 2" 
      :label="$t('INVac_de')" icon="close" color="warning" class='q-mr-xs'
      @ok="dialogs.decline = true"/>
    <btn-cond v-if="invit.isU && invit.status === 2" 
      :label="$t('INVac_ac')" icon="check" class='q-mr-xs'
      @ok="emit('accept', true)"/>
    <btn-cond v-if="sponsor && invit.status === 1" 
      :label="$t('INVac_re')" icon="close" color="warning" class='q-mr-xs'
      @ok="dialogs.reject = true"/>
    <btn-cond v-if="sponsor && invit.status === 1" 
      :label="$t('INVac_va')" icon="check" 
      @ok="emit('validate', true)"/>
  </q-toolbar>

  <dialog-std0 v-model="dialogs.reject" :title="$t('INVac_rej_1')" vue="InvitHdr"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_rej_2', [min])}}</div>
        <btn-cond color="warning" :label="$t('INVac_re')"
          :disable="txt.length < min"
          @ok="dialogs.reject = false; emit('reject', txt)"/>
      </div>
    </template>
    <template #default>
      <q-input class="q-my-sm q-pa-xs bord1" v-model="txt" type="textarea"
        borderless :rows="8"/>
    </template>
  </dialog-std0>

  <dialog-std0 v-model="dialogs.decline" :title="$t('INVac_dec_1')" vue="InvitHdr"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_dec_2', [min])}}</div>
        <btn-cond color="warning" :label="$t('INVac_de')"
          :disable="txt.length < min"
          @ok="dialogs.decline = false; emit('decline', txt)"/>
      </div>
    </template>
    <template #default>
      <q-input class="q-pa-xs bord1" v-model="txt" type="textarea"
        borderless :rows="5"/>
    </template>
  </dialog-std0>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'

import { $t, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const min = 10

const emit = defineEmits(['back', 'reject', 'decline', 'accept', 'validate'])

const props = defineProps({
  invit: Object, // Objet Invitation
  back: String, // si bouton "back", code i18n de son label
  sponsor: Boolean // true si le user est un SPONSOR qui PEUT valider / refuse
})

const dialogs = reactive({ reject: false, decline: false })

const txt = ref('')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>