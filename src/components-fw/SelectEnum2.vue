<template>
  <q-select dense options-dense 
    v-model="modelloc" :options="options" :label="title"
    :class="'q-ml-xs font-mono ellipsis mw' + (width || 'sm')"
    :disable="disable" 
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    @filter="filterFn"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch } from 'vue'
import { DocEnums } from '../src-fw/operation'
import { $t, hasMessage } from '../src-fw/util'

const props = defineProps({
  title: String,
  disable: Boolean,
  svc: String,
  org: String,
  enum: String,
  width: String
})

const model = defineModel()

const modelloc = ref()
const options = ref([])
const lst = ref([])

const emit = defineEmits(['select'])
watch(() => modelloc.value, (t) => {
  if (model.value !== t.value) {
    model.value = t.value
    emit('select', t.value)
  }
})

function filterFn(val, update) {
  update(() => {
    const needle = val.toLowerCase()
    options.value = lst.value.filter(v => 
      v.label2.includes(needle))
  })
}

const edv = (e) => {
  const lbl1 = hasMessage('ENUM_' + props.svc + '$' + props.enum + '_' + e[0]) 
  const lbl2 = (lbl1 || e[1]).toLowerCase()
  const t = { value: e[0], label: lbl1 || e[1], label2: lbl2 }
  return t
}

const load = async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.enum, props.org)
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0))
  lst.value = l
  options.value = [ ...lst.value ]
  const iv = initv()
  if (iv) modelloc.value = iv
  else if (lst.value.length === 1)
    modelloc.value = lst.value[0]
}

const initv = () => {
  const v = model.value
  if (v) for (const x of lst.value) if (v === x.value) 
    return x
  return null
}

watch(() => [props.svc, props.org, props.enum], async () => {
  await load()
})
onMounted(async () => { await load()})

/*
const shl = computed(() => {
  const l = []
  const s = sel.value.toLowerCase()
  for (const x of lst.value) 
    if (!sel.value || x[2].indexOf(s) !== -1) l.push(x)
  return l
})

const clic = (t) => {
  model.value = t[0]
  menu.value = false
  emit('select', t)
}

const cr = () => {
  if (shl.value.length === 1) clic(shl.value[0])
}
  */

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.lst { overflow-x:hidden; overflow-y:auto; border: 1px solid $grey-5 }
.sely:hover { border-color: $yellow-5;}
.sely { border:1px solid transparent; border-radius: 5px; cursor:pointer!important;}
</style>
