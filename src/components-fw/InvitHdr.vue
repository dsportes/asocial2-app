<template>
<div>
  <q-toolbar class="tbs dense row items-center">

    <nav-bar v-model="model" class="col-auto q-ma-xs" hasback
      @back="model.zoomed = false"
      @navigate="nav"/>

    <div v-if="model.invit" class="col titre-sm">
      {{$t('INVtitzoom', [$t('INV_' + model.invit.major)])}}
    </div>
    <div v-else class="col titre-md text-italic diag">{{$t('INVnotfound')}}</div>

    <!-- L'utilisateur peut ANNULER sa demande-->
    <btn-cond v-if="model.invit && model.invit.isU && model.invit.status === 1" 
      :label="$t('INVac_an')" icon="delete" class='col-auto q-ml-xs'
      @ok="dialogs.cancel = true"/>
    <!-- UN sponsor peut VALIDER et transformer la demande en invitation 
      QUI est un SPONSOR autorisé à traiter la demande dépend de l'application 
      Au mlieu de valider il peut aussi REJETER la demande -->
    <btn-cond v-if="model.invit && model.invit.status === 1" 
      :label="$t('INVac_va')" icon="check" class="col-auto  q-ml-xs"
      @ok="validate"/>
    <btn-cond v-if="model.invit && model.invit.status === 1" 
      :label="$t('INVac_re')" icon="close" color="warning" class='col-auto q-ml-xs'
      @ok="reject"/>
    <!-- L'utilisateur peut ACCEPTER ou DECLINER une invitation validée par un sponsor -->
    <btn-cond v-if="model.invit && model.invit.isU && model.invit.status === 2" 
      :label="$t('INVac_de')" icon="close" color="warning" class='col-auto q-ml-xs'
      @ok="dialogs.decline = true"/>
    <btn-cond v-if="model.invit && model.invit.isU && model.invit.status === 2" 
      :label="$t('INVac_ac')" icon="check" class='col-auto q-ml-xs'
      @ok="model.invit.accept"/>

  </q-toolbar>

  <dialog-std0 v-model="dialogs.reject" :title="$t('INVac_rej_1')" vue="InvitHdr"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_rej_2', [min])}}</div>
        <btn-cond color="warning" :label="$t('INVac_re')"
          :disable="txt.length < min"
          @ok="dialogs.reject = false; model.invit.reject(txt)"/>
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
          @ok="dialogs.decline = false; model.invit.decline(txt)"/>
      </div>
    </template>
    <template #default>
      <q-input class="q-pa-xs bord1" v-model="txt" type="textarea"
        borderless :rows="5"/>
    </template>
  </dialog-std0>

  <choose-it v-model="dialogs.cancel"
    prefix="INVcancelCf" options="pw" 
    @giveup="dialogs.cancel = false"
    @option="cancelCf"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'

import { $t, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import NavBar from '../components-fw/NavBar.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

const min = 10

const ui = stores.ui

const model = defineModel()

const nav = (n) => {
  const f = model.value['fnnav']
  if (f) f(n)
}

const validate = async () => {
  console.log(model.value.invit.invitId, 'validate dans InvitHdr')
  model.value.invit.validate()
}

const reject = async () => {
  console.log(model.value.invit.invitId, 'reject dans InvitHdr')
  dialogs.reject = true
}

const dialogs = reactive({ reject: false, decline: false, cancel: false })

const txt = ref('')

const cancelCf = async (n) => {
  if (n === 1) await model.value.invit.cancel()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>