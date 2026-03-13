<!-- Bouton : affiche une bulle d'aide de texte MD sur click -->
<template>
  <q-icon class="cursor-pointer"
    name="question_mark" 
    :color="!$q.dark.isActive ? 'indigo-2' : 'indigo-9'" 
    size="20px">
    <q-popup-proxy ref="qpp" 
      transition-show="flip-up" 
      transition-hide="flip-down"
      breakpoint="400">
      <q-banner :class="($q.dark.isActive ? 'clear' : 'dark') + ' q-pa-xs q-mb-xl'" 
        @click="hide">
        <sd-noir v-if="!$q.dark.isActive" :text="text"/>
        <sd-blanc v-else :text="text"/>
      </q-banner>
    </q-popup-proxy>
  </q-icon>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

const $q = useQuasar()

const props = defineProps({ 
  text: String // texte MD à afficher
})

const qpp = ref(null)

function hide () {
  qpp.value.hide()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
