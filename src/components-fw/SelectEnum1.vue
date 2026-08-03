<!-- Saisie du couple Service / Organisation
-->
<template>
  <div class="row items-center justify-between w1 cursor-pointer q-pl-xs"
    :style="'width:' + sizes[size || 'sm']">
    <div class="font-mono text-bold fs-lg">{{ edv(model) }}</div>
    <q-icon name="arrow_drop_down" size="24px"/>
    <q-menu v-model="menu" anchor="top left" self="top left"
      transition-show="flip-up" transition-hide="flip-down">
      <q-input v-model="sel" filled dense
        placeholder="abc" :hint="$t('containing')">
        <template v-if="sel" v-slot:append>
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
import { ref, computed, onMounted } from 'vue'
import { DocEnums, getSite } from '../src-fw/operation'
import { $t, hasMessage } from '../src-fw/util'

const sizes = { sm: '150px', md: '250px', lg: '350px '}

const props = defineProps({
  svc: String,
  org: String,
  enum: String,
  size: String
})

const model = defineModel()
const emit = defineEmits(['select'])
const menu = ref(false)
const lst = ref()
const sel = ref('')

const edv = (e) => {
  if (!e) return '?'
  const m = hasMessage('ENUM_' + props.enum + '_' + e)
  return m || e
}

onMounted(async () => { 
  const l = []
  const lx = await DocEnums.get(props.svc + '$' + props.enum, await getSite(props.svc, props.org))
  for(const e of lx) {
    const t = edv(e)
    l.push([e, t, t.toLowerCase()])
  }
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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.lst { overflow-x:hidden; overflow-y:auto; border: 1px solid $grey-5 }
.selx:hover { background-color: $yellow-5; color: black }
</style>
