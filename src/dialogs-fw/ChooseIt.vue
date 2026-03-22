<!-- Affiche un message MD :
- prefix : préfixe des textes
  - tit : titre de la boîte.
  - txt : texte MD de la boîte
- options: "wwp" -> options 0 et 1: "warning", option 2 "primary"
- l'appui sur "close" émet 'giveup'
- le choix d'une option émet 'option', N.
-->
<template>
<q-dialog v-model="model" persistent>
  <q-card :class="sty('sm')">
    <q-toolbar class="tbs">
      <btn-cond icon="close" size="md" flat color="warning" @ok="emit('giveup', true)"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t(prefix + '_tit')}}</q-toolbar-title>
    </q-toolbar>
    <sd-nb class="q-ma-sm q-my-md" :text="$t(prefix + '_txt')"/>
    <q-card-actions vertical align="center">
      <btn-cond v-for="(b, idx) in opts" :key="idx"
        class="q-mt-sm"
        :label="$t(prefix + '_' + idx)"
        :color="b ? 'warning' : 'primary'"
        @ok="model= false; emit('option', idx)"/>
    </q-card-actions>
  </q-card>
</q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import SdNb from '../components-fw/SdNb.vue'

const props = defineProps({
  prefix: String,
  options: String
})

const model = defineModel()

const opts = ref(new Array(props.options.length))
for(let i = 0; i < props.options.length; i++) opts.value[i] = props.options.charAt(i) === 'w'

const emit = defineEmits(['giveup', 'option'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>