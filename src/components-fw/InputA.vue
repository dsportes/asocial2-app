<!-- Input stanadrdisé A 
Commentaires dans Input-B.
-->
<template>
<div class="row">
  <btn-bubble class="col-auto q-mr-sm self-start" :text="$t(bubble)"/>
  <q-input class="col" v-model="model" counter dense
    :disable="disable"
    input-class="font-mono"
    :type="ui.visibility ? 'text' : 'password'"
    :label="$t(prefix + '_label')"
    :placeholder="ph"
    bottom-slots
    :error="err !== ''"
    :hint="hint"
    @keydown.enter.prevent="val">
    <template v-slot:append>
      <btn-cond v-if="!simple"
        round size="md" :icon="ui.visibility ? 'visibility' : 'visibility_off'"
        @ok="ui.visibility = !ui.visibility" color="none"/>
      <btn-cond v-if="!simple"
        round size="md" icon="close" @ok="model = ''"
        :disable="disable || model.length === 0" color="none"/>
      <btn-cond v-if="!simple && hasInitVal && !disable && chg"
        size="md" icon="undo" color="none" round 
        @ok="undo" />
      <btn-cond v-if="!nv" size="md" label="OK" padding="0 xs"
        :disable="disable || err !== ''"
        @ok="emit('validate', true)" />
      <btn-cond v-if="!simple && mayStar" 
        size="md" icon="star" color="warning" round
        @ok="model = fill(model)"/>
      <btn-cond v-if="list && list.length" size="md" icon="arrow_drop_down"
        dense padding="none" color="primary">
        <q-menu auto-close>
          <div class="column q-pa-xs items-start">
            <q-btn dense flat no-caps v-for="x in list" :key="x" :label="x"
              @click="model = x; emit('validate', true)"/>
          </div>
        </q-menu>
      </btn-cond>
    </template>
    <template v-slot:error>{{$t(err)}}</template>
  </q-input>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const ui = stores.ui
const config = stores.config

const model = defineModel() // Dans le script accessible par model.value
const emit = defineEmits(['validate', 'change'])

const props = defineProps({
  simple: Boolean,
  size: String, // obligatoire
  prefix: String, // obligatoire
  initval: String,
  disable: Boolean,
  noval: Boolean, // pas d'émission de 'validate' (ni 'check', ni 'Enter')
  list: Array,
  fncheck: Function
})

const star = config.K.phrasestar[props.size] || 0

const nv = ref(props.noval || false)

const err = ref('')

watch(() => props.noval, (v) => {
  nv.value = v
})

const sz = ref(stores.config.K.sizes[props.size] || [0, 80])

const reg = sz.value.length > 2 ? config.K.regexp[sz.value[2]] || null : null

const bubble = computed(() => {
  let b = props.prefix + '_bub'
  if (hasMessage(b)) return b
  if (sz.value.length > 2) {
    b = 'REGexp_' + sz.value[2]
    if (reg && hasMessage(b)) return b
  }
  return 'REGexp_all'
})

const mayStar = computed(() => 
  star && !props.disable && model.value.length > star && model.value.endsWith('*'))

const ph = computed(() => {
  const e = (props.prefix || '') + '_ph'
  return hasMessage(e) ? $t(e) : ''
})

const fill = (v) => {
  const x = v.substring(0, v.length - 1)
  let s = ''; while (s.length < sz.value[1]) s += x
  return s
}

const hasInitVal = computed(() => props.initval && props.initval.length )
const chg = computed(() => !props.disable && hasInitVal.value && props.initval.value !== model.value)
const hint = computed(() => 
  $t('minmax', sz.value) + (!err.value && !nv.value ? $t('pressret') : ''))
const undo = () => {
  if (props.initval) model.value = props.initval }

const xe = () => {
  if (!model.value) return 'tooshort'
  if (reg && model.value.length && !reg.test(model.value)) return 'badform'
  if (model.value.length < sz.value[0]) return 'tooshort'
  if (model.value.length > sz.value[1]) return 'toolong'
  if (props.size === 'isotime' && isNaN(Date.parse(model.value))) return 'badform'
  return props.fncheck ?  props.fncheck(model.value) : ''
}

watch(() => model.value, (v) => { 
  err.value = xe()
  if (err.value === '' && !props.disable) emit('change', true)
})
err.value = xe()

const val = () => {
  if (!nv.value && !props.disable && err.value === '')
    emit ('validate', true)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
