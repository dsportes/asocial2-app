
<template>
<dialog-std1 v-model="model" @close="doClose"
  :title="$t('INVtitval', [invit.$t()])">
  <template #hdr>
    <div class="row items-center justify-between">
      <btn-bubble :text="$t('INVvalCf_txt')"/>
      <div class="row items-center q-gutter-sm">
        <btn-cond icon="close" :label="$t('giveup')"
          @ok="doClose"/>
        <btn-cond icon="check" :label="$t('validate')"
          :disable="diag !== ''"
          @ok="doValidate" color="warning"/>
      </div>
    </div>
    <div v-if="diag" class="msg">{{diag}}</div>
    <div v-else class="titre-md text-italic">{{ $t('ok') }}</div>
  </template>
  <template #default>
    <div class="q-px-sm full-width column items-center">
      <!-- en théorie le div est inutile mais en fait SI -->
      <q-expansion-item class="q-my-xs full-width" 
        header-class="tbp" dense :label="$t('INVdetail')">
        <div class="q-my-xs full-width">
          <invit-zoom class="q-ml-lg"/>
          <q-separator color="orange" class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div v-if="invit.major === 'Org.manager'" class="q-my-xs full-width column items-center">
        <bar-title :prefix="invit.prefix"/>
        <div class="titre-md text-italic q-my-sm">{{ $t('noopts') }}</div>
      </div>

      <div v-if="invit.major === 'Auteur'" class="q-my-xs" style="min-width:20rem">
        <div v-if="invit.etc.newA === 1">
          <bar-title prefix="INV$Auteur"/>
          <input-b v-model="args.Auteur.nom" size="auteur" noval
            prefix="INV$Auteur_nom"/>
        </div>
        <div v-else class="titre-md text-italic">{{ $t('noopts') }}</div>
      </div>
    </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch } from 'vue'

// import stores from '../stores/all'
import { $t } from '../src-fw/util'
// import { Crypt } from '../src-fw/crypt'

import InputB from '../components-fw/InputB.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InvitZoom from '../components-fw/InvitZoom.vue'
import BarTitle from '../components-fw/BarTitle.vue'
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
  const x: any = { }
    switch (props.invit.major) {
    case 'Auteur' : {
      x.nom = args.Auteur.nom.inp
      break
    }
  }
  emit('validate', x)
  model.value = false
}

const args = reactive({
  Auteur: {
    nom: { inp: '', err: '' }
  }
})

const diag = ref('')
const setDiag = () => {
  switch (props.invit.major) {
    case 'Auteur' : {
      diag.value = $t(args.Auteur.nom.err)
      break
    }
  }
}

watch(args, () => {
  setDiag()
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.wloc { min-width: 250px; }
</style>