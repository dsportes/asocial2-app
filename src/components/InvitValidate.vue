
<template>
<dialog-std1 v-model="model" @close="doClose"
  :title="$t('INVtitval', [invit.$t])">
  <template #hdr>
    <div class="row items-center justify-between">
      <btn-bubble :text="$t('INVvalCf_txt')"/>
      <div class="row items-center q-gutter-sm">
        <btn-cond icon="close" :label="$t('giveup')"
          @ok="doClose"/>
        <btn-cond icon="check" :label="$t('validate')"
          @ok="doValidate" color="warning"/>
      </div>
    </div>
    <div v-if="diag" class="msg">diag</div>
    <div v-else class="titre-md text-italic">{{ $t('ok') }}</div>
  </template>
  <template #default>
    <div class="pwmd q-px-sm column items-center">
    <div> <!-- en théorie le div est inutile mais en fait SI -->
      <q-expansion-item class="q-my-xs full-width" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs full-width">
          <invit-zoom class="q-ml-lg"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div v-if="invit.major === 'Auteur'" class="q-my-xs full-width column items-center">
        <div class="titre-lg text-italic q-my-sm">{{invit$t_tit}}</div>
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
import { reactive, computed } from 'vue'

// import stores from '../stores/all'
import { $t } from '../src-fw/util'
// import { Crypt } from '../src-fw/crypt'

import InputA from '../components-fw/InputA.vue'

import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const model = defineModel()

const emit = defineEmits(['validate', 'close'])

const props = defineProps({
  invit: Object
})

const doClose = () => {
  model.value = false; emit('close', true)
}

const doValidate = () => {
  emit('validate', args[props.invit.role])
  model.value = false
}

const args = reactive({
  Auteur: {
    nom: { inp: '', err: '' }
  }
})

const diag = computed(() => {
  switch (props.invit.role) {
    case 'Auteur' : {
      return args.Auteur.nom.err
    }
  }
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.wloc { min-width: 250px; }
</style>