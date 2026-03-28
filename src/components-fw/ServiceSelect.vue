<!-- Select d'un service
-->
<template>
  <q-select v-model="svcloc" dense options-dense filled clearable
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts" :label="$t('service')"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

const config = stores.config
const opts = ref([])
for(const svc of Object.keys(config.K.SERVICES))
  opts.value.push({ label: $t('services_' + svc), svc: svc})

const model = defineModel()

const svcloc = ref(opts.value[0])
model.value = opts.value[0].svc
watch(svcloc, (v) => {
  model.value = svcloc.value ? svcloc.value.svc : ''
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
