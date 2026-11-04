<template>
  <q-select dense options-dense
    v-model="modelloc" :options="options" :label="title"
    class="q-ml-xs font-mono"
    :disable="disable"
    clearable
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    @filter="filterFn"/>
</template>

<script setup lang="ts" vapor>
import { ref, Ref, onMounted, watch } from 'vue'
import { DocEnums } from '../src-fw/operation'
import { hasMessage } from '../src-fw/util'
import { CodeLabel } from '../src-fw/base'

const props = defineProps<{
  title?: string,
  disable?: boolean,
  svc: string,
  org: string,
  enum: string
}>()

const model = defineModel<string>()

type Tlst = { value: string, label: string, label2: string }

// @ts-expect-error
const modelloc: Ref<Tlst> = ref()
const options: Ref<Tlst[]> = ref([])
const lst: Ref<Tlst[]>= ref([])

const emit = defineEmits(['select'])

watch(() => modelloc.value, (t) => {
  if (model.value !== t.value) {
    model.value = t.value
    emit('select', t.value)
  }
})

function filterFn(val: string, update: Function) {
  update(() => {
    options.value = lst.value.filter(v =>
      v.label2.includes(val.toLowerCase()))
  })
}

const edv = ([c, l]: CodeLabel) : Tlst => {
  const lbl1 = hasMessage('ENUM_' + props.svc + '$' + props.enum + '_' + c)
  const lbl2 = (lbl1 || l).toLowerCase()
  return { value: c, label: lbl1 || l, label2: lbl2 }
}

const load = async () => {
  const l: Tlst[] = []
  const lx: CodeLabel[] = await DocEnums.get(props.svc, props.enum, props.org)
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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.lst { overflow-x:hidden; overflow-y:auto; border: 1px solid $grey-5 }
.sely:hover { border-color: $yellow-5;}
.sely { border:1px solid transparent; border-radius: 5px; cursor:pointer!important;}
</style>
