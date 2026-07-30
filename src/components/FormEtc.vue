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
    <form-inp2 v-model="errs.pseudo" type="membrecodir" :svc="fst.form.svc" champ="pseudo" size="pseudo"/>
  </div>

  <!-- membreredaction --------------------------------------------------------------->
  <div v-if="fst.form.type === 'membreredaction'">
    <form-inp2 v-model="errs.pseudo" type="membreredaction" :svc="fst.form.svc" champ="pseudo" size="pseudo"/>
  </div>

  <!-- auteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'auteur'">
    <form-inp2 v-model="errs.nomAuteur" type="auteur" champ="nomAuteur" :svc="fst.form.svc"
      size="auteur" valbtn />
    <form-enum2 v-model="errs.section" type="auteur" champ="section" enum="Section" :svc="fst.form.svc"/>
  </div>

  <!-- coauteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'coauteur'">
    <form-inp2 v-model="errs.nomAuteur" type="coauteur" champ="nomAuteur" :svc="fst.form.svc"
      size="auteur" valbtn />
    <form-inp2 v-model="errs.trigramme" type="coauteur" champ="trigramme" :svc="fst.form.svc"
      size="trig" />
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { reactive } from 'vue'
import stores from '../stores/all'
import FormInp2 from '../components/FormInp2.vue'
import FormEnum2 from '../components/FormEnum2.vue'

import { $t } from '../src-fw/util'
// import InputB from '../components-fw/InputB.vue'
// import BtnCond from '../components-fw/BtnCond.vue'

const fst = stores.form
const errs = reactive({
  pseudo: '',
  nomAuteur: '',
  section: '',
  trigramme: ''
})

/**********************************************************************************/
fst.setFnCheck({
  membrecodir: () : string => {
    return errs.pseudo ? $t('FORMdiag_pseudo', [$t(errs.pseudo)]) : ''
  },

  membreredaction: () : string => {
    return errs.pseudo ?  $t('FORMdiag_pseudo', [$t(errs.pseudo)]) : ''
  },

  auteur: () : string => {
    if (errs.nomAuteur) return $t('FORMdiag_nomAuteur', [$t(errs.nomAuteur)])
    if (errs.section) return  $t('FORMdiag_section')
    return ''
  },

  coauteur: () : string => {
    if (errs.nomAuteur) return $t('FORMdiag_nomAuteur', [$t(errs.nomAuteur)])
    if (errs.trigramme) return  $t('FORMdiag_trigramme')
    return ''
  }
})
/**********************************************************************************/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
