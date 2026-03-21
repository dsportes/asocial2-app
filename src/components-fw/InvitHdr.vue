<template>
<div>
  <q-toolbar class="tbs dense row items-center">
    <nav-bar v-model="model" class="col-auto q-ma-xs" hasback
      @back="model.zoomed = false"
      @navigate="nav"/>
    <div v-if="model.invit" class="col row">
      <div class="col titre-sm">
        {{$t('INVtitzoom', [$t('INV_' + model.invit.major)])}}
      </div>
      <btn-cond v-if="model.invit.isU && model.invit.status === 1" 
        :label="$t('INVac_an')" icon="delete" class='col-auto q-mr-xs'
        @ok="fn('cancel')"/>
      <btn-cond v-if="model.invit.isU && model.invit.status === 2" 
        :label="$t('INVac_de')" icon="close" color="warning" class='col-auto q-mr-xs'
        @ok="dialogs.decline = true"/>

      <btn-cond v-if="model.invit.isU && model.invit.status === 2" 
        :label="$t('INVac_ac')" icon="check" class='col-auto q-mr-xs'
        @ok="fn('accept')"/>
      <btn-cond v-if="model.invit.status === 1" 
        :label="$t('INVac_re')" icon="close" color="warning" class='col-auto q-mr-xs'
        @ok="dialogs.reject = true"/>
      <btn-cond v-if="model.invit.status === 1" 
        :label="$t('INVac_va')" icon="check" class="col-auto "
        @ok="fn('validate')"/>
    </div>
    <div v-else class="col titre-md text-italic diag">{{$t('INVnotfound')}}</div>
  </q-toolbar>

  <dialog-std0 v-model="dialogs.reject" :title="$t('INVac_rej_1')" vue="InvitHdr"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_rej_2', [min])}}</div>
        <btn-cond color="warning" :label="$t('INVac_re')"
          :disable="txt.length < min"
          @ok="dialogs.reject = false; fn('reject', txt)"/>
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
          @ok="dialogs.decline = false; fn('decline', txt)"/>
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
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'

import { $t, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import NavBar from '../components-fw/NavBar.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const min = 10

const model = defineModel()

const nav = (n) => {
  const f = model.value['fnnav']
  if (f) f(n)
}

const fn = (n) => {
  const f = model.value['fn' + n]
  if (f) f()
}

const dialogs = reactive({ reject: false, decline: false })

const txt = ref('')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>