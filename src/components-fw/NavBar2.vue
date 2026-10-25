<!-- Barre de navigation dans une liste.
Le model est un reactive avec:
- idx : l'index courant de l'item dans la liste (commence à 0)
- nb : le nombre total d'items dans la liste
- listMode: true si en mode liste, sinon en détail sur le courant
- disable
Emit: 'navigate', n' quand navigation vers,
 1:next 2: previous, 3:first, 4:last, 5:set "liste", 6: set "detail"
-->
<template>
<div :class="'row justify-between items-center ' + sty() + (nav.disable ? ' disabled' : '')"
  style="width:200px">
  <btn-cond v-if="!nav.listMode" icon="list_alt" flat 
    :color="clr" @ok="nav5"/>
  <btn-cond v-else icon="description" flat color="none"  @ok="nav6"/>
  <btn-cond icon="first_page" flat  
    :color="clr" @ok="navx(3)"
    :disable="nav.idx <= 0"/>
  <btn-cond icon="chevron_left" flat 
    :color="clr"  @ok="navx(2)"
    :disable="nav.idx <= 0"/>
  <div class="q-mx-sm text-center" style="width:40px">
    {{ nav.nb ? (nav.idx + 1) + ' / ' + nav.nb : '-'}}
  </div>
  <btn-cond icon="chevron_right" flat 
    :color="clr" @ok="navx(1)"
    :disable="nav.idx >= (nav.nb - 1)"/>
  <btn-cond icon="last_page" class="q-ml-sm" flat 
    :color="clr" @ok="navx(4)"
    :disable="nav.idx >= (nav.nb - 1)"/>
</div>
</template>

<script setup lang="ts" vapor>
// @ts-ignore
import { computed } from 'vue'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

const nav = defineModel()

import stores from '../stores/all'
const ui = stores.ui

const clr = computed(() => ui.editingInCourse ? 'warning' : 'none' )

const nav5 = async () => {
  if (await ui.mayClose2()) {
    nav.listMode = true
    emit('navigate', 5)
  }
}

const nav6 = () => {
  nav.listMode = false
  emit('navigate', 6)
}

const navx= async (n) => {
  if (await ui.mayClose2())
    emit('navigate', n)
}

const emit = defineEmits(['navigate'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
