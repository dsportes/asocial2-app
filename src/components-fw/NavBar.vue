<!-- Barre de navigation dans une liste.
Le model est un reactive avec:
- idx : l'index courant de l'item dans la liste
- nb : le nombre total d'items dans la liste
Propriété: hasback s'il y a un bouton "back" à mettre en tête
Emit:
- 'back': quand appuie sur back
- 'navigate', n' quand navigation vers 1:next 2: previous, 3:first, 4:last
-->
<template>
<div :class="'row justify-between items-center ' + sty()" style="width:200px">
  <btn-cond v-if="hasback" icon="arrow_back" class="q-mr-sm" flat color="none"
    @ok="emit('back', true)"/>
  <btn-cond icon="first_page" flat @ok="emit('navigate', 3)" color="none"
    :disable="model.idx === 0"/>
  <btn-cond icon="chevron_left" flat color="none" @ok="emit('navigate', 2)"
    :disable="model.idx === 0"/>
  <div class="q-mx-sm text-center" style="width:40px">
    {{ (model.idx + 1) + ' / ' + model.nb }}</div>
  <btn-cond icon="chevron_right" flat color="none" @ok="emit('navigate', 1)"
    :disable="model.idx >= (model.nb - 1)"/>
  <btn-cond icon="last_page" class="q-ml-sm" flat color="none" @ok="emit('navigate', 4)"
    :disable="model.idx >= (model.nb - 1)"/>
</div>
</template>

<script setup lang="ts">
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

/*
  const model = reactive({
    idx: 0,
    nb: 0
  })
*/
const model = defineModel()

const emit = defineEmits(['back', 'navigate'])

const props = defineProps({
  hasback: Boolean
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
