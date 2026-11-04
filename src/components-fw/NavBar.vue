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
<div v-if="nav" :class="'row justify-between items-center ' + sty() + (disable ? ' disabled' : '')"
  style="width:200px">
  <btn-cond icon="arrow_back" class="q-mr-sm" flat color="none"
    :disable="!nav.hasBack" @ok="nav.hasBack = false; emit('back', true)"/>
  <btn-cond icon="first_page" flat @ok="navig(3)" color="none"
    :disable="!nav.hasBack || nav.idx <= 0"/>
  <btn-cond icon="chevron_left" flat color="none" @ok="navig(2)"
    :disable="!nav.hasBack || nav.idx <= 0"/>
  <div class="q-mx-sm text-center" style="width:40px">
    {{ nav.hasBack ? (nav.idx + 1) + ' / ' + nav.nb : ''}}
  </div>
  <btn-cond icon="chevron_right" flat color="none" @ok="navig(1)"
    :disable="!nav.hasBack || nav.idx >= (nav.nb - 1)"/>
  <btn-cond icon="last_page" class="q-ml-sm" flat color="none" @ok="navig(4)"
    :disable="!nav.hasBack || nav.idx >= (nav.nb - 1)"/>
</div>
</template>

<script setup lang="ts" vapor>
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import { NavBar } from '../stores/ui-store'

const nav = defineModel<NavBar>()

const props = defineProps<{
  disable?: boolean
}>()

const navig = async (n: number) => {
  if (nav.value && nav.value.fnnav) 
    await nav.value.fnnav(n)
}

const emit = defineEmits(['back', 'navigate'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
