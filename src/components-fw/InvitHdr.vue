<template>
<div>
  <div class="column full-width">
    <div class="tbs row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="model.zoomed = false"/>
      <div v-if="model.invit" class="titre-sm q-mr-xs">
        {{$t('INVtitzoom', [model.invit.$t()])}}</div>
      <div v-else class="titre-md text-italic diag q-mr-xs">
        {{$t('INVnotfound')}}</div>
    </div>

    <div class="tbs row items-center q-gutter-xs justify-end">
      <!-- L'utilisateur peut ANNULER sa demande-->
      <btn-cond :label="$t('INVbtn_del')" icon="delete" class='col-auto q-ml-xs'
        @ok="dialogs.confirmcancel = true"/>

      <!-- L'utilisateur peut éditer sa demande-->
      <btn-cond :label="$t('INVbtn_rec')" icon="edit" class="col-auto q-ml-xs"
        @ok="dialogs.tabedit = true"/>

      <!-- L'utilisateur peut valider sa demande-->
      <btn-cond :disable=" model.invit.etc === null"
        :label="$t('INVbtn_val')" icon="check" class="col-auto  q-ml-xs"
        @ok="dialogs.validate = true"/>
    </div>

    <div class="row items-start q-my-sm">
      <btn-bubble :text="$t('INVvalidable')" class="q-mr-md col-auto"/>
      <div :class="model.invit.etc !== null ? 'col titre-md text-italic' : 'col titre-md msg'">
        {{$t('INVval_' + (model.invit.etc !== null ? 'y' : 'n'))}}
      </div>
    </div>
    
  </div>

  <choose-it v-model="dialogs.confirmcancel"
    prefix="INVcancelCf" options="pw" 
    @giveup="dialogs.cancel = false"
    @option="doConfirmCancel"/>

  <dialog-std0 v-if="dialogs.tabedit" v-model="dialogs.tabedit" width="pwsm" vh="80"
    :title="$t('INVtabedit')" hdrclass="tbs" vue="InvitZoom">
    <template #hdr>
      <div class="row justify-between items-center">
        <btn-cond :label="$t('giveup')" icon="close" 
          @ok="dialogs.tabedit = false" />
        <btn-cond :label="$t('validate')" icon="check" @ok="tabchange"
          color="warning" :disable="!chgU"/>
      </div>
    </template>
    <template #default>
      <invit-zoom editable/>
    </template>
  </dialog-std0>

  <invit-validate v-if="dialogs.validate" v-model="dialogs.validate" :invit="model.invit"
    @validate="doValidate" @close="dialogs.validate = false"/>

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
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'
import InvitValidate from '../components/InvitValidate.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const chgU = computed(() => model.value.newTab && model.value.newTab !== model.value.invit.tab)

/*
const isU = computed(() => model.value.invit && model.value.invit.userId === sf.userId)
const msgVal = ref({ ok: false, txt: 'KO' })
const init = async () => {
  if (!isU.value) msgVal.value = await model.value.invit.msgVal()
}
onMounted(async () => { await init() })
watch(() => model.value.invit, async () => { await init() })
*/

const dialogs = reactive({ 
  confirmcancel: false, 
  tabedit: false, 
  validate: false, 
  sponsor: false
})

// Confirmation de cancel
const doConfirmCancel = async (n: number) => {
  if (n === 1) {
    if (await model.value.invit.cancel())
      onUpdate()
  }
}

// Validation
const doValidate = async (args: any) => {
  dialogs.validate = false
  if (await model.value.invit.validate(args))
    onUpdate()
}

/* Invitation par un sponsor */
const doInvitation = async (args: any) => {
  dialogs.sponsor = false
  if (await model.value.invit.invitation(args))
    onUpdate()
}

const tabchange = async () => {
  if (await model.value.invit.updateByU(model.value.newTab)) {
    onUpdate()
  }
}

// Confirmation de maj ardoise
const doConfirmRec = async (n: number) => {
  if (n === 1) {
    if (await model.value.invit.updateByU(model.value.newTab))
      onUpdate()
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