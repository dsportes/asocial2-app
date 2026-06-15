<template>
  <div>
    <div v-if="cred.role === 'Org.manager' && !cred.docId" class="column full-width">
      <div class="titre-md">{{ $t('COND_orgm_1', [cred.cond.name]) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, Ref, computed, watch } from 'vue'
// @ts-ignore
import { $t } from '../src-fw/util'
import { $Credential } from '../src-fw/documents'
// import stores from '../stores/all'

const props = defineProps({
  cred: $Credential
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>