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
    :color="!$q.dark.isActive || clear ? 'indigo-2' : 'indigo-9'" 
    size="20px">
    <q-menu auto-close :class="($q.dark.isActive ? 'clear' : 'dark')"
      anchor="center middle" self="center middle"
      style="height: 300px; max-height:70vh; width: 400px; max-width:90vw">
      <scroll-md height="300px" :text="text" inverse />
    </q-menu>
  </q-icon>
</template>

<script setup lang="ts">
import ScrollMd from '../components-fw/ScrollMd.vue'

const props = defineProps({ 
  text: String, // texte MD à afficher
  clear: Boolean
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
