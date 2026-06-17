<template>
<div>
  <div class="column full-width">
    <div class="tbs row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="ui.currentEvent.zoomed = false"/>
      <btn-cond :label="$t('FORMnewd')" icon="add" class='col-auto q-ma-xs'
        @ok="dialogs.newdemand = true"/>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newdemand" v-model="dialogs.newdemand" width="pwsm" vh="80"
    :title="$t('FORMnewd')" hdrclass="tbs" vue="DemandsHdr">
    <template #hdr>
      <div class="row justify-between items-center">
        <btn-cond :label="$t('giveup')" icon="close" 
          @ok="dialogs.tabedit = false" />
        <btn-cond :label="$t('validate')" icon="check" @ok="tabchange"
          :disable="true"/>
      </div>
    </template>
    <template #default>
      <form-zoom/>
    </template>
  </dialog-std0>

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
import FormZoom from '../components-fw/FormZoom.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()

const chgU = computed(() => model.value.newTab && model.value.newTab !== model.value.cas.tab)

/*
const isU = computed(() => model.value.cas && model.value.cas.userId === sf.userId)
const msgVal = ref({ ok: false, txt: 'KO' })
const init = async () => {
  if (!isU.value) msgVal.value = await model.value.cas.msgVal()
}
onMounted(async () => { await init() })
watch(() => model.value.cas, async () => { await init() })
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
    if (await model.value.cas.cancel())
      onUpdate()
  }
}

// Validation
const doValidate = async (args: any) => {
  dialogs.validate = false
  if (await model.value.cas.validate(args)) 
    onUpdate()
}

/* Invitation par un sponsor */
const doInvitation = async (args: any) => {
  dialogs.sponsor = false
  if (await model.value.cas.invitation(args))
    onUpdate()
}

const tabchange = async () => {
  if (await model.value.cas.updateByU(model.value.newTab)) {
    onUpdate()
  }
}

// Confirmation de maj ardoise
const doConfirmRec = async (n: number) => {
  if (n === 1) {
    if (await model.value.cas.updateByU(model.value.newTab))
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