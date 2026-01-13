<template>
  <vue-showdown class="markdown-body2" :markdown="text" :key="text" flavor="github" :options="{ emoji: true }" />
</template>

<script setup>
import { VueShowdown } from 'vue-showdown'

const props = defineProps({
  text: String
})
</script>

<style lang="scss">
@import '../css/github-markdown-dark.scss';
@import '../css/markdown-custom.scss';
</style>