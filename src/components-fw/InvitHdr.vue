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

    </q-toolbar>
    <q-toolbar class="tbs dense row items-center">
      <q-space/>
      <!-- L'utilisateur peut ANNULER sa demande-->
      <btn-cond v-if="isU" 
        :label="$t('INVbtn_del')" icon="delete" class='col-auto q-ml-xs'
        @ok="dialogs.confirmcancel = true"/>

      <!-- L'utilisateur peut éditer sa demande-->
      <btn-cond v-if="isU && !chgU"
        :label="$t('INVbtn_rec')" icon="check" class="col-auto  q-ml-xs"
        @ok="nothingToSave"/>

      <btn-cond v-if="isU && chgU"
        :label="$t('INVbtn_rec')" icon="check" class="col-auto  q-ml-xs"
        @ok="dialogs.confirmrec = true"/>

      <!-- L'utilisateur peut valider sa demande-->
      <btn-cond v-if="isU"  :disable=" model.invit.etc === null"
        :label="$t('INVbtn_val')" icon="check" class="col-auto  q-ml-xs"
        @ok="dialogs.confirmval = true"/>

      <!-- un sponsor peut traiter la demande -->
      <btn-cond v-if="!isU && msgVal.ok" 
        :label="$t('INVbtn_edt')" icon="edit" class="col-auto  q-ml-xs"
        @ok="dialogs.editS = true"/>

    </q-toolbar>

    <div v-if="!isU" class="row items-start">
      <btn-bubble :text="$t('INVsponsoring')" class="q-mr-md col-auto"/>
      <div :class="msgVal.ok ? 'col titre-sm text-italic' : 'col titre-md msg'">
        {{msgVal.txt}}
      </div>
    </div>

    <div v-if="isU" class="row items-start">
      <btn-bubble :text="$t('INVvalidable')" class="q-mr-md col-auto"/>
      <div :class="model.invit.etc !== null ? 'col titre-md text-italic' : 'col titre-md msg'">
        {{$t('INVval_' + (model.invit.etc !== null ? 'y' : 'n'))}}
      </div>
    </div>
  </div>

  <invit-acceptation v-if="dialogs.editS" v-model="dialogs.editS" :invit="model.invit"
    @done="doAccept" @close="dialogs.editS = false"/>

  <choose-it v-model="dialogs.confirmcancel"
    prefix="INVcancelCf" options="pw" 
    @giveup="dialogs.cancel = false"
    @option="doConfirmCancel"/>

  <choose-it v-model="dialogs.confirmval"
    prefix="INVvalCf" options="pw" 
    @giveup="dialogs.confirmval = false"
    @option="doConfirmVal"/>

  <choose-it v-model="dialogs.confirmrec"
    prefix="INVrecCf" options="pw" 
    @giveup="dialogs.confirmrec = false"
    @option="doConfirmRec"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'

import { $t } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import NavBar from '../components-fw/NavBar.vue'

import InvitAcceptation from '../components/InvitAcceptation.vue'

const min = 10

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const isU = computed(() => model.value.invit && model.value.invit.userId === sf.userId)
const chgU = computed(() => isU.value && model.value.newTab 
  && model.value.newTab !== model.value.invit.tab
)

const nothingToSave = async () => {
  ui.diagDisplay($t('INVnchU'), true)
}

const msgVal = ref({ ok: false, txt: 'KO' })

const init = async () => {
  if (!isU.value) msgVal.value = await model.value.invit.msgVal()
}

onMounted(async () => { await init() })

watch(() => model.value.invit, async () => { await init() })

const nav = (n) => {
  const f = model.value['fnnav']
  if (f) f(n)
}

const dialogs = reactive({ 
  confirmrec: false, confirmval: false, confirmcancel: false, editS: false
})

const txt = ref('')

// Confirmation de cancel
const doConfirmCancel = async (n) => {
  if (n === 1) {
    // TODO
    // await model.value.invit.cancel()
    // onUpdate()
  }
}

// Confirmation de validation
const doConfirmVal = async (n) => {
  if (n === 1) {
    // TODO
    // await model.value.invit.cancel()
    // onUpdate()
  }
}

// Confirmation de validation
const doConfirmRec = async (n) => {
  if (n === 1) {
    // TODO
    // await model.value.invit.cancel()
    // onUpdate()
  }
}

const onUpdate = () => {
  const f = model.value.fnOnUpdate
  if (f) f()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>