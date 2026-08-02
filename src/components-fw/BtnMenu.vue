<template>
  <q-btn icon="menu" flat class="q-mr-xs" padding="none"
    @click="ui.openMenu">
    <q-badge v-if="ui.editingInCourse" floating color="red" rounded />
  </q-btn>
</template>

<script setup lang="ts">
import stores from '../stores/all'

const ui = stores.ui
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>