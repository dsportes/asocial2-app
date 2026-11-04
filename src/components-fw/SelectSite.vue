<!-- Select d'un service
-->
<template>
  <q-select v-model="model" dense options-dense :disable="disable"
    style="min-width:150px; height:40px" :label="$t('site')"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts" vapor>
import { ref, Ref, watch, onMounted, computed } from 'vue'

import { AOperation } from '../src-fw/operation'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
const ui = stores.ui

const idc = ref(ui.idc())

const model = defineModel()

const props = defineProps<{
  forstore?: boolean,
  reset?: number,
  initval?: string,
  disable?: boolean,
  ctx?: any
}>()

const defSite = computed(() => 
  props.initval && props.initval === '?' ? '' : props.initval)

const opts: Ref<string[]> = ref([])

const emit = defineEmits(['select'])

const init = async () => {
  const ls = []
  const b = props.forstore
  for(const u of (await AOperation.getSites()).keys())
    if (!b || u.endsWith('st')) ls.push(u)
  ls.sort((a,b) => a > b ? 1 : (a < b ? -1 : 0))
  if (b) ls.unshift($t('SECsite_std'))
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
