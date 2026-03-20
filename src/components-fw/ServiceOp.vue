<!-- Saisie du couple Service / Opérateuur
-->
<template>
<div class="row">
  <service-select class="col-5" v-model="model.SVC"/>
  <div class="col-1"/>
  <input-A class="col-6" prefix="operator" v-model="model.$OP" size="oper"
    :list="config.K.FAVORITE_OPERATORS"/>
</div>
</template>

<script setup lang="ts">

import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'
import ServiceSelect from '../components-fw/ServiceSelect.vue'

const config = stores.config

const model = defineModel()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
