<!-- Select d'un service
-->
<template>
  <q-select v-model="model" dense options-dense
    style="min-width:150px; height:40px" :label="$t('site')"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, onMounted, computed } from 'vue'

import { AOperation } from '../src-fw/operation'
import stores from '../stores/all'
const ui = stores.ui

const idc = ref(ui.idc())

const model = defineModel()

const props = defineProps({
  reset: Number,
  initval: String,
  ctx: Object
})

const defSite = computed(() => 
  props.initval && props.initval === '?' ? '' : props.initval)

const opts = ref([])

const emit = defineEmits(['select'])

const init = async () => {
  const ls = Array.from((await AOperation.getSites()).keys())
  ls.sort((a,b) => a > b ? 1 : (a < b ? -1 : 0))
  opts.value = ls
  model.value = defSite.value
}

watch(() => model.value, (v) => {
  if (model.value !== defSite.value) emit('select', model.value, props.ctx || null)
})

watch(() => [props.initval, props.ctx, props.reset], async () => { 
  await init() 
})

onMounted(async () => {
 await init()
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
