<template>
  <q-expansion-item v-model="fst.exp[name]" @before-show="fst.expOnShow(name)"
    :label="label" dense switch-toggle-side class="q-ma-sm full-width"
    header-class="text-bold titre-md text-italic">
    <slot name="default"/>
  </q-expansion-item>
</template>

<script setup lang="ts" vapor>
import stores from '../stores/all'

const fst = stores.form
const props = defineProps<{
  name: string,
  label: string
}>()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>