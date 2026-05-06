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
:style="'height :' + (height || '300px') + ';'"
-->
<template>
  <q-scroll-area
    :style="'height :' + (height || '300px') + ';'"
    :class="(!dark ? 'clear' : 'dark') + ' q-py-xs'"
    :barStyle="barStyle" :thumbStyle="thumbStyle">
    <sd-noir v-if="dark" :text="text2()"/>
    <sd-blanc v-else :text="text2()"/>
  </q-scroll-area>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
import stores from '../stores/all'

import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const config = stores.config
const url = config.K.DOC_URLS[config.locale]
const ui = stores.ui

const props = defineProps({
  inverse: Boolean,
  height: String,
  text: String, // texte MD à afficher
})

const text2 = () => {
  return props.text ? props.text.replaceAll('href="$$/', 'href="' + url) : ''
}

const dark = ref(ui.$q.dark.isActive && !props.inverse)

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
