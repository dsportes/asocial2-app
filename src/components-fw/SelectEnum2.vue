<!-- Saisie du couple Service / Organisation
 :class="'row selx' + (disable ? ' disabled' : ' cursor-pointer')"
 :style="'width:' + sizes[size || 'sm']"
-->
<template>
  <div :class="(disable ? 'disabled' : 'sely') + ' row items-center'"
    @click="menu = true">
    <q-icon name="edit" size="22px"/>
    <div :style="widths[size || 'sm']"
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
import { ref, Ref, computed, onMounted } from 'vue'
import { DocEnums, getSite } from '../src-fw/operation'
import { $t, hasMessage } from '../src-fw/util'

const sizes = { sm: '150px', md: '250px', lg: '350px '}

const widths = {
  sm: 'max-width: 10em !important; overflow:hidden',
  md: 'max-width: 20em !important; overflow:hidden',
  lg: 'max-width: 30em !important; overflow:hidden'
}

const props = defineProps({
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
  return x ? x[1] : '?'
})

const edv = (e) => {
  let code:string = '?', lbl1: string = '?', lbl2: string = '?'
  if (e) {
    const i = e.indexOf(' ')
    code = i === -1 ? e : e.substring(0, i)
    lbl1 = hasMessage('ENUM_' + props.enum + '_' + code) || (i !== -1 ? e.substring(i + 1): e)
    lbl2 = lbl1.toLowerCase()
  }
  const t = [code, lbl1, lbl2]
  map.value[code] = t
  return t
}

onMounted(async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.enum, await getSite(props.svc, props.org))
  for(const e of lx) l.push(edv(e))
  l.sort((a,b) => a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0))
  lst.value = l
})

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
  emit('select', t[0])
}

const cr = () => {
  if (shl.value.length === 1) clic(shl.value[0])
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.lst { overflow-x:hidden; overflow-y:auto; border: 1px solid $grey-5 }
.sely:hover { border-color: $yellow-5; cursor:pointer;}
.sely { border:1px solid transparent; border-radius: 5px;}
</style>
