<!-- Affichage d'une ligne "liste de credential"-->
<template>
<div>
  <div class="row items-center">
    <div class="col-3 row q-gutter-xs">
      <btn-cond icon="content_copy" color="warning"
        @ok="emit('duplicate', model)"/>
      <btn-cond v-if="model.ex" icon="delete" round color="warning"
        @ok="emit('delete', model)"/>
      <btn-cond v-if="!model.ex" icon="undo" round 
        @ok="emit('undo', model)"/>
      <q-icon :name="ic1" size="24px"/>
    </div>
    
    <div class="col-7 row items-center">
      <div class="col font-mono ellipsis">{{ model.name }}</div>
      <btn-cond v-if="model.ex" class="q-ml-xs col-auto"
        size="sm" round color="primary" icon="edit">
        <q-menu v-model="menu" anchor="top left" self="top left" class="bord q-pa-sm"
          style="max-width:25rem;width: 95vw"
          transition-show="flip-up" transition-hide="flip-down">
          <div class="row items-center">
            <q-input class="col font-mono" standout v-model="edname"/>
            <btn-cond v-if="model.name === model.nameB" class="col-auto q-mx-xs" icon="undo" round 
              @ok="undo"/>
            <btn-cond v-if="model.name !== edname" 
              class="col-auto" :label="$t('ok')" color="warning" padding="2px"
              @ok="doOk"/>
            <btn-cond v-if="model.name !== edname" class="q-ml-xs col-auto" 
              icon="close" color="warning" @ok="menu = false"/>
          </div>
        </q-menu>
      </btn-cond>
    </div>
    <div class="col-1 row items-center q-gutter-xs justify-center">
      <div :class="cl(model.crIds.size)">{{ model.crIds.size }}</div>
      <div v-if="model.crIds.size !== model.crIds.sizeB" :class="cl(model.crIds.sizeB)">{{ model.crIds.sizeB }}</div>
    </div>
    <div class="col-1 font-mono fs-sm ellipsis">{{model.profId.substring(0, 6)}}</div>
  </div>

  <div v-if="dup" class="q-ml-lg msg2">{{ dup }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, computed } from 'vue'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'

type ListCreds = {
  profId: string
  name: string
  nameB: string // 
  ex: boolean, // existe
  exB: boolean, // existait avant
  crIds: Set<string> // Set des ids des credentials
  crIdsB: Set<string> // Set des ids des credentials avant changement
}

const model = defineModel()
const props = defineProps({
  lcmap: Object // Map<id, ListCreds
})
const emit = defineEmits(['namechange', 'delete', 'undo', 'duplicate'])

const ic1 = computed(() => model.value.ex && model.exB ? 'equal' : (model.ex && !model.exB ? 'close' : 'add'))

const cl = (n) => 'font-mono q-px-xs ' + (n === 0 ? 'bg-negative text-white text-bold' : '')

const edname = ref('')
const dup = ref('')
const menu = ref(false)
watch(menu, (after, before) => {
  if (after && !before) { // ouverture
    edname.value = model.value.name
  }
})

const checkDup = () => {
  const x = props.lcmap
  for(const p of Object.keys(x)) {
    const lc = x[p]
    if (lc.profId !== model.value.profId && lc.name === model.value.name) {
      dup.value = $t('LCRdupname', [lc.profId.substring(0, 6)])
      return
    }
  dup.value = ''
  }
}

const doOk = () => {
  model.value.name = edname.value
  menu.value = false
  checkDup()
  emit('namechange', model.value)
}

const undo = () => {
  edname.value = model.value.nameB
}

checkDup()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
// .mh { max-height: 1.3rem; overflow: hidden;}
.bord { border: 2px solid $warning; border-radius: 2px;}
</style>
