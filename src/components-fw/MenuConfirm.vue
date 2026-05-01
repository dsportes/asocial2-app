<!-- Menu demandant confirmation pat frappe d'un nombre aléatoire affiché
- event 'confirm' quand confimé
-->
<template>
  <q-menu v-model="m" anchor="center middle" self="center middle">
    <div class="bord q-pa-sm column items-center" style="width: 280px">
      <div class="row items-center q-mb-sm">
        <div class="titre-lg q-mr-sm">{{ $t('confirm') }}</div>
        <div class="font-mono fs-xl text-bold">{{ code }}</div>
      </div>
      <q-input class="font-mono fs-lg" style="width:60px;"
        dense standout v-model="text" placeholder="000"/>
      <q-btn class="q-mt-sm" flat color="primary" 
        :label="$t('giveup')" @click="m = false"/>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { $t } from '../src-fw/util'
const code = defineModel()

const m = ref(true)

// const code = ref('' + (100 + Crypt.random(1)[0]))
const emit = defineEmits(['confirm'])
const text = ref('')

watch(text, (ap, av) => {
  if (ap === code.value) {
    text.value = ''
    m.value = false
    emit('confirm', true)
  }
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord { border: 2px solid var(--q-warning); border-radius: 5px; }
</style>
