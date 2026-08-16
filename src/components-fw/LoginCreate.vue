<template>
<div>
  <div v-if="!hasaccount" class="row full-width items-center">
    <btn-bubble :text="$t('HPinvnc_bub')"/>
    <q-radio v-model="flag.f1" :val="true" :label="$t('HPinvco_1')" />
    <q-radio v-model="flag.f2" :val="true" :label="$t('HPinvco_2')" />
  </div>
  <div v-else class="titre-md text-italic">{{$t('HPinvco_3')}}</div>

  <login-block v-if="flag.f2" class="full-width q-pl-sm"
    @logged="emit('done', true)"/>

  <safe-cr v-if="dialogs.create" v-model="dialogs.create"
    mode="u" @done="emit('done', true)"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { reactive, watch } from 'vue'
import stores from '../stores/all'

import LoginBlock from '../components-fw/LoginBlock.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

import SafeCr from '../dialogs-fw/SafeCr.vue'

// const sf = stores.safe

const emit = defineEmits(['done'])

// const model = defineModel()

const props = defineProps({
  hasaccount: Boolean
})

const dialogs = reactive({
  create: false
})

const flag = reactive({
  f1: false,
  f2: props.hasaccount ? true : false
})

/*
watch(model, () => {
  flag.f1 = false
  flag.f2 = props.hasaccount ? true : false
})
*/

watch(() => flag.f1, (v) => {
  if (v) { flag.f2 = false; dialogs.create = true }
})

watch(() => flag.f2, (v) => {
  if (v) flag.f1 = false
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordv { border-left: 1px solid $grey-5; }
.left { position: relative; left: -10px; }
</style>
