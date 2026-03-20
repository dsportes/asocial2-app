<template>
<dialog-std2 v-model="model"  vue="ContactMgr"
  :title="$t('HPadminC_label')" tbclass="tbs">
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-sm">
      <btn-cond flat size="lg" icon="check" color="warning"
        :label="$t('validate')" @ok="validate"
        :disable="disval()"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">

    <div class="pwsm q-pa-xs column items-center">
      <input-a class="q-my-md full-width" prefix="HPctc" :initval="ctcav"
        v-model="ctc" @validate="setContact" size="contact"
        :valctrl="chCtc"/>
      <btn-cond class="q-my-md" :label="$t('HPctc_del')"
        icon="delete" color="warning"
        :disable="!ctcav"
        @ok="ctc = ''; setContact()"/>
    </div>

  </div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'

import InputA from '../components-fw/InputA.vue'
import BtnCond from '../components-fw/BtnCond.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui
const config = stores.config
const model = defineModel()

const emit = defineEmits(['done'])
watch(model, (v: boolean) => { if (v) init() })
const init = () => {
  resetCtc()
}

const chCtc = () => ctc.value !== ctcav.value
const disval = () => ctc.value.length < config.K.sizes.contact[0] || !chCtc()

const ctcav = ref('')
const ctc = ref('')

const resetCtc = () => {
  ctcav.value = sf.auth.contact
  ctc.value = ctcav.value || ''
}

const validate = async () => {
  await sf.setContact(ctc.value)
  await ui.diagDisplay($t('recorded'))
  resetCtc()
  emit('done', 'ContactMgr')
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-top { border-top: 1px solid $grey-5; }
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.bord2g { border: 1px solid $green-5; }
.select:hover { background-color: $yellow-2; color: black; }
</style>
