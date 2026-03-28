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
// @ts-ignore
// import { watch } from 'vue'

import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'
import ServiceSelect from '../components-fw/ServiceSelect.vue'

const config = stores.config

const model = defineModel()
/*
watch(() => model.value.SVC, (v) => {
  console.log(v)
})
*/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
