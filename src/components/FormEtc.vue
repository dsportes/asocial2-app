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
  <div v-if="estComite" class="q-my-md">
    <div class="titre-md q-mt-md">{{  $t('TYPE_membrecodir_pseudo') }}</div>

    <div v-if="fst.visU" class="row q-px-xs items-center">
      <input-b v-if="fst.isDemand && fst.editable"
        class="col font-mono text-bold" size="pseudo" prefix="FORMdem_2"
        v-model="pseudo" noval :initval="psU"/>
      <input-b v-else
        class="col font-mono text-bold" size="pseudo" prefix="FORMdem_2"
        v-model="pseudo2" noval :initval="pseudo2.inp" disable/>
      <btn-cond v-if="fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyPseudoU"/>
      <btn-cond v-if="fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initPseudoU"/>
    </div>

    <div v-if="fst.visT" class="row q-px-xs items-center">
      <input-b v-if="!fst.isDemand && fst.editable"
        class="col font-mono text-bold" size="pseudo" prefix="FORMprop_2"
        v-model="pseudo" noval :initval="psT"/>
      <input-b v-else
        class="col font-mono text-bold" size="pseudo" prefix="FORMprop_2"
        v-model="pseudo2" noval :initval="pseudo2.inp" disable/>
      <btn-cond v-if="!fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="content_paste" @ok="copyPseudoT"/>
      <btn-cond v-if="!fst.isDemand && fst.editable" class="col-auto q-ml-sm"
        flat icon="star" @ok="initPseudoT"/>
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

const fst = stores.form

const estComite = computed(() => fst.form.type === 'membreredaction' || fst.form.type === 'membrecodir')

const psU = computed(() => fst.form.cloneEtc(true).pseudo)
const psT = computed(() => fst.form.cloneEtc(false).pseudo)
const pseudo = reactive({ inp: '', err: '' })
watch(pseudo, async (v) => {
  fst.upd.etc.pseudo = v.inp
  await fst.onChange()
})
watch(() => fst.upd.etc, (v) => {
  pseudo.inp = v.pseudo
})
const pseudo2 = reactive({ inp: '', err: '' })
pseudo.inp = fst.upd.etc.pseudo
pseudo2.inp = fst.isDemand ? psT.value : psU.value
const copyPseudoU = () => { pseudo.inp = psT.value }
const copyPseudoT = () => { pseudo.inp = psU.value }
const initPseudoU = () => { pseudo.inp = psU.value }
const initPseudoT = () => { pseudo.inp = psT.value }


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
