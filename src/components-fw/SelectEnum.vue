<!-- Saisie d'une énumération
-->
<template>
  <div :class="(disable ? 'disabled' : 'sely') + ' row items-center'">
    <q-icon name="arrow_drop_down" size="22px"/>
    <div :style="widths[width || 'sm']"
      class="q-ml-xs font-mono ellipsis">
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
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch } from 'vue'
import { DocEnums } from '../src-fw/operation'
import { $t, hasMessage } from '../src-fw/util'

const widths = {
  sm: 'max-width: 10em !important; overflow:hidden',
  md: 'max-width: 20em !important; overflow:hidden',
  lg: 'max-width: 30em !important; overflow:hidden'
}

const props = defineProps({
  title: String,
  disable: Boolean,
  svc: String,
  org: String,
  enum: String,
  width: String
})

const model = defineModel()
const emit = defineEmits(['select'])
const menu = ref(false)
const lst = ref()
const sel = ref('')
const map: Ref<Object> = ref({})
const dv = computed(() => {
  const x = map.value[model.value]
  return x ? x[1] : props.title
})

const edv = (e) => {
  const lbl1 = hasMessage('ENUM_' + props.svc + '$' + props.enum + '_' + e[0]) 
  const lbl2 = (lbl1 || e[1]).toLowerCase()
  const t = [e[0], lbl1 || e[1], lbl2]
  map.value[e[0]] = t
  return t
}

const load = async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.enum, props.org)
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0))
  lst.value = l
}

watch(() => [props.svc, props.org, props.enum], async () => {
  await load()
})
onMounted(async () => { await load()})

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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.lst { overflow-x:hidden; overflow-y:auto; border: 1px solid $grey-5 }
.sely:hover { border-color: $yellow-5;}
.sely { border:1px solid transparent; border-radius: 5px; cursor:pointer!important;}
</style>
