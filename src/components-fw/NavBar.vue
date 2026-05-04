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
  <btn-cond v-if="nav.hasback" icon="arrow_back" class="q-mr-sm" flat color="none"
    @ok="emit('back', true)"/>
  <btn-cond icon="first_page" flat @ok="navig(3)" color="none"
    :disable="nav.idx === 0"/>
  <btn-cond icon="chevron_left" flat color="none" @ok="navig(2)"
    :disable="nav.idx === 0"/>
  <div class="q-mx-sm text-center" style="width:40px">
    {{ (nav.idx + 1) + ' / ' + nav.nb }}</div>
  <btn-cond icon="chevron_right" flat color="none" @ok="navig(1)"
    :disable="nav.idx >= (nav.nb - 1)"/>
  <btn-cond icon="last_page" class="q-ml-sm" flat color="none" @ok="navig(4)"
    :disable="nav.idx >= (nav.nb - 1)"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, computed } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

const nav = defineModel()

const navig = async (n) => {
  const f = nav.value.fnnav
  if (f) await f(n)
}

const emit = defineEmits(['back', 'navigate'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
