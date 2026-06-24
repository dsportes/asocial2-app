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
  <div v-if="fst.form.type === 'membrecodir'" class="q-my-md">
    <div class="titre-md q-mt-md">{{  $t('TYPE_membrecodir_pseudo') }}</div>

    <div v-if="fst.visU" class="row q-px-xs" items-center>
      <input-b class="col font-mono text-bold" size="pseudo" prefix="FORMdem_2"
        v-model="pseudo" noval :initval="fst.upd.etc.pseudo || ''"
        :disable="!fst.isDemand || !fst.editable"/>
      <btn-cond v-if="!fst.isDemand || !fst.editable" class="col-auto" round icon="content_paste"
        @ok="fst.upd.etc.pseudo = (fst.form.etcT && fst.form.etcT.pseudo ? fst.form.etcT.pseudo : ''); onChange()"/>
    </div>

    <div v-if="fst.visT" class="row q-px-xs" items-center>
      <input-b class="col-10 font-mono text-bold" size="pseudo" prefix="FORMprop_2"
        v-model="pseudo" noval :initval="fst.upd.etc.pseudo || ''"
        :disable="fst.isDemand || !fst.editable"/>
      <btn-cond v-if="fst.isDemand || !fst.editable" class="col-1" round icon="content_paste"
        @ok="fst.upd.etc.pseudo = (fst.form.etcU && fst.form.etcU.pseudo ? fst.form.etcU.pseudo : ''); onChange()"/>
    </div>
  </div>

  <!-- membreredaction --------------------------------------------------------------->
  <div v-if="fst.form.type === 'membreredaction'">
  </div>

  <!-- auteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'auteur'">
  </div>

  <!-- coauteur --------------------------------------------------------------->
  <div v-if="fst.form.type === 'coauteur'">
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import BtnCond from '../components-fw/BtnCond.vue'
// import MdEditor from '../components-fw/MdEditor.vue'
// import { $Form } from '../src-fw/documents'

const fst = stores.form
// const ui = stores.ui

const pseudo = reactive({ inp: '', err: '' })
watch(pseudo, async (v) => {
  fst.upd.etc.pseudo = v.inp
  await fst.onChange()
})

/**********************************************************************************/
fst.setFnCheck({
  membrecodir: () : string => {
    return pseudo.err ? 'pseudo' : ''
  },

  membreredaction: () : string => {
    return ''
  },

  auteur: () : string => {
    return ''
  },

  coauteur: () : string => {
    return ''
  }
})
/**********************************************************************************/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bred { border: 2px solid $negative; border-radius: 5px; }
.byel { border: 2px solid var(--q-msgbg); border-radius: 5px; }
</style>
