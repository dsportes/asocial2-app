<template>
  <q-select dense options-dense 
    v-model="modelloc" :options="options" :label="title"
    class="q-ml-xs font-mono"
    :disable="disable"
    use-input
    fill-input
    multiple
    behavior="dialog"
    counter
    :max-values="maxValues || MAXV"
    @filter="filterFn">
    <template #append>
      <q-btn round icon="cancel" @click.stop.prevent="modelloc = []" />
      <q-btn round color="warning" size="xs" icon="check" @click.stop.prevent="doOk" />
    </template>
    <template #option="{ itemProps, opt, selected, toggleOption }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label v-html="opt.label" />
        </q-item-section>
        <q-item-section side>
          <q-toggle
            :model-value="selected"
            @update:model-value="toggleOption(opt)" />
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted, watch, computed } from 'vue'
import { DocEnums } from '../src-fw/operation'
import { hasMessage, eqNumberA } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

const MAXV = 3

const props = defineProps({
  title: String,
  disable: Boolean,
  svc: String,
  org: String,
  enum: String,
  maxValues: Number
})

const model = defineModel()

const modelloc = ref([])
const options = ref([])
const mopts: Ref<Map<string, any>> = ref()
const lst = ref([])
const initM = ref()

const mlst = computed(() => {
  const l = []
  for(const x of modelloc.value) l.push(x.value)
  return l
})
const changed = computed(() => !eqNumberA(initM.value, mlst.value))

const emit = defineEmits(['ok'])

watch(modelloc, () => {
  if (changed.value) model.value = mlst.value
})

const doOk = () => {
  emit('ok', mlst.value)
}

function filterFn(val, update) {
  update(() => {
    options.value = lst.value.filter(v => 
      v.label2.includes(val.toLowerCase()))
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
  mopts.value = new Map()
  const lx = await DocEnums.get(props.svc + '$' + props.enum, props.org)
  for(const e of lx) {
    const t = edv(e)
    l.push(t)
    mopts.value.set(t.value, t)
  }
  l.sort((a,b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0))
  lst.value = l
  options.value = [ ...lst.value ]
  if (model.value) {
    const mv = props.maxValues || MAXV
    const mx = model.value.length < mv ?  model.value.length : mv
    for(let i = 0; i < mx; i++)
      modelloc.value.push(mopts.value.get(model.value[i]))
    initM.value = [...model.value]
  } else initM.value = []
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
