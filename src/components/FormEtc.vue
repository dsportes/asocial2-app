<!--
Edite le etc d'un Form
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])
-->
<template>
<div v-if="fst.form">
  <!-- membrecodir --------------------------------------------------------------->
  <div v-if="fst.form.type === 'membrecodir'">
    <form-inp2 v-model="errs.pseudo" type="membrecodir" champ="pseudo" size="pseudo"/>
  </div>

  <!-- membreredaction --------------------------------------------------------------->
  <div v-if="fst.form.type === 'membreredaction'">
    <form-inp2 v-model="errs.pseudo" type="membreredaction" champ="pseudo" size="pseudo"/>
  </div>

  <!-- auteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'auteur'">
    <form-inp2 v-model="errs.nomAuteur" type="auteur" champ="nomAuteur" size="pseudo"/>
    <form-enum2 v-model="errs.section" type="auteur" champ="section" enum="Section"/>
  </div>

  <!-- coauteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'coauteur'">
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { reactive } from 'vue'
import stores from '../stores/all'
import FormInp2 from '../components/FormInp2.vue'
import FormEnum2 from '../components/FormEnum2.vue'

// import { $t } from '../src-fw/util'
// import InputB from '../components-fw/InputB.vue'
// import BtnCond from '../components-fw/BtnCond.vue'

const fst = stores.form
const errs = reactive({
  pseudo: '',
  nomAuteur: '',
  section: ''
})


/**********************************************************************************/
fst.setFnCheck({
  membrecodir: () : string => {
    return errs.pseudo ? 'pseudo' : ''
  },

  membreredaction: () : string => {
    return errs.pseudo ? 'pseudo' : ''
  },

  auteur: () : string => {
    return errs.nomAuteur ? 'nomAuteur' : (errs.section ? 'section' : '')
  },

  coauteur: () : string => {
    return ''
  }
})
/**********************************************************************************/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
