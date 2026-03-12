<!-- Input d'une phrase secrète.
Event: validate 
-->
<template>
  <input-a v-model="model.inp" :size="size"
    :prefix="prefix" :disable="disable"
    :objerr="model"
    :valctrl="valctrl"
    @validate="onVal"/>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, computed, watch } from 'vue'
import InputA from '../components-fw/InputA.vue'

const model = defineModel()
const emit = defineEmits(['validate'])

const onVal = (v) => {
  emit('validate', v)
}

const props = defineProps({
  size: String,
  prefix: String,
  disable: Boolean,
  valctrl: Function
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
