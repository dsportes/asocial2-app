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

  <!--div :class="(disable ? 'disabled' : 'sely') + ' row items-center'">
    <q-icon name="arrow_drop_down" size="22px"/>
    <div :class="'q-ml-xs font-mono ellipsis mw' + (width || 'sm')">
      {{ dv }}</div>
    <q-menu v-if="!disable" v-model="menu" 
      anchor="center middle" self="center middle"
      transition-show="flip-up" transition-hide="flip-down">
      <q-input v-model="sel" standout dense
        @keydown.enter.prevent="cr"
        placeholder="abc" :hint="$t('containing')">
        <template v-if="sel" v-slot:prepend>
          <q-icon name="cancel" @click.stop.prevent="sel = ''" class="cursor-pointer"/>
        </template>
      </q-input>
      <div class="lst q-pa-xs" style="width:300px; height:120px">
        <div v-for="t in shl" class="font-mono cursor-pointer selx"
          @click="clic(t)">{{ t[1] }}</div>  
      </div>
    </q-menu>
  </div!!-->
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

const modelloc = ref()
const options = ref([])
const lst = ref([])

const emit = defineEmits(['select'])
watch(() => modelloc.value, (t) => {
  emit('select', t.value)
})

/*
const menu = ref(false)
const lst = ref()
const sel = ref('')
const map: Ref<Object> = ref({})
const dv = computed(() => {
  const x = map.value[model.value]
  return x ? x[1] : props.title
})
  */

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
  if (l.length === 1) {
    modelloc.value = l[0]
    emit('select', l[0].value)
  }
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
