<template>
<div>
  <div v-if="invit.isU && invit.status === 2" 
    class="row justify-end q-gutter-sm">
    <btn-cond :label="$t('INVac_de')" icon="close" color="warning"
      @ok="dialogs.decline = true"/>
    <btn-cond :label="$t('INVac_ac')" icon="check" 
      @ok="emit('accept', true)"/>
  </div>

  <div v-if="sponsor && invit.status === 1" 
    class="row justify-end q-gutter-sm">
    <btn-cond :label="$t('INVac_re')" icon="close" color="warning"
      @ok="dialogs.reject = true"/>
    <btn-cond :label="$t('INVac_va')" icon="check" 
      @ok="emit('validate', true)"/>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_major')}}</div>
    <div class='font-mono'>{{$t('INV_' + invit.major)}}</div>
  </div>

  <div v-if="invit.minor" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_minor')}}</div>
    <div class='font-mono'>{{invit.minor}}</div>
  </div>

  <div class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_time')}}</div>
    <div class='font-mono'>{{dhcool(invit.time * 1000)}}</div>
  </div>

  <div v-if="!invit.isU" class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_user')}}</div>
    <div class='font-mono'>
      <span>{{invit.userId}}</span>
      <span v-if="invit.safeStore" class="q-ml-md">[{{invit.safeStore}}]</span>
    </div>
  </div>

  <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtm')}}</div>
  <q-input class="q-pa-xs bord1" v-model="invit.txtm" type="textarea"
    readonly borderless :rows="5"/>

  <div v-if="invit.isSP || invit.isU">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_me')}}</div>
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txti')}}</div>
    <q-input class="q-pa-xs bord1" v-model="invit.txti" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="invit.status === 5">
    <div class='q-mt-sm titre-md text-italic'>{{$t('INVx_txtx')}}</div>
    <q-input class="q-pa-xs bord1" v-model="invit.txtx" type="textarea"
      readonly borderless :rows="5"/>
  </div>

  <div v-if="(invit.status === 2 || invit.status >= 4) && (invit.isSP || invit.isU)"
    class="q-mt-sm row items-center">
    <div class='titre-md text-italic q-mr-md'>{{$t('INVx_cred')}}</div>
    <div class='font-mono'>
      <span>{{invit.role}}</span>
      <span v-if="invit.docId" class="q-ml-md">[{{invit.docId}}]</span>
    </div>
  </div>

  <dialog-std0 v-model="dialogs.reject" :title="$t('INVac_rej_1')"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_rej_2', [min])}}
        <btn-cond color="warning" :label="$t('INVac_re')"
          :disable="txt.length < min"
          @ok="dialogs.reject = false; emit('reject', txt)"/>
      </div>
    </template>
    <template #default>
      <q-input class="q-pa-xs bord1" v-model="txt" type="textarea"
        borderless :rows="5"/>
    </template>
  </dialog-std0>

  <dialog-std0 v-model="dialogs.decline" :title="$t('INVac_dec_1')"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_dec_2', [min])}}
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
import { ref, reactive, watch } from 'vue'

import { $t, dhcool } from '../src-fw/util'

const emit = defineEmits(['reject', 'decline', 'accept', 'validate'])

const props = defineProps({
  invit: Object, // Objet Invitation
  sponsor: Boolean // true si le user est un SPONSOR qui PEUT valider / refuse
})

const dialogs = reactive({ reject: false, decline: false })

const txt = ref('')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>