<!-- Select d'un service
-->
<template>
  <q-select v-model="svcloc" dense options-dense filled
    style="width:150px; height:40px"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, onMounted } from 'vue'

import stores from '../stores/all'
// import { $t } from '../src-fw/util'
import { AOperation } from '../src-fw/operation'

const session = stores.session

const props = defineProps({
  restricted: Boolean
})

const emit = defineEmits(['change'])
const config = stores.config
const opts = ref([])
const svcloc = ref()

const model = defineModel()

const sel = () => {
  model.value = svcloc.value ? svcloc.value.svc : ''
  session.setSvc(model.value)
  emit('change', model.value)
}

const init = async () => {
  const ks = config.K.SERVICES
  const obj = await AOperation.getServicesLabels()
  for(const svc in obj) {
    if (props.restricted && !ks[svc]) continue
    const x = { label: obj[svc], svc: svc }
    opts.value.push(x)
    if (svc === config.K.DEFAULT_SERVICE) svcloc.value = x
  }
  if (!svcloc.value && opts.value.length)
    svcloc.value = opts.value[0]
  sel()
}

watch(svcloc, (v) => {
  sel()
})

onMounted(async () => {
 await init()
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
