<template>
<!-- Création d'un safe / Changement des codes -->
<div>
  <q-toolbar v-if="!createMode" class="tbp">
    <btn-cond v-if="!createMode" icon="close" color="warning" @ok="ui.fD"/>
    <q-toolbar-title class="titre-smd">{{$t('HPenreg_' + (createMode ? '1' : '2'))}}</q-toolbar-title>
    <btn-cond class="q-mr-xs" icon="check" :label="$t('validate')"
      :disable="diag !== ''" @ok="createSafe"/>
    <help-button :page="createMode ? 'createSafe' : 'updSafeCodes'"/>
  </q-toolbar>

  <div v-else class="row q-my-sm justify-end items-center">
    <btn-cond class="q-mr-xs" icon="check" :label="$t('validate')"
      :disable="diag !== ''" @ok="createSafe"/>
    <help-button :page="createMode ? 'createSafe' : 'updSafeCodes'"/>
  </div>

  <div class="q-pa-sm">
    <div v-if="diag !== ''" class="diag">{{diag}}</div>
    <div class="row items-center q-my-sm">
      <div class="titre-md">{{$t('HPtrig')}}</div>
      <input-ps class="q-ml-sm" v-model="trig"
        :sz="cfg.K.sizeTr" :label="$t('HPtrig')" :ph="$t('HPtrigh')"/>
      <!--q-input class="q-ml-sm" v-model="trig" counter dense
        input-class="font-mono"
        :label="$t('HPtrig')"
        :placeholder="$t('HPtrigh')"
        bottom-slots
        :error="trerr !== ''"
        :hint="$t('PSminmax', [minTr, maxTr]) + (!trerr ? $t('pressret') : '')">
        <template v-slot:append>
          <q-icon size="sm" name="close" @click="trig = ''" class="cursor-pointer" />
        </template>
        <template v-slot:error>{{$t(trerr)}}</template>
      </q-input-->
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

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import { $t, sty, equ8 } from '../src-fw/util'
import stores from '../stores/all'

const icons = ['check', 'question_mark', 'warning']

const props = defineProps ({
  createMode: Boolean,
  onValidate: Function
})

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
  const status = await sf.createSafe(
    props.createMode,
    trig.inp,
    ca.sh0, ca.sh1, ca.sh,
    cr.sh0, cr.sh1, cr.sh
  )
  await ui.diagDisplay($t('HPcsret_' + (props.createMode ? '0' : '1') + status))
  if (status === 0) {
    if (!props.createMode) ui.fD()
    await props.onValidate()
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