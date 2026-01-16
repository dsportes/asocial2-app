<template> <!-- Création d'un safe / Changement des codes -->
<dialog-std2 v-model="sc" :title="$t('HPenreg_' + (createMode ? '1' : '2'))">
<template #hdr>
  <div class="row justify-end q-px-xs q-mb-md">
    <btn-cond flat size="lg" icon="check" :label="$t('validate')" 
      :disable="diag !== ''" @ok="createSafe"/>
  </div>
</template>

<template #default>
<div class="column items-center">
<div class="wmd">

  <div v-if="diag !== ''" class="diag">{{diag}}</div>
  <div class="row items-center q-my-sm">
    <div class="titre-md">{{$t('HPtrig')}}</div>
    <input-ps class="q-ml-sm" v-model="trig"
      :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
  </div>
  <q-expansion-item v-for="x in 4" v-model="exp[x-1]" dense group="gp0p1"
    class='q-mb-xs'
    header-class="tbs"
    switch-toggle-side>
    <template v-slot:header>
      <div class="column">
        <div class="row q-gutter-sm">
          <q-icon size="md" :name="icons[errors[x - 1]]"/>
          <div class='titre-lg'>{{$t('HPcode_' + x)}}</div>
        </div>
      </div>
    </template>
    <p0-p1 class="q-pl-xl q-mt-xs" title="" :ctx="{ s: x }" @ok="setCode"/>
  </q-expansion-item>
</div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive } from 'vue'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import { $t, sty, equ8 } from '../src-fw/util'
import stores from '../stores/all'

const icons = ['check', 'question_mark', 'warning']

const props = defineProps ({
  createMode: Boolean,
  onValidate: Function,
  idc: String
})

const sc = computed(() => ui.dModels[props.idc].createsafe)

const sf = stores.safe
const ui = stores.ui
const cfg = stores.config

const trig = reactive( { inp: '', err: '' } )

const exp = reactive([false, false, false, false])
const codes = reactive([null, null, null, null])
const errors = reactive([0, 0, 0, 0])

const initCodes = () => {
  for(let i = 0; i < 4; i++) {
    codes[i] = { sh0: null, sh1: null, sh: null}
    errors[i] = 0
    exp[i] = false
  }
  exp[0] = true
}

const eq = (n1, n2) => equ8(codes[n1].sh, codes[n2].sh)

const diag = computed(() => {
  if (trig.err) return $t('HPerr_1')
  if (codes[0].sh0 === null) return $t('HPerr_2')
  if (!eq(0, 1)) return $t('HPerr_3')
  if (codes[2].sh0 === null) return $t('HPerr_4')
  if (!eq(2, 3)) return $t('HPerr_5')
  return ''
})

const setCode = (x) => {
  codes[x.ctx.s - 1] = x
  checkCodes()
}

const checkCodes = () => {
  let e = false
  for (let i = 0; i < 4; i++) {
    exp[i] = false
    errors[i] = 0
    if (codes[i].sh0 === null) errors[i] = 1
    else if ((i === 1 || i === 3) && !eq(i - 1, i)) errors[i] = 2
    if (errors[i] !== 0 && !e) { exp[i] = true; e = true }
  }
}

const createSafe = async () => {
  const ca = codes[0]
  const cr = codes[2]
  const status = props.createMode ?
    await sf.createSafe(trig.inp, ca.sh0, ca.sh1, ca.sh, cr.sh0, cr.sh1, cr.sh) :
    await sf.updSafeCodes(trig.inp, ca.sh0, ca.sh1, ca.sh, cr.sh0, cr.sh1, cr.sh)
  if (status >= 0) {
    await ui.diagDisplay($t('HPcsret_' + (props.createMode ? '0' : '1') + status))
    if (status === 0) {
      ui.fD()
      await props.onValidate()
    }
  }
}

initCodes()
checkCodes()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.diag { background: yellow; font-weight: bold; color: black; padding: 2px;
  border: 2px solid $negative; border-radius: 7px; width:100%; }
.bbot, .slist { border-bottom: 1px solid $grey-5 !important; }
.btop, .slist { border-top: 1px solid $grey-5 !important; }

</style>