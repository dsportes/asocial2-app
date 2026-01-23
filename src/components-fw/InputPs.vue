<template>
  <q-input v-model="modelValue.inp" counter dense
    :disable="disable"
    input-class="font-mono"
    :type="ui.visibility ? 'text' : 'password'"
    :label="label"
    :placeholder="ph"
    bottom-slots
    :error="modelValue.err !== ''"
    :hint="hint"
    @keydown.enter.prevent="validate && !disable ? validate() : ''">
    <template v-slot:append>
      <q-icon size="sm" :name="ui.visibility ? 'visibility' : 'visibility_off'" 
        @click="ui.visibility = !ui.visibility" class="cursor-pointer" />
      <q-icon size="sm" name="close" @click="modelValue.inp = ''" 
        class="cursor-pointer" :disable="disable"/>
      <q-btn v-if="iconcheck && validate" size="sm" icon="check" 
        :disable="disable || modelValue.err !== ''" color="primary" round
        @click="validate" />
    </template>
    <template v-slot:error>{{$t(modelValue.err)}}</template>
  </q-input>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'

const ui = stores.ui

const props = defineProps({
  sz: Array,
  label: String,
  ph: String,
  validate: Function,
  iconcheck: Boolean,
  disable: Boolean
})

const modelValue = defineModel() // Dans le script accessible par .value
const inp = computed(() => modelValue.value.inp) // Pour le watch

const err = computed(() => inp.value.length < props.sz[0] ? 'PScourt' : 
  (inp.value.length > props.sz[1] ? 'PSlong' : ''))
const hint = computed(() =>
  $t('PSminmax', props.sz) + 
  (props.validate && !props.disable && !modelValue.value.err ? $t('pressret') : ''))

modelValue.value.err = err.value // Valeur initiale de l'erreur

watch(inp, (v) => {
  if (v.length > 2 && v.endsWith('*')) {
    const x = v.substring(0, v.length - 1)
    let s = ''; while (s.length < props.sz[1]) s += x
    modelValue.value.inp = s
  }
  modelValue.value.err = err.value // Rafraichir l'erreur
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
