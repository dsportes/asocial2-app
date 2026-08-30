<template>
  <dialog-std0 v-model="model" vh="75"
    @close="checkCloseOptions" 
    :title="$t('OPTStitle_2')"
    :help="$t('OPTStitle_bub')">
    <template #btn>
      <btn-cond :label="$t('OPTSok_2')" padding="none xs" 
        :disable="!session.haschgOptions"
        @ok="okOptions"/>
    </template>
    <template #default>
      <select-options class="q-pa-xs"/>
    </template>
  </dialog-std0>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import SelectOptions from '../components-fw/SelectOptions.vue'

const session = stores.session
const ui = stores.ui
const model = defineModel()

const okOptions = () => {
  session.okOptions = session.okOptions + 1
}

const checkCloseOptions = async () => {
  if (await ui.mayClose()) model.value = false
  else model.value = true
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>