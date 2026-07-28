<!-- Select d'un service
-->
<template>
  <q-select v-model="siteloc" dense options-dense
    style="min-width:150px; height:40px" :label="$t('site')"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, onMounted } from 'vue'

import { AOperation } from '../src-fw/operation'

const props = defineProps({
  ctx: Object
})

const opts = ref([])

const emit = defineEmits(['change'])

const siteloc = ref()

const model = defineModel()

const sel = () => {
  model.value = siteloc.value ? siteloc.value : ''
  props.ctx.site = model.value
  if (props.ctx.site !== props.ctx.initial)
    emit('change', props.ctx)
}

const init = async () => {
  const ls = Array.from((await AOperation.getSites()).keys())
  ls.sort((a,b) => a > b ? 1 : (a < b ? -1 : 0))
  opts.value = ls
  siteloc.value = props.ctx.initial
}

watch(siteloc, (v) => {
  sel()
})

watch(() => props.ctx, async () => { await init() })

onMounted(async () => {
 await init()
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
