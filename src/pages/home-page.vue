<template>
<div>
  <div class="column full-width items-center">
    <!--btn-cond label="Go Test1" @ok="ui.setPage('test1')"/-->
    <q-toggle v-model="session.hasNet"
      :class="'q-mb-md q-pa-xs bord1 q-pa-xs ' + (!session.hasNet ? 'text-bold bg-warning' : '')"
      dense color="positive"
      checked-icon="cloud" unchecked-icon="cloud_off"
      :label="$t(session.hasNet ? 'HPnet' : 'HPplane')" />

    <div v-if="options.length === 0 && !session.hasNet"
      class="q-mb-sm wsm titre-md text-italic text-center">{{$t('HPnoplane')}}</div>

    <div v-if="session.hasNet"
      class="q-mb-md wsm row items-start">
      <div class="col titre-sm text-italic text-center">{{$t('HPnoreg')}}</div>
      <btn-cond class="col-auto q-ml-sm" size="sm" icon="send" @ok="regme"/>
    </div>
    <p0-p1 v-if="session.hasNet || (options.length !== 0 && !session.hasNet)"
      class="wsm" :title="$t('HPauth')" @ok="auth"/>
      <div v-if="options.length > 0 && session.hasNet" class="wsm column">
      <div class="tbs q-px-xs titre-md text-italic">{{$t('HPseluser')}}</div>
      <div class="q-mb-sm wsm row justify-between items-center">
        <q-select class="col q-mr-sm" dense filled
          transition-show="flip-up" transition-hide="flip-down"
          v-model="selectedSafe" :options="options" />
        <pin-code class="col" :disable="selectedSafe === null" @ok="authPin"/>
      </div>
    </div>
    <div v-if="options.length === 0 && session.hasNet"
      class="q-mb-sm wsm titre-md text-italic text-center">{{$t('HPnotrust')}}</div>
  </div>

  <!-- Création d'un safe-->
  <q-dialog v-model="ui.dModels[idc].createSafe" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="title-sm">{{$t('HPenreg')}}</q-toolbar-title>
        <btn-cond class="q-mr-xs" icon="check" :label="$t('validate')"
          :disable="diag !== ''" @ok="createSafe"/>
        <help-button page="createSafe"/>
      </q-toolbar>
      <div class="q-pa-sm">
        <div v-if="diag !== ''" class="diag">{{diag}}</div>
        <div class="row items-center q-my-sm">
          <div class="titre-md">{{$t('HPtrig')}}</div>
          <q-input class="q-ml-sm" v-model="trig" counter dense
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
          </q-input>
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
              <div v-if="x === 1" class="q-ml-xl">
                <div class="font-mono fs-md text-bold">{{$t('HPpseudo', [codes[0].p0])}}</div>
                <div class="font-mono fs-md text-bold">{{$t('HPps', [codes[0].p1])}}</div>
              </div>
              <div v-if="x === 3" class="q-ml-xl">
                <div class="font-mono fs-md text-bold">{{$t('HPpseudo', [codes[2].p0])}}</div>
                <div class="font-mono fs-md text-bold">{{$t('HPps', [codes[2].p1])}}</div>
              </div>
            </div>
          </template>
          <p0-p1 class="q-pl-xl q-mt-xs" title="" :ctx="{ s: x }" @ok="setCode"/>
        </q-expansion-item>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import PinCode from '../components-fw/PinCode.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

const minTr = 3
const maxTr = 8

const icons = ['check', 'question_mark', 'warning']

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

onMounted(async () => {
  await sf.open()
  await sf.getHeader()
  await sf.getTrustings()
})

const p0i = ref('')
const p0p1 = ref(null)
const pin = ref(null)
const selectedSafe = ref(null)

const options = computed(() => {
  const r = []
  sf.trustings.forEach(e => { r.push({ label: e.pseudo, value: e }) })
  if (r.length) selectedSafe.value = r[0]
  return r
})

const auth = (args) => {
  p0p1.value = args
  console.log(args.p0, args.p1, args.p0h, args.p1h)
}

const authPin = (args) => {
  pin.value = args
  console.log(args.pin, selectedSafe.value['value']['userId'])
}

const regme = () => {
  ui.oD(idc, 'createSafe')
}

const trig = ref('')
const trerr = computed(() => trig.value.length < minTr ? 'PScourt' : (trig.value.length > maxTr ? 'PSlong' : ''))
const exp = reactive([true, false, false, false])
const codes = reactive([
  { p0: '?', p1: '?' }, { p0: '?', p1: '?' }, { p0: '?', p1: '?' }, { p0: '?', p1: '?' }
])
const errors = reactive([0, 0, 0, 0])

const eq = (c1, c2) => c1.p0 === c2.p0 && c1.p1 === c2.p1

const diag = computed(() => {
  if (trerr.value) return $t('HPerr_1')
  if (codes[0].p0 === '?') return $t('HPerr_2')
  if (!eq(codes[0], codes[1])) return $t('HPerr_3')
  if (codes[2].p0 === '?') return $t('HPerr_4')
  if (!eq(codes[2], codes[3])) return $t('HPerr_5')
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
    if (codes[i].p0 === '?') errors[i] = 1
    else if ((i === 1 || i === 3) && !eq(codes[i - 1], codes[i])) errors[i] = 2
    if (errors[i] !== 0 && !e) { exp[i] = true; e = true }
  }
}

checkCodes()

const createSafe = async () => {
  // TODO
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.bord1 { border: 1px solid $grey-5; border-radius: 7px; width:20rem; }
.diag { background: yellow; font-weight: bold; color: black; padding: 2px;
  border: 2px solid $negative; border-radius: 7px; width:100%; }
</style>

