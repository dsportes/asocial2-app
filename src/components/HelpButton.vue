<template>
  <q-btn icon="help" size="md" dense padding="none" @click="openHelp(page)"></q-btn>
</template>

<script setup lang="ts">
  import { openHelp } from '../app/util'
  // import { ref } from 'vue'

  const props = defineProps({
    page: String
  })
</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
