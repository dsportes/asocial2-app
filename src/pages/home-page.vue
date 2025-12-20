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

    <div v-if="session.hasNet" class="q-mb-md wsm row justify-center items-start">
      <div class="col titre-sm text-italic text-right">{{$t('HPnoreg')}}</div>
      <btn-cond class="q-ml-sm" size="sm" icon="send" @ok="regme"/>
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

  <!-- Création d'un safe / Changement des codes -->
  <q-dialog v-model="ui.dModels[idc].createSafe" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="title-sm">{{$t('HPenreg_' + (createMode ? '2' : '1'))}}</q-toolbar-title>
        <btn-cond class="q-mr-xs" icon="check" :label="$t('validate')"
          :disable="diag !== ''" @ok="createSafe"/>
        <help-button :page="sf.createMode ? 'createSafe' : 'updSafeCodes'"/>
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
            </div>
          </template>
          <p0-p1 class="q-pl-xl q-mt-xs" title="" :ctx="{ s: x }" @ok="setCode"/>
        </q-expansion-item>
      </div>
    </q-card>
  </q-dialog>

  <!-- Ouverture de session -->
  <q-dialog v-model="ui.dModels[idc].openSession" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-sm">{{$t('HPopens_1')}}</q-toolbar-title>
        <btn-cond class="q-mr-xs" icon="check" :label="$t('HPopens_2')"
          :disable="diag2 !== ''" @ok="openSession"/>
        <help-button page="openSession"/>
      </q-toolbar>
      <q-toolbar inset class="tbp">
        <div class="full-width titre-sm text-italic text-center">
          {{$t('HPauthby_' + sf.openMode)}}</div>
      </q-toolbar>

      <div class="q-pa-sm">
        <div v-if="sf.openMode !== 3" class="q-my-sm row justify-center items-start">
          <div class="col titre-sm text-italic text-right">{{$t('HPupdcodes')}}</div>
          <btn-cond class="q-ml-sm" size="md" icon="send" @ok="updCodes"/>
        </div>
        <div v-if="sf.openMode !== 3 && myTrusting === null" class="q-my-sm row justify-center items-start">
          <div class="col titre-sm text-italic text-right">{{$t('HPtrust')}}</div>
          <btn-cond class="q-ml-sm" size="md" icon="send" @ok="openTrust"/>
        </div>
        <div v-if="sf.openMode !== 3 && myTrusting !== null" class="q-my-sm row justify-center items-start">
          <div class="col titre-sm text-italic text-right">{{$t('HPuntrust')}}</div>
          <btn-cond class="q-ml-sm" size="md" icon="send" @ok="openUntrust"/>
        </div>
        <div v-if="diag2 !== ''" class="diag">{{diag2}}</div>

        <div class="title-lg text-italic q-ma-lg">TODO !</div>

      </div>
    </q-card>
  </q-dialog>

  <!-- Accorder ma confiance à ce terminal -->
  <q-dialog v-model="ui.dModels[idc].trustit" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-lg row items-start">
        <div class="col-6 q-pr-sm text-right text-italic">
          {{$t(newDev ? 'HPsetdev' : 'HPchgdev')}}
        </div>
        <q-input class="col-6 q-pl-sm" style="max-width:16rem" counter dense filled
          v-model="devName"
          input-class="font-mono"
          bottom-slots
          :error="deverr !== ''"
          :hint="$t('PSminmax', [minDev, maxDev])">
          <template v-slot:append>
            <q-icon size="sm" name="close" @click="devName = ''" class="cursor-pointer" />
          </template>
          <template v-slot:error>{{$t(deverr)}}</template>
        </q-input>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-pr-sm text-right text-italic">{{$t('HPsetPIN')}}</div>
        <q-input class="col-6 q-pl-sm" style="max-width:16rem" counter dense filled
          v-model="newPIN"
          input-class="font-mono"
          :type="pinPwd ? 'password' : 'text'"
          bottom-slots
          :error="pinerr !== ''"
          :hint="$t('PSminmax', [minpin, maxpin])">
          <template v-slot:append>
            <btn-cond size="sm" class="q-mx-xs" :icon="pinPwd ? 'visibility_off' : 'visibility'" round
              color="none" @ok="pinPwd = !pinPwd"/>
          </template>
          <template v-slot:error>{{$t(pinerr)}}</template>
        </q-input>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPtrust_1')" color="warning"
        :disable="trusterr" @ok="setTrust"/>
      </q-card-actions>
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
import { $t, sty, equ8 } from '../src-fw/util'

const minTr = 3
const maxTr = 8
const minDev = 8
const maxDev = 16
const minpin = 8
const maxpin = 16

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

const p0p1 = ref(null)
const pin = ref(null)
const selectedSafe = ref(null)

const options = computed(() => {
  const r = []
  sf.trustings.forEach(e => { r.push({ label: e.pseudo, value: e }) })
  if (r.length) selectedSafe.value = r[0]
  return r
})

const auth = async (args) => {
  p0p1.value = args
  const status = await sf.openSafe(args.sh0, args.sh1, args.sh)
  if (status !== 0) await ui.diagDisplay($t('HPopsret_' + status))
  else openSession()
}

const authPin = async (p) => {
  pin.value = p
  const userId = selectedSafe.value['value']['userId']
  const status = await sf.openSafeByPin(pin.value, userId)
  if (status !== 0) await ui.diagDisplay($t('HPbypin_' + status))
  else ui.oD(idc, 'openSession')
}

const createMode = ref()
const trig = ref('')
const trerr = computed(() => trig.value.length < minTr ? 'PScourt' : (trig.value.length > maxTr ? 'PSlong' : ''))
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

const regme = () => {
  createMode.value = true
  initCodes()
  checkCodes()
  ui.oD(idc, 'createSafe')
}

const updCodes = () => {
  createMode.value = false
  initCodes()
  checkCodes()
  ui.oD(idc, 'createSafe')
}

const eq = (n1, n2) => equ8(codes[n1].sh, codes[n2].sh)

const diag = computed(() => {
  if (trerr.value) return $t('HPerr_1')
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
    createMode.value,
    trig.value,
    ca.sh0, ca.sh1, ca.sh,
    cr.sh0, cr.sh1, cr.sh
  )
  await ui.diagDisplay($t('HPcsret_' + (createMode.value ? '0' : '1') + status))
  if (status === 0) {
    ui.fD()
    ui.oD(idc, 'openSession')
  }
}

const diag2 = ref('')
const myTrusting = ref(null)
const newDev = ref(false)
const devName = ref('')
const newPIN = ref('')
const pinPwd = ref(false)

const deverr = computed(() => devName.value.length < minDev ? 'PScourt' : (devName.value.length > maxDev ? 'PSlong' : ''))
const pinerr = computed(() => newPIN.value.length < minpin ? 'PScourt' : (newPIN.value.length > maxpin ? 'PSlong' : ''))
const trusterr = computed(() => deverr.value !== '' || pinerr.value !== '')

const openSession = async () => {
  myTrusting.value = sf.getMyTrusting()
  ui.oD(idc, 'openSession')
}

const openTrust = async () => {
  myTrusting.value = sf.getMyTrusting()
  newDev.value = sf.devId === ''
  newPIN.value = ''
  devName.value = newDev.value ? '' : sf.devName
  ui.oD(idc, 'trustit')
}

const openUntrust = async () => {
  // TODO
  myTrusting.value = sf.getMyTrusting()
  newDev.value = sf.devId === ''
  newPIN.value = ''
  devName.value = newDev.value ? '' : sf.devName
  ui.oD(idc, 'untrustit')
}

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.value, newPIN.value)
    await ui.diagDisplay($t('HPsttrust_' + status))
    if (status === 0) ui.fD()
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const unsetTrust = () => {

}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.bord1 { border: 1px solid $grey-5; border-radius: 7px; width:20rem; }
.diag { background: yellow; font-weight: bold; color: black; padding: 2px;
  border: 2px solid $negative; border-radius: 7px; width:100%; }
</style>

