<template>
<div>
  <div v-if="!hasaccount" class="row full-width items-center">
    <btn-bubble :text="$t('INVnc_bub')"/>
    <q-radio v-model="flag.f1" :val="true" :label="$t('INVco_1')" />
    <q-radio v-model="flag.f2" :val="true" :label="$t('INVco_2')" />
  </div>
  <div v-else class="titre-md text-italic">{{$t('INVco_3')}}</div>

  <security-site  v-if="flag.f2 || flag.f1" v-model="sf.safeStore"/>

  <login-block v-if="flag.f2" class="full-width q-pl-sm" 
    @logged="emit('done', true)"/>

  <div v-if="flag.f1" class="q-mb-sm q-ml-sm">
    <btn-cond v-if="flag.f1" :label="$t('INVco_cr')" 
      @ok="dialogs.create = true"/>
  </div>

  <safe-cr v-model="dialogs.create" :mode="0" @done="emit('done', true)"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'
import stores from '../stores/all'

import LoginBlock from '../components-fw/LoginBlock.vue'
import SecuritySite from '../components-fw/SecuritySite.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

import SafeCr from '../dialogs-fw/SafeCr.vue'

const sf = stores.safe

const emit = defineEmits(['done'])

const model = defineModel()

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

watch(model, () => {
  flag.f1 = false
  flag.f2 = props.hasaccount ? true : false
})

watch(() => flag.f1, (v) => {
  if (v) flag.f2 = false
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