<template>
  <div class="column full-width">
    <q-toolbar class="full-width tbs" dense>
      <q-toolbar-title class="titre-md text-italic">{{title}}</q-toolbar-title>
      <btn-cond size="sm" icon="check" round :disable="err" @ok="validate"/>
    </q-toolbar>

    <input-ps class="q-ml-md q-mb-sm" v-model="p0" :validate="validate"
      :sz="cfg.K.sizeP0" :label="$t('PSpseudo')" :ph="$t('PSpseudoh')"/>

    <input-ps class="q-ml-md q-mb-sm" v-model="p1" :validate="validate"
      :sz="cfg.K.sizeP1" :label="$t('PSphrase')" :ph="$t('PSphraseh')"/>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import InputPs from '../components-fw/InputPs.vue'
import { Crypt } from '../src-fw/crypt'

const cfg = stores.config

const ui = stores.ui

const props = defineProps({
  title: String,
  ctx: Object
})

const emit = defineEmits(['ok'])

const p0 = reactive( { inp: '', err: '' } )
const p1 = reactive( { inp: '', err: '' } )
const p1err = computed(() => p1.value.length < minp1 ? 'PScourt' : (p1.value.length > maxp1 ? 'PSlong' : ''))
const err = computed(() => p0.err !== '' || p1.err !== '')

const validate = async () => {
  if (err.value) return
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
