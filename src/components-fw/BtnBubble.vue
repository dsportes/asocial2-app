<!-- Bouton : affiche une bulle d'aide de texte MD sur click 
Dans le texte MD les liens externes vers la documentation sont écrits sous cette forme:

Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

Lest hyperliens sont suivis: les textes 'href="$$/' sont remplacés par:
'href="https://asocialapps.github.io/frdocs/''

Les liens vers la documentation externe par langue sont donnés dans constant.ts:
  DOC_URLS: {
    fr: "https://asocialapps.github.io/frdocs/",
    en: "https://asocialapps.github.io/frdocs/",
  },

Les liens vers les images sont de cette forme:
<img src="images/flowers.png" style="background-color:white">
L'image doit figurer dans public/images
-->
<template>
  <q-icon class="cursor-pointer"
    name="question_mark" 
    :color="!$q.dark.isActive ? 'indigo-2' : 'indigo-9'" 
    size="20px">
    <q-popup-proxy ref="qpp" 
      transition-show="flip-up" 
      transition-hide="flip-down"
      breakpoint="200px">
      <div :class="($q.dark.isActive ? 'clear' : 'dark') + ' q-pa-xs q-mb-xl'" 
        @click="hide">
        <sd-noir v-if="!$q.dark.isActive" :text="text2()"/>
        <sd-blanc v-else :text="text2()"/>
      </div>
    </q-popup-proxy>
  </q-icon>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
// @ts-ignore
import { useQuasar } from 'quasar'

import stores from '../stores/all'

import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

const $q = useQuasar()

const config = stores.config
const url = config.K.DOC_URLS[config.locale]

const props = defineProps({ 
  text: String // texte MD à afficher
})

const text2 = () => {
  return props.text.replaceAll('href="$$/', 'href="' + url)
}

const qpp = ref(null)

function hide () {
  qpp.value.hide()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
