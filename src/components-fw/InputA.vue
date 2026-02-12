<template>
<div class="row">
  <btn-bubble class="col-auto q-mr-sm self-start" :text="$t(bubble)"/>
  <q-input class="col" v-model="m" counter dense
    :disable="_disable"
    filled
    input-class="font-mono"
    :type="ui.visibility ? 'text' : 'password'"
    :label="$t(prefix + '_label')"
    :placeholder="ph"
    bottom-slots
    :error="err !== ''"
    :hint="hint"
    @keydown.enter.prevent="diffval">
    <template v-slot:append>
      <btn-cond round size="md" :icon="ui.visibility ? 'visibility' : 'visibility_off'" 
        @ok="ui.visibility = !ui.visibility" color="none"/>
      <btn-cond round size="md" icon="close" @ok="m = ''" 
        :disable="_disable || !m || m.length === 0" color="none"/>
      <btn-cond round v-if="hasInitVal" 
        size="md" icon="undo" @ok="undo" :disable="_disable || !chg" color="none"/>
      <btn-cond v-if="validatefn" size="md" icon="check" round
        :disable="!mayVal" color="warning" @ok="val" />
      <btn-cond v-if="star && mayStar && !_disable" size="md" icon="star" 
        color="warning"
        @ok="m = fill(m); diffval()"
      />
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

const m = defineModel() // Dans le script accessible par m.value

const props = defineProps({
  size: String,
  prefix: String,
  initval: String,
  disable: Boolean,
  validatefn: Function,
  objerr: Object,
  valctrl: Function
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
const star = (config.K.phrasestar || false) && (props.size === 'ps' || props.size === 'p1')
const disval = ref(false)
const mayStar = computed(() => m.value.length > 2 && m.value.endsWith('*'))
const mayVal = computed(() => 
  !_disable.value && err.value === '' && chg.value && !disval.value)

const ph = computed(() => {
  const e = (props.prefix || '') + '_ph'
  return hasMessage(e) ? $t(e) : ''
})

const fill = (v) => {
  const x = v.substring(0, v.length - 1)
  let s = ''; while (s.length < sz.value[1]) s += x
  return s
}

const diffval = () => {
  setTimeout(() => {
    if (mayVal.value)
      val()
  }, 50)
}

const _disable = ref()
const _initval = ref()
const hasInitVal = computed(() => {
  if (typeof(_initval.value) === 'undefined') return false
  if (_initval.value === null) return false
  return true
})

const init = () => {
  _disable.value = typeof(props.disable) !== 'undefined' ? props.disable : false
  _initval.value = typeof(props.initval) !== 'undefined' ? 
    (props.initval ? props.initval : null) : null
}

init()
watch(() => props.initval, () => { 
  init() 
})
watch(() => props.disable, () => { 
  init() 
})

const chg = computed(() => _initval.value !== null ? _initval.value !== m.value : true)
const hint = computed(() => $t('minmax', sz.value) + (!err.value ? $t('pressret') : ''))

const xe = () => {
  if (reg && !reg.test(m.value)) return 'badform'
  if (m.value.length < sz.value[0]) return 'tooshort'
  if (m.value.length > sz.value[1]) return 'toolong'
  return ''
}

const err = ref()
const setx = () => {
  err.value = xe()
  if (props.objerr) props.objerr.err = err.value
  disval.value = props.valctrl && !props.valctrl()
}
watch(m, (v) => { setx() })
setx()

const undo = () => {
  if (_initval.value !== null) m.value = _initval.value
}

const val = () => {
  if (props.validatefn && !_disable.value && err.value === '') 
    props.validatefn()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
