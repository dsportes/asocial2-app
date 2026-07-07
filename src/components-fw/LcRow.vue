<!-- Affichage d'une ligne "liste de credential"-->
<template>
<div>
  <div class="row items-center q-gutter-xs">
    <q-icon :name="ic1" size="24px" class="col-auto"/>
    <btn-cond v-if="!restricted" class="col-auto" icon="content_copy" color="warning"
      @ok="emit('duplicate', model)"/>
    <btn-cond v-if="!restricted && model.ex" class="col-auto" icon="delete" round color="warning"
      @ok="emit('delete', model)"/>
    <btn-cond v-if="!restricted && !model.ex" class="col-auto" icon="undo" round 
      @ok="emit('undo', model)"/>

    <line-edit class="col q-ml-sm" :text="model.name" size="sm" :disable="restricted" @change="doOk"/>

    <div class="col-auto row items-center q-gutter-xs justify-center">
      <div :class="cl(model.crIds.size)">{{ model.crIds.size }}</div>
      <div v-if="model.crIds.size !== model.crIds.sizeB" :class="cl(model.crIds.sizeB)">{{ model.crIds.sizeB }}</div>
    </div>
  </div>
  <div v-if="dup" class="q-ml-lg msg2">{{ dup }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, computed } from 'vue'
import { $t } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import LineEdit from '../components-fw/LineEdit.vue'

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
  lcmap: Object, // Map<id, ListCreds
  restricted: Boolean // pas de duplicate / delete / undo
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

const doOk = (ntext: string) => {
  model.value.name = ntext
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
