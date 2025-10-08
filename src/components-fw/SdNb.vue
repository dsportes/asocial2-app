<template>
<div>
  <sd-noir v-if="!stores.ui.isDark" :texte="texte"/>
  <sd-blanc v-else :texte="texte"/>
</div>
</template>

<script setup>
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'
import stores from '../stores/all'

const props = defineProps({ 
  texte: String, 
  idx: Number // ???
})
</script>

<style lang="scss" scoped>
</style>
