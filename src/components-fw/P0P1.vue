<!-- Boîte de saisie d'un couple P0 (pseudo) / P1 (phrase)
Event 'ok' émis quand saisie OK: { sh0, sh1, sh }
  - sh0: await Crypt.strongHash(p0.inp, true, true),
  - sh1: await Crypt.strongHash(p1.inp, true, true),
  - sh: await Crypt.strongHash(p0.inp + p1.inp, false, true),
-->
<template>
<div class="column full-width">
  <q-toolbar v-if="title" class="full-width tbs" dense>
    <q-toolbar-title class="titre-md text-italic">{{title}}</q-toolbar-title>
    <btn-cond size="sm" icon="check" round 
      :disable="err" 
      @ok="validate"/>
  </q-toolbar>

  <input-b class="q-mb-sm" v-model="p0" size="p0" prefix="PSpseudo" 
    :noval="err" @validate="validate"/>

  <input-b class="q-mb-sm" v-model="p1" size="p1" prefix="PSphrase" 
    :noval="err" @validate="validate"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch, computed } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'
import { Crypt } from '../src-fw/crypt'

const props = defineProps({
  title: String,
  ctx: Object
})

const emit = defineEmits(['ok'])

const p0 = reactive( { inp: '', err: '' } )
const p1 = reactive( { inp: '', err: '' } )
const err = computed(() => p0.err !== '' || p1.err !== '' )

const validate = async () => {
  emit('ok', { 
    sh0: await Crypt.strongHash(p0.inp, true, true),
    sh1: await Crypt.strongHash(p1.inp, true, true),
    sh: await Crypt.strongHash(p0.inp + p1.inp, false, true)
  }, props.ctx || null)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
