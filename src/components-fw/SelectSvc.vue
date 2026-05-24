<!-- Select d'un service
-->
<template>
  <q-select v-model="svcloc" dense options-dense filled
    style="width:150px"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
    <!--:label="$t('service')"-->
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

const session = stores.session

const emit = defineEmits(['change'])
const config = stores.config
const opts = ref([])
const svcloc = ref()
for(const svc of Object.keys(config.K.SERVICES)) {
  const x = { label: $t('services_' + svc), svc: svc }
  opts.value.push(x)
  if (svc === config.K.DEFAULT_SERVICE) svcloc.value = x
}

const model = defineModel()

model.value = opts.value[0].svc
watch(svcloc, (v) => {
  model.value = svcloc.value ? svcloc.value.svc : ''
  session.setSvc(model.value)
  emit('change', model.value)
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
