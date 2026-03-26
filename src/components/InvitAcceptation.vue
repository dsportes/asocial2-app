
<template>
<dialog-std1 v-model="model" @close="model = false; emit('close', true)"
  :title="$t('INVtitval', [$t('INV_' + invit.major)])">
  <template #hdr>
    <div class="row justify-end items-center">
      <btn-cond icon="check" :label="$t('validate')"
        :disable="txt !== ''"
        @ok="emit('done', accept, txti )"/>
    </div>
  </template>
  <template #default>
    <div class="column full-width items-center">
      <q-expansion-item class="q-my-xs pwsm" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs pwsm">
          <invit-zoom class="q-ml-lg" v-model="inv"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div v-if="inv.major === 'auteur'" class="q-my-xs pwsm column items-center">
        <div class="titre-lg text-italic q-my-sm">{{$t('INVauteur_tit')}}</div>
        <q-option-group :options="optionsSP" type="radio" dense
          v-model="accept.etc.option"/>
        <input-a v-if="accept.etc.option === 3" class="q-my-sm"
          prefix="INVauteur_categ" size="minor" noval
          v-model="accept.etc.categ"/>
        <btn-cond class="q-my-sm items-end" :label="$t('INVverif')"
          @ok="genTxtAuteur"/>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="titre-lg text-italic q-mb-sm">{{$t('INVtxti')}}</div>
      <scroll-md class="full-width bord1 q-pa-xs" height="200px" :text="txt" />
    </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

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
const optionsSP = [
  { label: $t('INVauteur_1'), value: 1 },
  { label: $t('INVauteur_2'), value: 2 },
  { label: $t('INVauteur_3'), value: 3 },
]

const genTxtAuteur = () => {
  const t = []
  t.push($t('INVauteur_t1', [inv.value.label]))
  if (accept.etc.option === 2) t.push($t('INVauteur_t2'))
  if (accept.etc.option === 3) t.push($t('INVauteur_t3', [accept.etc.categ]))
  txt.value = t.join('\n')
}

const reset = () => {
  if (inv.value.major === 'auteur') {
    txt.value = ''
    accept.etc.option = optionsSP[0]
    accept.etc.categ = ''
  }
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>