<template>
  <q-input style="width:14rem" :class="'bord999' + (actif ? 2 : 1)"
    dense outlined
    :disable="!actif" v-model="text"
    :label="actif ? $t('confirm', [code]) : $t('nothing2confirm')" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { Crypt } from '../src-fw/crypt'

const props = defineProps({
  actif: Boolean,
  confirm: Function
})

const text = ref('')
const code = ref('' + Crypt.random(1))

watch(() => props.actif, (ap, av) => {
  code.value = '' + Crypt.random(1)
  text.value = ''
})

watch(text, (ap, av) => {
  if (ap === code.value) {
    text.value = ''
    props.confirm()
  }
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord9991 { border: 4px solid transparent; }
.bord9992 { border: 4px solid var(--q-warning); border-radius: 5px; }
</style>
