<template>
  <div>
    <div v-if="role === 'Org.manager'" class="column full-width">
      <div class="titre-md">{{ $t('COND_orgm_1', [cond.name]) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, Ref, computed, watch } from 'vue'
// @ts-ignore
import { $t } from '../src-fw/util'
// import stores from '../stores/all'

const props = defineProps({
  cond: Object,
  role: String
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>