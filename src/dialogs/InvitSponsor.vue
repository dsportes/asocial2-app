
<template>
<dialog-std1 width="md" v-model="model" @close="model = false; emit('close', true)"
  :title="$t('INVtitval', [invit.$t()])">
  <template #hdr>
    <div class="row justify-between q-gutter-sm items-center">
      <div :class="(err ? 'msg col' : 'text-italic col')">{{ err || $t('ok') }}</div>
      <btn-cond class="col-auto" icon="check" :label="$t('validate')"
        :disable="err !== ''"
        @ok="emit('done', spArgs() )"/>
    </div>
  </template>
  <template #default>
    <div class="full-width q-px-sm column items-center">
    <!-- SI SI ça ne sert en théorie à rien mais en fait SI -->
      <q-expansion-item class="q-my-xs full-width" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs full-width">
          <invit-zoom class="q-ml-lg"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div v-if="invit.major === 'Auteur'" class="q-my-xs full-width column items-center">
        <div class="titre-lg text-italic q-my-sm">{{invit.$t()}}</div>
        <q-option-group class="full-width q-my-sm" :options="optionsA" type="radio" dense
          v-model="etc.newA"/>
        <q-option-group class="full-width q-my-sm" :options="optionsSP" type="radio" dense
          v-model="etc.option"/>
        <input-a v-if="etc.option === 3" class="q-my-sm"
          prefix="INV$Auteur_categ" size="minor" noval
          v-model="etc.categ"/>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <bar-title prefix="INVtabu"/>
      <md-editor class="full-width q-pa-xs" v-model="tab" 
        editable modetxt :text="invit.tab"/>

    </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed } from 'vue'

// import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import { SpArgs } from '../src-fw/invitation'

import InvitZoom from '../components-fw/InvitZoom.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import InputA from '../components-fw/InputA.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const mintab = 20

const model = defineModel()

const emit = defineEmits(['done', 'close'])

const props = defineProps({
  invit: Object
})

const etc = reactive({})
const tab = ref('')
const err = computed(() => {
  if (tab.value.length < mintab) return $t('INVERR$tab')
  const inv = props.invit
  if (inv.major === 'Auteur') {
    if ((!etc.option || etc.option === 1) && 
      (!etc.newA || etc.newA === 2)) return $t('INV$Auteur_e')
    return ''
  }
  return ''
})

const spArgs: Ref<SpArgs> = () => {
  return {
    etc: etc,
    tab: tab.value
  }
}

// Auteur
const optionsA = [
  { label: $t('INV$Auteur_4'), value: 1 },
  { label: $t('INV$Auteur_5'), value: 2 }
]
const optionsSP = [
  { label: $t('INV$Auteur_1'), value: 1 },
  { label: $t('INV$Auteur_2'), value: 2 },
  { label: $t('INV$Auteur_3'), value: 3 },
]

const reset = () => {
  const inv = props.invit
  tab.value = inv.tab
  if (inv.major === 'Auteur') {
    if (inv.etc) {
      etc.option = inv.etc.option
      etc.newA = inv.etc.newA
      etc.docId = inv.etc.newA === 1 ? (inv.etc.docId || Crypt.rnd(24)) : ''
      etc.categ = inv.etc.option === 3 ? inv.etc.categ : ''
    } else {
      etc.role = 'Auteur.'
      etc.docId = Crypt.rnd(24)
      etc.option = optionsSP[0].value
      etc.newA = optionsA[0].value
      etc.categ = ''
    }
  }
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.wloc { min-width: 250px; }
</style>