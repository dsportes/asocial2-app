<!-- Select d'un service
-->
<template>
  <q-select v-model="svcloc" dense options-dense
    :label="$t('service')"
    style="min-width:150px; height:40px"
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
  restricted: Boolean,
  noinit: Boolean,
  excl: Object // set des valeurs exclues
})

const emit = defineEmits(['change'])
const config = stores.config
const opts = ref()
const svcloc = ref()

const model = defineModel()

const sel = () => {
  model.value = svcloc.value ? svcloc.value.svc : ''
  emit('change', model.value)
}

const init = async () => {
  opts.value = []
  const ks = config.K.SERVICES
  const x = await AOperation.getServicesLabels()
  for(const [svc, label] of x) {
    if (props.restricted && !ks[svc]) continue
    if (props.excl && props.excl.has(svc)) continue
    const x = { label: label + ' [' + svc + ']', svc: svc }
    opts.value.push(x)
    opts.value.sort((a,b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0))
    if (!props.noinit && svc === config.K.DEFAULT_SERVICE) svcloc.value = x
  }
  if (props.noinit) svcloc.value = ''
  else if (!svcloc.value && opts.value.length) {
    svcloc.value = opts.value[0]
    sel()
  }
}

watch(svcloc, (v) => { sel() })

watch(() => props.excl, async () => { await init() })

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
