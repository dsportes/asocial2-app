<!-- 
Affiche une bulle et un titre
-->
<template>
<div :class="'row items-center' + (mini ? '' : ' full-width')">
  <btn-bubble class="col-auto" :text="$t(prefix + '_bub')"/>
  <div :class="'q-ml-sm titre-' + sz + (mini ? '' : ' col')">
    {{$t(prefix + '_label')}}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  prefix: String, // bulle: prefix_bub   titre: prefix_label
  large: Boolean,
  mini: Boolean
})

const sz = computed(() => props.large ? 'lg' : 'md')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
