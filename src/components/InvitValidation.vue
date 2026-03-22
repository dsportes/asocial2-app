
<template>
<dialog-std1 v-model="model" @close="model = false"
  :title="$t('INVtitval', [$t('INV_' + invit.major)])">
  <template #hdr>
    <div class="row justify-end items-center">
      <btn-cond icon="check" :label="$t('validate')" @ok="validate"/>
    </div>
  </template>
  <template #default>
    <div class="column full-width items-center">
      <q-expansion-item class="q-my-xs pwsm" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs pwsm">
          <invit-zoom class="q-ml-lg" v-model="locInvit"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div class="q-my-xs pwsm">
        bla bla bla
      </div>

    </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'

import stores from '../stores/all'
import InvitZoom from '../components-fw/InvitZoom.vue'
import BtnCond from '../components-fw/BtnCond.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const model = defineModel()
const dialogs = reactive({D2: false, D3:false})

const props = defineProps({
  invit: Object
})

const locInvit = ref(props.invit)

const validate = async () => {
  await props.invit.validate()
  model.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>