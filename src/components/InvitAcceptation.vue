
<template>
<dialog-std1 v-model="model" @close="model = false; emit('close', true)"
  :title="$t('INVtitval', [$t('INV_' + invit.major)])">
  <template #hdr>
    <div class="row justify-end items-center">
      <btn-cond icon="check" :label="$t('validate')"
        :disable="txt === ''"
        @ok="emit('done', [accept, txt] )"/>
    </div>
  </template>
  <template #default>
    <div class="wloc q-px-sm column items-center">
    <div> <!-- SI SI ça ne sert en théorie à rien mais en fait SI -->
      <q-expansion-item class="q-my-xs full-width" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs full-width">
          <invit-zoom class="q-ml-lg" v-model="inv"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div v-if="inv.major === 'Auteur'" class="q-my-xs full-width column items-center">
        <div class="titre-lg text-italic q-my-sm">{{$t('INVauteur_tit')}}</div>
        <q-option-group class="full-width q-my-sm" :options="optionsA" type="radio" dense
          v-model="accept.etc.newA"/>
        <q-option-group class="full-width q-my-sm" :options="optionsSP" type="radio" dense
          v-model="accept.etc.option"/>
        <div v-if="(!accept.etc.option || accept.etc.option === 1) && (!accept.etc.newA || accept.etc.newA === 2)"
          class="msg">{{$t('INVauteur_e')}}</div>
        <input-a v-if="accept.etc.option === 3" class="q-my-sm"
          prefix="INVauteur_categ" size="minor" noval
          v-model="accept.etc.categ"/>
        <btn-cond class="q-my-sm items-end" :label="$t('INVverif')"
          @ok="genTxtAuteur"/>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="titre-lg text-italic q-mb-sm">{{$t('INVtxti')}}</div>
      <scroll-md class="bord1 q-py-xs" height="200px" :text="txt" />
    </div>
    </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

import InvitZoom from '../components-fw/InvitZoom.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollMd from '../components-fw/ScrollMd.vue'
import InputA from '../components-fw/InputA.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const model = defineModel()

const emit = defineEmits(['done', 'close'])

const props = defineProps({
  invit: Object
})

const accept = reactive({
  role: '',
  docId: '',
  cond: {},
  etc: {}
})

const txt = ref()

const inv = ref(props.invit)

watch(() => props.invit, (v) => { inv.value = v; reset() })

// Auteur
const optionsA = [
  { label: $t('INVauteur_4'), value: 1 },
  { label: $t('INVauteur_5'), value: 2 }
]
const optionsSP = [
  { label: $t('INVauteur_1'), value: 1 },
  { label: $t('INVauteur_2'), value: 2 },
  { label: $t('INVauteur_3'), value: 3 },
]

const genTxtAuteur = () => {
  const t : string[]= []
  t.push($t('INVauteur_t1', [inv.value.label, accept.docId]))
  if (accept.etc.option === 2) t.push($t('INVauteur_t2'))
  if (accept.etc.option === 3) t.push($t('INVauteur_t3', [accept.etc.categ]))
  txt.value = t.join('\n')
}

const reset = () => {
  if (inv.value.major === 'Auteur') {
    txt.value = ''
    accept.role = 'Auteur.'
    accept.docId = Crypt.rnd(24)
    accept.etc.option = optionsSP[0]
    accept.etc.newA = optionsA[0]
    accept.etc.categ = ''
  }
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.wloc { min-width: 250px; }
</style>