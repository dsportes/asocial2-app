<!-- Input d'une phrase secrète.
Event: validate 
-->
<template>
  <input-b v-model="model" 
    :size="size"
    :prefix="prefix" 
    :disable="disable"
    :objctrl="objctrl"
    @validate="emit('validate', true)"
    @change="emit('change', true)"/>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, computed, watch } from 'vue'
import InputB from '../components-fw/InputB.vue'

const model = defineModel()
const emit = defineEmits(['validate', 'change'])

const props = defineProps({
  size: String,
  prefix: String,
  disable: Boolean,
  objctrl: Object
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
