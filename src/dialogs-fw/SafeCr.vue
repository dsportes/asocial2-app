<!-- Dialogue de création d'un safe / changement des codes 
Events: close done
-->
<template>
<dialog-std2 v-model="model" :title="$t('SCRenreg_' + mode)" vue="SafeCr"
  @close="emit('close', true)">
<template #hdr>
  <div class="row justify-end q-px-xs q-mb-md">
    <btn-cond flat size="lg" icon="check" :label="$t('validate')" 
      :disable="diag !== ''" @ok="createSafe"/>
  </div>
</template>

<template #default>
<div class="column items-center">
<div style="width:30rem !important">
  <div v-if="mode < 2" class="row justify-between items-center q-my-sm">
    <q-toggle class="col q-pr-md" v-model="sec" dense
      :label="$t('SCRsec_' + (sec ? '1' : '2'))" />
    <btn-bubble class="col-auto self-start"
      :text="$t('SCRsec_bub')"/>
  </div>

  <div v-if="diag !== ''" class="diag q-mb-sm">{{diag}}</div>

  <q-expansion-item v-for="x in N" v-model="exp[x-1]" dense group="gp0p1"
    class='q-mb-xs'
    header-class="tbs"
    switch-toggle-side>
    <template v-slot:header>
      <div class="column">
        <div class="row q-gutter-sm">
          <q-icon size="20px" :name="icons[errors[x - 1]]"/>
          <div class='titre-lg'>{{$t('SCRcode_' + x)}}</div>
        </div>
      </div>
    </template>
    <p0-p1 class="q-mt-xs" title="" :ctx="{s: x}" @ok="setCode"/>
  </q-expansion-item>
</div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive, onUnmounted, watch } from 'vue'

import stores from '../stores/all'
import { $t, equ8 } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const icons = ['check', 'question_mark', 'warning']

const sf = stores.safe
const ui = stores.ui

const myModule = 'SafeCr'
const model = defineModel()
const emit = defineEmits(['close', 'done'])
// onMounted(() => console.log(myModule, "mounted"))
// onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v) => {
  if(v) init()
  else emit('close', true)
})

const props = defineProps ({
  mode: Number // 0: create 1: chg codes 2: chg codes backup
})

const sec = ref(props.mode !== 2)
const N = computed(() => sec.value ? 4 : 2)

watch(sec, () => { init() })

const init = () => {
  initCodes()
  checkCodes()
}

const exp = reactive([false, false, false, false])
const codes = reactive([null, null, null, null])
const errors = reactive([0, 0, 0, 0])

const initCodes = () => {
  for(let i = 0; i < N.value; i++) {
    codes[i] = { sh0: null, sh1: null, sh: null}
    errors[i] = 0
    exp[i] = false
  }
  exp[0] = true
}

const eq = (n1, n2) => equ8(codes[n1].sh, codes[n2].sh)

const diag = computed(() => {
  if (codes[0].sh0 === null) return $t('SCRerr_2')
  if (!eq(0, 1)) return $t('SCRerr_3')
  if (sec.value) {
    if (codes[2].sh0 === null) return $t('SCRerr_4')
    if (!eq(2, 3)) return $t('SCRerr_5')
  }
  return ''
})

const setCode = (x, ctx) => {
  codes[ctx.s - 1] = x
  if (!sec.value) codes[ctx.s + 1] = x
  checkCodes()
}

const checkCodes = () => {
  let e = false
  for (let i = 0; i < N.value; i++) {
    exp[i] = false
    errors[i] = 0
    if (codes[i].sh0 === null) errors[i] = 1
    else if ((i === 1 || i === 3) && !eq(i - 1, i)) errors[i] = 2
    if (errors[i] !== 0 && !e) { exp[i] = true; e = true }
  }
}

const createSafe = async () => {
  const ca = codes[0]
  const cr = codes[sec ? 2 : 0]
  const arg = {
    cash0: ca.sh0, cash1: ca.sh1, cash: ca.sh, crsh0: cr.sh0, crsh1: cr.sh1, crsh: cr.sh
  }

  if (props.mode === 2) { // Codes pour un "backup" (pas d'enregistrement au safe)
    emit('done', arg)
    model.value = false
  } else {
    const status = props.mode === 0 ?
      await sf.createSafe(ca.sh0, ca.sh1, ca.sh, cr.sh0, cr.sh1, cr.sh) :
      await sf.updSafeCodes(ca.sh0, ca.sh1, ca.sh, cr.sh0, cr.sh1, cr.sh)
    if (status >= 0) {
      await ui.diagDisplay($t('SCRcsret_' + props.mode + status))
      if (status === 0) {
        emit('done', arg)
        model.value = false
      }
    }
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.diag { background: $yellow-3; font-weight: bold; color: black; 
  padding: 2px;width:100%; }
.bbot, .slist { border-bottom: 1px solid $grey-5 !important; }
.btop, .slist { border-top: 1px solid $grey-5 !important; }

</style>