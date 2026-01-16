<template>
<div>
  <sd-noir v-if="$q.dark.isActive" :text="text"/>
  <sd-blanc v-else :text="text"/>
</div>
</template>

<script setup>
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({ 
  text: String
})

</script>

<style lang="scss" scoped>
</style>
