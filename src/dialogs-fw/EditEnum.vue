<template>
<dialog-std0 v-model="model" @close="checkClose"
  :title="title" vh="80"
  :help="$t('ENUtit_bub')">
  <template #btn>
  </template>
  <template #hdr>
    <div class="row items-center">
      <div class="row col q-gutter-sm">
        <q-input v-model="selc" standout dense class="col"
          @keydown.enter.prevent="filtc"
          placeholder="abc" :hint="$t('ENUfiltc')">
          <template v-if="selc" v-slot:prepend>
            <q-icon name="cancel" @click.stop.prevent="selc = ''" class="cursor-pointer"/>
          </template>
        </q-input>
        <q-input v-model="sell" standout dense class="col"
          @keydown.enter.prevent="filtl"
          placeholder="abc" :hint="$t('ENUfiltl')">
          <template v-if="sell" v-slot:prepend>
            <q-icon name="cancel" @click.stop.prevent="sell = ''" class="cursor-pointer"/>
          </template>
        </q-input>
      </div>
      <div class="row col-auto q-ml-lg q-gutter-xs items-center">
        <btn-cond icon="add" flat @ok="addItem"/>
        <btn-cond icon="undo" flat @ok="undoEnum" :disable="!hasChg"/>
        <btn-cond icon="check" flat @ok="valEnum" :disable="!hasChg"/>
      </div>
    </div>
  </template>
  <template #default>
    <div class="q-pa-xs">
      <div v-for="(t, idx) in lstD" :key="t[0]">
        <div :class="dkli(idx) + ' row items-center select' + cur(t)">
          <btn-cond icon="delete" flat @ok="delItem(idx)"/>
          <line-edit class="col-4 font-mono" :text="t[0]" :ctx="{ idx, v: t[0] }"
            :datasize="svc + '$' + name + 'C'" width="sm" :fncheck="checkcode" @change="majC"/>
          <line-edit class="col-7 font-mono" :text="t[1]" :ctx="{ idx, v: t[1] }"
            datasize="svc + '$' + name + 'C'" width="md" @change="majL"/>
        </div>
      </div>
    </div>
  </template>
</dialog-std0>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch, onMounted } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage, dkli } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import { DocEnums } from '../src-fw/operation'
import LineEdit from '../components-fw/LineEdit.vue'

const ui = stores.ui

const model = defineModel()
const emit = defineEmits(['close', 'done'])

const props = defineProps({
  svc: String,
  name: String, // 'Section'
  org: String,
  title: String
})

const checkClose = async () => {
  const b = await ui.mayClose()
  if (b) {
    model.value = false
    emit('close', true)
  } else 
    model.value = true
}

const edv = (e) => {
  let code:string = '?', lbl: string = '?'
  if (e) {
    const i = e.indexOf(' ')
    code = i === -1 ? e : e.substring(0, i)
    lbl = hasMessage('ENUM_' + props.svc + '$' + props.name + '_' + code) || (i !== -1 ? e.substring(i + 1): e)
  }
  const t = [code, lbl]
  return t
}

const lst = ref([])
const lst0 = ref([])
const hasChg = ref(false)
const filc = ref('')
const fill = ref('')

const lstD = computed(() => {
  const l = []
  for(const t in lst.value)
    if ((!filc.value || t[0].indexOf(filc.value) !== -1) &&
     ((!fill.value || t[1].indexOf(fill.value) !== -1))) l.push(t)
  return l
})

const chg = () => {
  lst.value.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  if (lst.value.length !== lst0.value.length) { hasChg.value = true; return }
  for(let i = 0; i < lst.value.length; i++)
    if ((lst.value[i][0] !== lst0.value[i][0]) || (lst.value[i][0] !== lst0.value[i][0])) { 
      hasChg.value = true
      ui.editingInCourse = true
    }
  hasChg.value = false
  ui.editingInCourse = false
}

const init1 = async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.name, props.org)
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  lst.value = l
  lst0.value = [...l]
  ui.editingInCourse = false
}

onMounted(async () => {  await init1() })

watch(() => props.org, async () => { 
  await init1() 
})

const delItem = (idx) => {
  lst.value.splice(idx, 1)
  chg()
}
const addItem = async () => {
  lst.value.push(['', '?'])
  chg()
}
const valEnum = async () => {
  await DocEnums.set(props.svc + '$' + props.name, lst.value, props.org)
}
const undoEnum = () => {
  lst.value = [...lst0.value]
  hasChg.value = false
  ui.editingInCourse = false
}
const checkcode = (v, ctx) => {
  for(let i = 0; i < lst.value.length; i++) 
    if (i !== ctx.idx && lst.value[i][0] === v) return 'ENUMdup'
  return ''
}
const majC = (ctx) => {
  lst.value[ctx.idx][0] = ctx.value
  chg()
}
const majL = (ctx) => {
  lst.value[ctx.idx][1] = ctx.value
  chg()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>