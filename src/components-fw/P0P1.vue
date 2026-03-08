<template>
<div class="column full-width">
  <q-toolbar v-if="title" class="full-width tbs" dense>
    <q-toolbar-title class="titre-md text-italic">{{title}}</q-toolbar-title>
    <btn-cond size="sm" icon="check" round :disable="err" @ok="validate"/>
  </q-toolbar>

  <input-ps class="q-mb-sm" v-model="p0" size="p0" prefix="PSpseudo"
    :validatefn="validate" :valctrl="valctrl"/>

  <input-ps class="q-mb-sm" v-model="p1" size="p1" prefix="PSphrase"
    :validatefn="validate" :valctrl="valctrl"/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import InputPs from '../components-fw/InputPs.vue'
import { Crypt } from '../src-fw/crypt'

const props = defineProps({
  title: String,
  ctx: Object
})

const emit = defineEmits(['ok'])

const p0 = reactive( { inp: '', err: '' } )
const p1 = reactive( { inp: '', err: '' } )

/* retourne true si la fonction validate peut être appelée */
const valctrl = (() => {
  return p0.err === '' && p1.err === '' 
})

const validate = async () => {
  emit('ok', { 
    sh0: await Crypt.strongHash(p0.inp, true, true),
    sh1: await Crypt.strongHash(p1.inp, true, true),
    sh: await Crypt.strongHash(p0.inp + p1.inp, false, true),
    ctx: props.ctx || null 
  })
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
