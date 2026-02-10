<template>
  <q-input v-model="m" counter dense
    :disable="_disable"
    filled
    input-class="font-mono"
    :type="ui.visibility ? 'text' : 'password'"
    :label="$t(prefix + '_label')"
    :placeholder="ph"
    bottom-slots
    :error="err !== ''"
    :hint="hint"
    @keydown.enter.prevent="val">
    <template v-slot:append>
      <btn-cond round size="md" :icon="ui.visibility ? 'visibility' : 'visibility_off'" 
        @ok="ui.visibility = !ui.visibility" color="none"/>
      <btn-cond round size="md" icon="close" @ok="m = ''" 
        :disable="_disable || m.length === 0" color="none"/>
      <btn-cond round v-if="_initval !== null" size="md" icon="undo" 
        @ok="undo" :disable="_disable || !chg" color="none"/>
      <btn-cond v-if="validatefn" size="md" icon="check" round
        :disable="_disable || err !== '' || !chg" color="warning"
        @ok="val" />
    </template>
    <template v-slot:error>{{$t(err)}}</template>
  </q-input>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const config = stores.config

const m = defineModel() // Dans le script accessible par m.value

const props = defineProps({
  size: String,
  prefix: String,
  initval: String,
  disable: Boolean,
  validatefn: Function
})

const sz = stores.config.K.sizes[props.size] || [0, 80]
const ph = computed(() => {
  const e = (props.prefix || '') + '_ph'
  const x = $t(e)
  return e === x ? '' : x
})

const _disable = ref()
const _initval = ref()

const init = () => {
  _disable.value = props.disable !== 'undefined' ? props.disable : false
  _initval.value = props.initval !== 'undefined' ? props.initval : null
}

init()
watch(() => props.initval, () => { 
  init() 
})
watch(() => props.disable, () => { 
  init() 
})

const chg = computed(() => _initval.value !== null ? _initval.value !== m.value : false)
const hint = computed(() => $t('minmax', sz) + (!err.value ? $t('pressret') : ''))
const err = computed(() => {
  const x = m.value.length < sz[0] ? 'tooshort' : 
  (m.value.length > sz[1] ? 'toolong' : '')
  return x
})

const undo = () => {
  if (_initval.value !== null) m.value = _initval.value
}
const val = () => {
  if (props.validatefn && !_disable.value) props.validatefn()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
