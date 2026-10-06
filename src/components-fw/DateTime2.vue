<template>
<div class="q-pa-sm column items-center">
  <div class="q-pb-xs row items-center justify-between" 
    style="height:36px !important; min-width:260px; max-width:600px;">
    <div v-if="!diag" class="col titre-md text-italic">
      {{ title }}
    </div>
    <div v-else class="col column">
      <div class="titre-xs text-italic">{{ title }}</div>
      <div class="msg4">{{ diag }}</div>
    </div>
    <btn-cond v-if="diag === ''" round icon="check" @ok="dook"
      class="col-auto q-ml-sm"
      :disable="diag !== ''"
      :color="diag ? 'grey-5' : 'green-5'"/>
  </div>
  
  <div class="row col-auto justify-around">
    <date-time v-model="m1" :label="$t('startdt')" no-ok-btn class="q-mx-sm col-auto"
      :undoFn="next.start !== m1 ? undoM1 : null" :disable="disable"/>
    <date-time v-model="m2" :label="$t('enddt')" no-ok-btn class="q-mx-sm col-auto"
      :undoFn="next.end !== m2 ? undoM2 : null" :disable="disable"/>
  </div>
</div>
</template>

<script setup lang="ts">
export type startEnd = {
  start: number
  end: number
}

// @ts-ignore
import { ref, Ref, watch, reactive, computed } from 'vue'
// @ts-ignore
import { date } from 'quasar'
import BtnCond from '../components-fw/BtnCond.vue'
import DateTime from '../components-fw/DateTime.vue'
import { $t } from '../src-fw/util'

const model: Ref<startEnd> = defineModel()
const emit = defineEmits(['ok']) 
const props = defineProps({
  checkfn: Function,
  title: String,
  disable: Boolean
})
const diag = ref('')
const m1 = ref('')
const m2 = ref('')
const m1i = ref(0)
const m2i = ref(0)
const next = reactive({
  start: model.value.start,
  end: model.value.end
})

const init = () => {
  m1i.value = model.value[0]
  m2i.value = model.value[1]
  m1.value = m1i.value ? date.formatDate(m1i.value * 60000, 'YYYY-MM-DD HH:mm') : ''
  m2.value = m2i.value ? date.formatDate(m2i.value * 60000, 'YYYY-MM-DD HH:mm') : ''
  check()
}

const undoM1 = () => {
  m1.value = m1i.value ? date.formatDate(m1i.value * 60000, 'YYYY-MM-DD HH:mm') : ''
}

const undoM2 = () => {
  m2.value = m2i.value ? date.formatDate(m2i.value * 60000, 'YYYY-MM-DD HH:mm') : ''
}

watch(() => [m1.value, m2.value], () => { 
  check()
  /* console.log('check', 
    next.start ? date.formatDate(next.start, 'YYYY-MM-DD HH:mm') : 0,
    next.end ? date.formatDate(next.end, 'YYYY-MM-DD HH:mm') : 0) */
})

const check = () => {
  if (props.disable) { diag.value = ''; return }
  const now = Math.floor(Date.now() / 60000)
  next.start = m1.value ? Math.floor(date.extractDate(m1.value, 'YYYY-MM-DD HH:mm').getTime() / 60000) : 0
  next.end = m2.value ? Math.floor(date.extractDate(m2.value, 'YYYY-MM-DD HH:mm').getTime() / 60000) : 0
  if (next.start && next.start < now && next.start !== m1i.value)
    diag.value = $t('startReg')
  else if (next.start && next.end && next.start > next.end)
    diag.value = $t('startEnd1')
  else if (next.start && next.end && next.start === next.end)
    diag.value = $t('startEnd2')
  else diag.value = props.checkfn ? props.checkfn(next) : ''
  const x = [next.start, next.end]
  if (diag.value) x.push(1)
  model.value = x
}

const dook = () => {
  check()
  if (!diag.value)
    emit('ok', model.value)
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.msg4 { font-size: 0.6rem; font-weight: bold; background: var(--q-negative); color: white}
</style>