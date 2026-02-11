<template>
  <input-a v-model="modelValue.inp" :size="size"
    :prefix="prefix" :disable="disable"
    :objerr="modelValue"
    :validatefn="validatefn"
    :valctrl="valctrl"/>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, computed, watch } from 'vue'
import InputA from '../components-fw/InputA.vue'

const modelValue = defineModel()

const props = defineProps({
  size: String,
  prefix: String,
  validatefn: Function,
  disable: Boolean,
  valctrl: Function
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
