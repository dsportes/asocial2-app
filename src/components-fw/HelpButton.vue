<template>
  <btn-cond icon="help" @ok="stores.ui.openHelp(page)"/>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import BtnCond from './BtnCond.vue'

const props = defineProps({
  page: String
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
