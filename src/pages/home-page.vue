<template>
  <div class="column full-width">
    Hello world !
    <btn-cond label="Go Test1" @ok="ui.setPage('test1')"/>
  </div>
</template>

<script setup>
import BtnCond from '../components-fw/BtnCond.vue'
import stores from '../stores/all'

const ui = stores.ui

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>