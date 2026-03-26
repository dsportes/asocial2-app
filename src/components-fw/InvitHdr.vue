<template>
<div>
  <div class="column full-width">
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

      <!-- UN sponsor peut ACCEPTER et transformer la demande en invitation 
        QUI est un SPONSOR autorisé à traiter la demande dépend de l'application 
        Au mlieu de valider il peut aussi REJETER la demande -->
      <btn-cond v-if="model.invit && model.invit.status === 1 && msgVal.ok" 
        :label="$t('INVac_ac')" icon="check" class="col-auto  q-ml-xs"
        @ok="dialogs.accept = true"/>
      <btn-cond v-if="model.invit && model.invit.status === 1 && msgVal.ok" 
        :label="$t('INVac_re')" icon="close" color="warning" class='col-auto q-ml-xs'
        @ok="dialogs.reject = true"/>

      <!-- L'utilisateur peut VALIDER ou DECLINER une invitation validée par un sponsor -->
      <btn-cond v-if="model.invit && model.invit.isU && model.invit.status === 2" 
        :label="$t('INVac_de')" icon="close" color="warning" class='col-auto q-ml-xs'
        @ok="dialogs.decline = true"/>
      <btn-cond v-if="model.invit && model.invit.isU && model.invit.status === 2" 
        :label="$t('INVac_va')" icon="check" class='col-auto q-ml-xs'
        @ok="doValidate"/>

    </q-toolbar>

    <div v-if="model.invit && model.invit.status === 1" class="row items-start">
      <btn-bubble :text="$t('INVsponsoring')" class="q-mr-md col-auto"/>
      <div :class="msgVal.ok ? 'col titre-sm text-italic' : 'col titre-md msg'">
        {{msgVal.txt}}
      </div>
    </div>
  </div>

  <dialog-std0 v-model="dialogs.reject" :title="$t('INVac_rej_1')" vue="InvitHdr"
    @close="txt = ''">
    <template #hdr>
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('INVac_rej_2', [min])}}</div>
        <btn-cond color="warning" :label="$t('INVac_re')"
          :disable="txt.length < min"
          @ok="doReject"/>
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
          @ok="doDecline"/>
      </div>
    </template>
    <template #default>
      <q-input class="q-pa-xs bord1" v-model="txt" type="textarea"
        borderless :rows="5"/>
    </template>
  </dialog-std0>

  <invit-acceptation v-if="dialogs.accept" v-model="dialogs.accept" :invit="model.invit"
    @done="doAccept" @close="dialogs.accept = false"/>

  <choose-it v-model="dialogs.confirmcancel"
    prefix="INVcancelCf" options="pw" 
    @giveup="dialogs.cancel = false"
    @option="doConfirmCancel"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'

import { $t, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import NavBar from '../components-fw/NavBar.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import InvitAcceptation from '../components/InvitAcceptation.vue'

const min = 10

const ui = stores.ui

const model = defineModel()

const msgVal = ref({ ok: true, txt: 'OK' })

const doMsgVal = async () => {
  if (model.value.invit && model.value.invit.status === 1)
    msgVal.value = await model.value.invit.msgVal()
}

onMounted(async () => { await doMsgVal() })

watch(() => model.value.invit, async () => { await doMsgVal() })

const nav = (n) => {
  const f = model.value['fnnav']
  if (f) f(n)
}

const dialogs = reactive({ 
  accept: false, reject: false, confirmcancel: false, decline: false
})

const txt = ref('')

// Confirmation de cancel
const doConfirmCancel = async (n) => {
  if (n === 1) {
    await model.value.invit.cancel()
    onUpdate()
  }
}

const doReject = async () => {
  dialogs.reject = false; 
  await model.value.invit.reject(txt.value)
  onUpdate()
}

const doDecline = async () => {
  dialogs.decline = false
  await model.value.invit.decline(txt.value)
  onUpdate()
}

// Retour du "done" du dialogue spécifique accept
const doAccept = async (accept: Accept) => {
  await model.value.invit.accept(accept)
  dialogs.accept = false
  onUpdate()
}

const doValidate = async () => {
  await model.value.invit.validate()
  onUpdate()
}

const onUpdate = () => {
  const f = model.value.fnOnUpdate
  if (f) f()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>