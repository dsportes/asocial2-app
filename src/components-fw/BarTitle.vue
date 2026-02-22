<template>
<div class="row full-width items-center">
  <btn-bubble class="col-auto" :size="size || 'md'"
    :text="$t(prefix + '_bub')"/>
  <div :class="'q-mr-xs col titre-' + (size ? size : 'md')">
    {{$t(prefix + '_label')}}</div>
</div>
</template>

<script setup lang="ts">
import BtnBubble from '../components-fw/BtnBubble.vue'

const props = defineProps({
  prefix: String,
  size: String
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
