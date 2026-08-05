<!-- Select d'un service
-->
<template>
  <q-select v-model="model" dense options-dense :disable="disable"
    style="min-width:150px; height:40px" :label="$t('site')"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, onMounted, computed } from 'vue'

import { AOperation } from '../src-fw/operation'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
const ui = stores.ui

const idc = ref(ui.idc())

const model = defineModel()

const props = defineProps({
  forstore: Boolean,
  reset: Number,
  initval: String,
  disable: Boolean,
  ctx: Object
})

const defSite = computed(() => 
  props.initval && props.initval === '?' ? '' : props.initval)

const opts = ref([])

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
