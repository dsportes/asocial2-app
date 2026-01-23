<template>
<div class="row font-mono fs-md">
  <q-icon v-if="ps.exav && !ps.exap" class="col-1" name="delete" size="24px" :color="colorPS"/>
  <q-icon v-else class="col-1" name="list" size="24px" :color="colorPS"/>
  <div class="col-1 font-mono">{{ps.crIds.size}}</div>
  <div :class="'col-10 font-mono ellipsis mh ' + clPSab">{{ps.about}}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

const props = defineProps({
  ps: Object
})

const clPSab = computed(() => props.ps.exav && !props.ps.exap ? ' text-strike' : 
  (props.ps.chgab ? ' text-bold text-warning' : ''))
const colorPS = computed(() => props.ps.chglc ? 'warning' : 'none')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
