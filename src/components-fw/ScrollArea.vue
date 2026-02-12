<template>
  <q-scroll-area :style="'height: ' + sz + ';'"
    :barStyle="barStyle" :thumbStyle="thumbStyle"
    class='bord1 q-pa-xs'>
    <slot/>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }
const sizes = {
  sm: '100px',
  md: '170px',
  lg: '240px'
}

const props = defineProps({
  size: String
})
const sz = computed(() => {
  const p = props.size
  return !p ? '170px' : (sizes[p] ?  sizes[p] : p)
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>