<!-- 
Affiche une bulle et un titre
-->
<template>
<div class="row full-width items-center">
  <btn-bubble class="col-auto" :text="$t(prefix + '_bub')"/>
  <div :class="'q-ml-sm col titre-' + sz">
    {{$t(prefix + '_label')}}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'

import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  prefix: String, // bulle: prefix_bub   titre: prefix_label
  large: Boolean
})

const sz = computed(() => props.large ? 'lg' : 'md')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
