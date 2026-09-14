<template>
<div ref="coredacpage" class="column items-center">
<div class="pwmd" style="position:relative">
  <q-splitter v-model="splitterModel" horizontal :style="pageh">
    <template v-slot:before>
    <div class="q-pa-xs q-mr-xl">
      <div v-for="(t, idx) in lst" :key="t[0]">
        <div :class="dkli(idx) + ' row items-center select' + cur(t)"" @click="selSection(t)">
          <btn-cond icon="delete" flat @ok="delSection(idx)" :disable="!edit"/>
          <line-edit class="col-4 font-mono" :text="t[0]" :ctx="{ idx, v: t[0] }"
            datasize="sectionC" width="sm" :fncheck="checkcode" @change="majC"
            :disable="!edit"/>
          <line-edit class="col-7 font-mono" :text="t[1]" :ctx="{ idx, v: t[1] }"
            datasize="sectionL" width="md" @change="majL"
            :disable="!edit"/>
        </div>
      </div>
    </div>
    </template>

    <template v-slot:after>

    </template>
  </q-splitter>
  <div v-if="edit" class="column q-gutter-xs bord1" 
    style="position:absolute;top:8px;right:0;">
    <btn-cond icon="add" flat @ok="addSection"/>
    <btn-cond icon="undo" flat @ok="undoSection" :disable="!hasChg"/>
    <btn-cond icon="check" flat @ok="valSection" :disable="!hasChg"/>
  </div>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch, useTemplateRef } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage, dkli } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import { DocEnums } from '../src-fw/operation'
import LineEdit from '../components-fw/LineEdit.vue'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const coredacpage = useTemplateRef('coredacpage')

const pageh = ref(100)
const ph = () => { setTimeout(() => {
    const h = coredacpage.value.parentNode.style.minHeight
    pageh.value = 'height:' + h + ';'
    //console.log(pageh.value)
  },5)
}

const edit = computed(() => session.hasNet && ui.appPage.org )
const cur = (t) => {
  if (!edit.value) return ''
  return t[0] === ui.appPage.section ? 'current cursor-pointer' : 'nocurrent cursor-pointer'
}

onMounted(() => {  ph() })

watch(() => ui.screenHeight, () => { ph() })

ui.appPage.org = ''
ui.appPage.sectionL = ''
ui.appPage.section = ''

watch(() => ui.appPage.org, async () => { 
  await init1() 
})

const edv = (e) => {
  let code:string = '?', lbl: string = '?'
  if (e) {
    const i = e.indexOf(' ')
    code = i === -1 ? e : e.substring(0, i)
    lbl = hasMessage('ENUM_AS2$Section_' + code) || (i !== -1 ? e.substring(i + 1): e)
  }
  const t = [code, lbl]
  return t
}

const lst = ref([])
const lst0 = ref([])
const hasChg = ref(false)

const chg = () => {
  lst.value.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  if (lst.value.length !== lst0.value.length) { hasChg.value = true; return }
  for(let i = 0; i < lst.value.length; i++)
    if ((lst.value[i][0] !== lst0.value[i][0]) || (lst.value[i][0] !== lst0.value[i][0])) 
      { hasChg.value = true; return }
  hasChg.value = false
}

const init1 = async () => { 
  const l = []
  const lx = await DocEnums.get('AS2$Section', ui.appPage.org)
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  lst.value = l
  lst0.value = [...l]
}

const splitterModel = ref(33)

const selSection = (t) => {
  ui.appPage.section = t[0]
  ui.appPage.sectionL = t[1]
}

const delSection = (idx) => {
  lst.value.splice(idx, 1)
  chg()
}
const addSection = async () => {
  lst.value.push(['', '?'])
  chg()
}
const valSection = async () => {

}
const undoSection = () => {
  lst.value = [...lst0.value]
  hasChg.value = false
}
const checkcode = (v, ctx) => {
  for(let i = 0; i < lst.value.length; i++) 
    if (i !== ctx.idx && lst.value[i][0] === v) return 'CODIRdup'
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
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
