<!-- Saisie du couple Service / Opérateuur
-->
<template>
<div class="row">
  <service-select class="col-5" v-model="model.SVC"/>
  <div class="col-1"/>
  <input-b class="col-6 self-end"
    prefix="orgcode" v-model="model.org" size="org" noval/>
</div>
</template>

<script setup lang="ts">

import InputB from '../components-fw/InputB.vue'
import ServiceSelect from '../components-fw/ServiceSelect.vue'

const model = defineModel()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
