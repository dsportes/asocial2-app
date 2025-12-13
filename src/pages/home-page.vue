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
        <q-toolbar-title>{{$t('HPenreg')}}</q-toolbar-title>
        <help-button page="createSafe"/>
      </q-toolbar>
      <div class="q-pa-md">
        <div class="row q-my-sm full-with q-gutter-md items-center">
          <div class="titre-md">{{$t('cauth')}}</div>
          <div class="font-mono fs-md tewxt-bold">{{authP0}}</div>
          <div class="font-mono fs-md tewxt-bold">{{authP1}}</div>
        </div>
        <div class="row q-my-sm full-with q-gutter-md items-center">
          <div class="titre-md">{{$t('crecup')}}</div>
          <div class="font-mono fs-md tewxt-bold">{{authR0}}</div>
          <div class="font-mono fs-md tewxt-bold">{{authR1}}</div>
        </div>
        <div class="row q-gutter-sm items-center">
          <div class="tite-md text-italic">{{$t('HPstep')}}</div>
          <btn-cond v-for="step in [1..4]" size="lg" :label="step"
            class="font-mono text-bold fs-lg"/>
        <p0-p1 class="wsm" :title="$t('HPph', [step] + )" @ok="p0p1"/>

      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import PinCode from '../components-fw/PinCode.vue'
import stores from '../stores/all'
import { $t, $q, sty, reloadPage, sleep, coolBye } from '../src-fw/util'

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

const step = ref(1)
const authCode = ref(null)
const recupCode = ref(null)
const authCodeV = ref(null)
const recupCodeV = ref(null)
const diag = ref('')

const eq = (c1, c2) => c1.p0 === c2.p0 && c1.p1 === c2.p1

const p0p1 = (x) => {
  if (step.value === 1) {
    authCode.value = x
    step.value = 2
  } else if (step.value === 2) {
    authCodeV.value = x

  }
  else if (step.value === 3) recupCode.value = x
  else recupCodeV.value = x
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 7px; width:20rem; }
</style>
