<template>
<dialog-std0 v-model="model" @close="emit('close', true)"
  :title="title"
  :help="$t('SLCtit_bub')">
  <template #btn>
    <btn-cond :label="$t('ok')" padding="none xs" color="warning"
      @ok="ok"/>
  </template>
  <template #hdr>
    <q-input :class="sty() + ' full-width q-ma-xs'" filled 
      v-model="filter" :label="$t('SLCsel')">
      <template v-slot:append>
        <q-icon name="close" @click="filter = ''" class="cursor-pointer" />
      </template>
    </q-input>
  </template>
  <template #default>
    <div class="full-width q-pa-sm column items-center q-gutter-xs">
      <div v-for="(code, idx) in filtered" :key="code"
        :class="'select cursor-pointer ' + (idx === 0 ? 'current' : 'nocurrent')"
        @click="sel(code)">{{  code }}</div>
    </div>
  </template>
</dialog-std0>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { sty } from '../src-fw/util'

const model = defineModel()

const props = defineProps({
  values: Array,
  title: String
})

const filter = ref('')
const svalues = ref([])
const filtered = ref([])

const init = () => {
  svalues.value = [ ...props.values ]
  if (svalues.length) svalues.value.sort((a,b) => a < b ? -1 : (a > b ? 1 : 0 ))
  doFilter()
}

const doFilter = () => {
  const l: string[] = []
  const f = filter.value.toUpperCase()
  for(const c of svalues.value)
    if (c.toUpperCase().indexOf(f) !== -1) l.push(c)
  filtered.value = l
}

watch(filter, (v) => {
  doFilter()
})

const emit = defineEmits([
  'select', // code sélectionné
  'close' // sortie SANS sélection
])

const sel = (code) => {
  emit('select', code)
  model.value = false
}

const ok = () => {
  if (filtered.value.length) sel(filtered.value[0])
  else { emit('close', true); model.value = false }
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
