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
  ctx: Object // { initial, excl } excl : set des valeurs exclues
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
  const sl = await AOperation.getServicesLabels()
  const m = new Map()
  for(const [svc, label] of sl) {
    if (props.restricted && !ks[svc]) continue
    if (props.ctx && props.ctx.excl && props.ctx.excl.has(svc)) continue
    const x = { label: label + ' [' + svc + ']', svc: svc }
    m.set(svc, x)
    opts.value.push(x)
    opts.value.sort((a,b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0))
  }
  svcloc.value = null
  if (props.ctx && props.ctx.initial !== undefined) svcloc.value = m.get(props.ctx.initial)
  else {
    svcloc.value = m.get(config.K.DEFAULT_SERVICE)
    if (!svcloc.value && opts.value.length) svcloc.value = opts.value[0]
  }
  if (svcloc.value) sel()
}

watch(svcloc, (v) => { sel() })

watch(() => props.ctx, async () => { 
  await init() })

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
