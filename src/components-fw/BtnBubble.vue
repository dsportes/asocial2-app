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
  <q-icon flat class="cursor-pointer"
    name="question_mark" 
    :color="!$q.dark.isActive ? 'indigo-2' : 'indigo-9'" 
    size="20px">
    <q-menu auto-close :class="($q.dark.isActive ? 'clear' : 'dark')"
      style="height: 300px; max-height:70vh; width: 400px; max-width:90vw">
      <q-scroll-area style="height: 300px;"
        :class="($q.dark.isActive ? 'clear' : 'dark') + ' q-pt-xs q-px-xs q-pb-xl'"
        :barStyle="barStyle" :thumbStyle="thumbStyle">
        <sd-noir v-if="!$q.dark.isActive" :text="text2()"/>
        <sd-blanc v-else :text="text2()"/>
      </q-scroll-area>
    </q-menu>
  </q-icon>
</template>

<script setup lang="ts">
import stores from '../stores/all'

import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const config = stores.config
const url = config.K.DOC_URLS[config.locale]

const props = defineProps({ 
  text: String // texte MD à afficher
})

const text2 = () => {
  return props.text.replaceAll('href="$$/', 'href="' + url)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
