<!-- 
Affiche une bulle et un titre
-->
<template>
<div class="row full-width items-center">
  <btn-bubble class="col-auto" :size="large ? 'lg' || 'md'"
    :text="$t(prefix + '_bub')"/>
  <div :class="'q-mr-xs col titre-' + (large ? 'lg' : 'md')">
    {{$t(prefix + '_label')}}</div>
</div>
</template>

<script setup lang="ts">
import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  prefix: String, // bulle: prefix_bub   titre: prefix_label
  large: Boolean
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
