<template>
<div>
  <div class="column full-width">
    <q-toolbar class="tbs dense row items-center">

      <nav-bar v-model="model" class="col-auto q-ma-xs" hasback
        @back="model.zoomed = false"
        @navigate="nav"/>

      <div v-if="model.invit" class="col titre-sm">
        {{$t('INVtitzoom', [model.invit.$t])}}
      </div>
      <div v-else class="col titre-md text-italic diag">{{$t('INVnotfound')}}</div>

    </q-toolbar>
    <q-toolbar class="tbs dense row items-center">
      <q-space/>
      <!-- L'utilisateur peut ANNULER sa demande-->
      <btn-cond :label="$t('INVbtn_del')" icon="delete" class='col-auto q-ml-xs'
        @ok="dialogs.confirmcancel = true"/>

      <!-- L'utilisateur peut éditer sa demande-->
      <btn-cond v-if="isU"
        :label="$t('INVbtn_rec')" icon="edit" class="col-auto q-ml-xs"
        @ok="dialogs.tabedit = true"/>

      <!-- L'utilisateur peut valider sa demande-->
      <btn-cond v-if="isU" :disable=" model.invit.etc === null"
        :label="$t('INVbtn_val')" icon="check" class="col-auto  q-ml-xs"
        @ok="dialogs.confirmval = true"/>

      <!-- un sponsor peut traiter la demande 
      <btn-cond v-if="!isU && msgVal.ok" 
        :label="$t('INVbtn_edt')" icon="edit" class="col-auto  q-ml-xs"
        @ok="dialogs.editS = true"/>
      -->
    </q-toolbar>
    <!--
    <div v-if="!isU" class="row items-start q-my-sm">
      <btn-bubble :text="$t('INVsponsoring')" class="q-mr-md col-auto"/>
      <div :class="msgVal.ok ? 'col titre-sm text-italic' : 'col titre-md msg'">
        {{msgVal.txt}}
      </div>
    </div>

    <div v-if="isU" class="row items-start q-my-sm">
      <btn-bubble :text="$t('INVvalidable')" class="q-mr-md col-auto"/>
      <div :class="model.invit.etc !== null ? 'col titre-md text-italic' : 'col titre-md msg'">
        {{$t('INVval_' + (model.invit.etc !== null ? 'y' : 'n'))}}
      </div>
    </div>
    -->
  </div>

  <choose-it v-model="dialogs.confirmcancel"
    prefix="INVcancelCf" options="pw" 
    @giveup="dialogs.cancel = false"
    @option="doConfirmCancel"/>

  <dialog-std0 v-if="dialogs.tabedit" v-model="dialogs.tabedit" width="pwsm"
    :title="$t('INVtabedit')" hdrclass="tbs" vue="InvitZoom">
    <template #default>
      <invit-zoom editable @tabchange="tabchange"/>
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
import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'

// import InvitSponsor from '../components/InvitSponsor.vue'
import InvitValidate from '../components/InvitValidate.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const isU = computed(() => model.value.invit && model.value.invit.userId === sf.userId)
const chgU = computed(() => isU.value && model.value.newTab 
  && model.value.newTab !== model.value.invit.tab
)

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

// Invitation par un sponsor
const doInvitation = async (args: any) => {
  dialogs.sponsor = false
  if (await model.value.invit.invitation(args))
    onUpdate()
}

const tabchange = async (newTab: string) => {
  if (await model.value.invit.updateByU(newTab)) {
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