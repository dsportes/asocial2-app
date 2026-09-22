<template>
<dialog-std0 v-model="model" @close="checkClose"
  :title="title" vh="80"
  :help="$t('ENUMtit_bub')">
  <template #btn>
  </template>
  <template #hdr>
    <div class="row items-center">
      <div class="row col q-gutter-sm">
        <q-input v-model="selc" standout dense class="col"
          placeholder="abc" :hint="$t('ENUfiltc')">
          <template v-if="selc" v-slot:prepend>
            <q-icon name="cancel" @click.stop.prevent="selc = ''" class="cursor-pointer"/>
          </template>
        </q-input>
        <q-input v-model="sell" standout dense class="col"
          placeholder="abc" :hint="$t('ENUfiltl')">
          <template v-if="sell" v-slot:prepend>
            <q-icon name="cancel" @click.stop.prevent="sell = ''" class="cursor-pointer"/>
          </template>
        </q-input>
      </div>
      <div class="row col-auto q-ml-lg q-gutter-xs items-center">
        <btn-cond color="none" icon="add" flat @ok="addItem"/>
        <btn-cond color="none" icon="undo" flat @ok="undoEnum" :disable="!ui.editingInCourse"/>
        <btn-cond color="none" icon="check" flat @ok="valEnum" :disable="!ui.editingInCourse"/>
      </div>
    </div>
  </template>
  <template #default>
    <div class="q-pa-sm">
      <div v-for="(t, idx) in lstD" :key="t[0]">
        <div :class="dkli(idx) + ' row items-center select'">
          <div class="col-1 font-mono fs-sm">{{  t[0] + 1 }}</div>
          <btn-cond class="col-1" icon="delete" flat @ok="delItem(t[0])"/>
          <line-edit class="col-4 font-mono" :text="t[1]" :ctx="{ idx: t[0], v: t[1] }"
            :datasize="svc + '$' + name + 'C'" width="sm" @change="majC"/>
          <line-edit class="col-6 font-mono" :text="t[2]" :ctx="{ idx: t[0], v: t[2] }"
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
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'

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

const edv = (x) => {
  const lbl = hasMessage('ENUM_' + props.svc + '$' + props.name + '_' + x[0]) 
  const t = [0, x[0], lbl || x[1]]
  return t
}

const lst = ref([])
const lst0 = ref([])
const selc = ref('')
const sell = ref('')

const lstD = computed(() => {
  const l = []
  for(let i = 0; i < lst.value.length; i++) {
    const t = lst.value[i]
    if ( !t[1] || !t[2] ||
      ((!selc.value || t[1].indexOf(selc.value) !== -1) &&
     (!sell.value || t[2].indexOf(sell.value) !== -1))) {
      t[0] = i
      l.push(t)
    }
  }
  return l
})

const chg = () => {
  lst.value.sort((a,b) => a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0))
  if (lst.value.length !== lst0.value.length) { ui.setEditing(); return }
  for(let i = 0; i < lst.value.length; i++)
    if ((lst.value[i][1] !== lst0.value[i][1]) || (lst.value[i][2] !== lst0.value[i][2])) { 
      ui.setEditing()
      return
    }
  ui.resetEditing()
}

const init1 = async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.name, props.org)
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0))
  lst.value = l
  lst0.value = [...l]
  ui.resetEditing()
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
  lst.value.push([0, '', ''])
  chg()
}
const valEnum = async () => {
  const l = []
  for(const t of lst.value)
    if (t[1] && t[2]) l.push([t[1], t[2]])
  await DocEnums.set(props.svc + '$' + props.name, l, props.org)
  await init1()
}
const undoEnum = () => {
  lst.value = [...lst0.value]
  ui.resetEditing()
}
const majC = async (ctx) => {
  if (!ctx.value) { await ui.diagDisplay($t('ENUMcm')); return }
  for(let i = 0; i < lst.value.length; i++) 
    if (i !== ctx.idx && lst.value[i][1] === ctx.value) {
      await ui.diagDisplay($t('ENUMdup', [i + 1]))
      return
    }
  lst.value[ctx.idx][1] = ctx.value
  chg()
}
const majL = async (ctx) => {
  if (!ctx.value) { await ui.diagDisplay($t('ENUMlm')); return }
  lst.value[ctx.idx][2] = ctx.value
  chg()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>