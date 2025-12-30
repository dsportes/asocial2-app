<template>
<div class="column items-center">
  <q-stepper v-model="step" color="primary" animated class="pwmd"
    header-class="titre-lg">
    <q-step :name="1" :title="$t('HPauthentif')" icon="passkey">
      <div class="column q-pa-sm">
        <!--btn-cond label="Go Test1" @ok="ui.setPage('test1')"/-->
        <div class="full-width row justify-between">
          <q-toggle v-model="session.hasNet"
            :class="'q-pa-xs bord1 ' + (!session.hasNet ? 'text-bold bg-warning' : '')"
            dense color="positive"
            checked-icon="cloud" unchecked-icon="cloud_off"
            :label="$t(session.hasNet ? 'HPnet' : 'HPplane')" />
          <btn-cond round icon="local_police" size="sm" color="negative" @ok="opCfReset"/>
        </div>

        <div class="full-width row">
          <q-toggle v-model="sf.incognito"
            :class="'col-auto q-mt-xs q-pa-xs bord1 ' + (sf.incognito ? 'text-bold bg-warning' : '')"
            dense color="negative"
            :label="$t('HPincognito')" />
        </div>

        <div v-if="sf.incognito && !session.hasNet"
          class="titre-lg q-my-md text-italic text-warning text-bold">
          {{ $t('HPnosession') }}
        </div>

        <div v-if="session.hasNet" class="q-mt-md row items-start">
          <div class="col-auto titre-md text-italic">{{$t('HPnoreg')}}</div>
          <btn-cond class="q-ml-sm" size="md" icon="send" @ok="regme"/>
        </div>

        <div v-if="!sf.incognito && options.length === 0 && !session.hasNet"
          class="q-mt-sm titre-md text-italic">{{$t('HPnoplane')}}</div>

        <div v-if="options.length === 0 && session.hasNet"
          class="q-mb-sm wsm titre-md text-italic text-center">{{$t('HPnotrust')}}</div>
        </div>

        <p0-p1 v-if="!sf.incognito || session.hasNet"
          class="q-mt-md"  @ok="authPhrase"
          :title="$t('HPauth_' + (mayPIN ? '2' : '1'))"/>

        <div v-if="mayPIN">
          <div class="tbs q-mt-md q-px-xs titre-md text-italic">{{$t('HPseluser_1')}}</div>
          <div class="q-ml-md q-px-xs titre-sm text-italic">{{$t('HPseluser_2')}}</div>
          <div class="q-ml-md q-mb-sm row items-center">
            <q-select class="col-6 q-pr-sm" dense filled :label="$t('HPiam')"
              transition-show="flip-up" transition-hide="flip-down"
              v-model="selectedSafe" :options="options" />
            <pin-code class="col-6" :disable="selectedSafe === null" @ok="authPin"/>
          </div>
        </div>

    </q-step>

    <q-step :name="2" :title="$t('HPsession')" icon="send">
      <div class="column q-pa-sm items-center">
        <div class="full-width row justify-between items-start">
          <btn-cond icon="chevron_left" :label="$t('HPauthentif')" size="md" flat
            color="warning" @ok="backToAuth"/>
          <div class="titre-sm text-italic">{{$t('HPauthby_' + sf.openMode)}}</div>
        </div>

        <div class="column full-width">
          <div v-if="sf.openMode !== 3"
            class="self-end q-mt-sm row justify-center items-start">
            <div class="col titre-md text-italic text-right">{{$t('HPupdcodes')}}</div>
            <btn-cond class="q-ml-sm" size="md" icon="send" @ok="updCodes"/>
          </div>
          <div v-if="sf.openMode !== 3 && myTrusting === null"
            class="self-end q-mt-sm row justify-center items-start">
            <div class="col titre-md text-italic text-right">{{$t('HPtrust')}}</div>
            <btn-cond class="q-ml-sm" size="md" icon="send" @ok="openTrust"/>
          </div>
          <q-separator v-if="sf.openMode !== 3 && myTrusting !== null" class="full-width q-mt-xs"/>
          <div v-if="sf.openMode !== 3 && myTrusting !== null"
            class="self-center titre-md">{{$t('HPuntrust')}}</div>
          <div v-if="sf.openMode !== 3 && myTrusting !== null"
            class="self-end q-mt-sm row justify-center items-start">
            <div class="col titre-md text-italic text-right">{{$t('HPuntrust_p')}}</div>
            <btn-cond class="q-ml-sm" size="md" icon="send" @ok="openTrust"/>
          </div>
          <div v-if="sf.openMode !== 3 && myTrusting !== null"
            class="self-end q-mt-sm row justify-center items-start">
            <div class="col titre-md text-italic text-right">{{$t('HPuntrust_r')}}</div>
            <btn-cond class="q-ml-sm" size="md" icon="send" @ok="openUntrust"/>
          </div>
          <q-separator v-if="sf.openMode !== 3 && myTrusting !== null" class="full-width q-mb-xs"/>
        </div>

        <div class="row titre-md text-italic q-my-sm q-gutter-sm items-center">
          <div>{{$t('HPvol_1', sf.trustings.size, { count: sf.trustings.size })}}</div>
          <div v-if="sf.trustings.size !== 0">{{$t('HPvol_2', [edvol(totalVol)])}}</div>
          <btn-cond v-if="sf.trustings.size !== 0" icon="open_in_new" 
            :label="$t('HPvol_3')" @ok="freeVol"/>
        </div>
        
      </div>
    </q-step>
  </q-stepper>

  <!-- Confirmation du resetAll -->
  <q-dialog v-model="ui.dModels[idc].resetAll" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
      <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
      <div class="q-my-md titre-lg text-bold text-italic text-center">{{$t('HPskull')}}</div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm actif :confirm="resetAllLocal"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Suppression des IDB des sessions épinglées -->
  <q-dialog v-model="ui.dModels[idc].delIDBS" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" :label="$t('giveup')" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-smd">{{$t('HPunpin_1')}}</q-toolbar-title>
        <help-button page="HPdelIDBS"/>
      </q-toolbar>
      <div class="q-pa-sm">
        <div class="titre-md">{{ $t('HPunpin_2') }}</div>
        <div class="titre-md q-ml-md">{{ $t('HPunpin_3') }}</div>
        <div class="titre-md q-ml-md">{{ $t('HPunpin_4') }}</div>
        <q-separator class="q-mt-xs q-mb-sm"/>

        <div class="row q-mb-sm titre-md text-italic">
          <div class="col-1"/>
          <div class="col-2">{{$t('HPupc_1')}}</div>
          <div class="col-2">{{$t('HPupc_2')}}</div>
          <div class="col-2">{{$t('HPupc_3')}}</div>
          <div class="col-5">{{$t('HPupc_4')}}</div>
        </div>
        <q-separator class="q-mt-xs q-mb-sm"/>

        <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle">
          <div :class="dkli(idx)" v-for="([id, s], idx) of sf.tsessions" :key="id">
            <div class="row font-mono fs-md items-center">
              <q-checkbox class="col-1" dense size="sm" 
                v-model="selS.get(id).c"
                @update:model-value="onSelS"/>
              <div class="col-2">{{sf.trigOfS(s)}}</div>
              <div class="col-2">{{s.app}}</div>
              <div class="col-2">{{edvol(sf.volOfS(s))}}</div>
              <div class="col-5">{{dhcool(s.time)}}</div>
            </div>
            <div class="row q-mb-sm fs-md">
              <div class="col-3"></div>
              <div class="col-9">{{s.profAbout}}</div>
            </div>
          </div>
        </q-scroll-area>

        <q-separator class="q-mt-xs"/>
        <div class="row items-center justify-end">
          <div class="titre-md text-bold q-ma-none q-pa-none q-mr-md">
            {{ $t('HPfreev', [edvol(vsel), edvol(vlib)]) }}</div>
          <btn-confirm class="q-ma-none q-pa-none"
            :actif="vsel !== 0" :confirm="purgeIDBS"/>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- Création d'un safe / Changement des codes -->
  <q-dialog v-model="ui.dModels[idc].createSafe" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-smd">{{$t('HPenreg_' + (createMode ? '1' : '2'))}}</q-toolbar-title>
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

  <!-- Retirer ma confiance à ce terminal -->
  <q-dialog v-model="ui.dModels[idc].untrustit" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-md q-mb-sm titre-lg text-italic">
        {{$t('HPutnbs', mySessions.length, {count: mySessions.length})}}
      </div>
      <div class="column q-mb-md">
        <div class="titre-md">{{$t('HPutd_1')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_2')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_3')}}</div>
      </div>

      <div v-if="mySessions.length" class="q-mb-sm q-pa-xs row">
        <div class="col-3 q-pr-md text-right titre-md text-italic">{{$t('HPutc1')}}</div>
        <div class="col-9 titre-md text-italic">{{$t('HPutc2')}}</div>
      </div>
      <div v-if="mySessions.length" class="q-my-sm q-mx-md slist q-pa-xs">
        <q-scroll-area style="height: 150px" :barStyle="barStyle" :thumbStyle="thumbStyle">
          <div v-for="(s, idx) in mySessions" :key="idx" class="q-my-xs row">
            <div class="col-3 q-pr-md text-right font-mono">{{s.app}}</div>
            <div class="col-9 fs-md">{{s.profAbout}}</div>
          </div>
        </q-scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPuntrust_1')" color="warning"
          @ok="setUntrust"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import PinCode from '../components-fw/PinCode.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import stores from '../stores/all'
import type { TSession } from '../stores/safe-store'
import { $t, sty, dkli, equ8, edvol, dhcool, coolBye } from '../src-fw/util'

// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin
const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }
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

const hasIDB = ref(false)

onMounted(async () => { 
  await sf.init0()
})

const opCfReset = () => {
  ui.oD(idc, 'resetAll')
}

const resetAllLocal = async () => {
  await sf.resetAllLocal()
  coolBye()
}

const step = ref(1)
const p0p1 = ref(null)
const pin = ref(null)
const selectedSafe = ref(null)
const totalVol = ref(0)

const options = computed(() => {
  const r = []
  sf.trustings.forEach(e => { r.push({ label: e.pseudo, value: e }) })
  return r
})

const mayPIN = computed(() => 
  sf.hasIDB && !sf.incognito && options.value.length > 0 && session.hasNet)

watch(options, (ap) => {
  selectedSafe.value = ap.length ? ap[0] : null
})

const backToAuth = () => {
  step.value = 1
  p0p1.value = null
  pin.value = null
}

const authPhrase = async (args) => {
  p0p1.value = args
  const status = await sf.openSafe(args.sh0, args.sh1, args.sh)
  if (status !== 0) await ui.diagDisplay($t('HPopsret_' + status))
  else await openSession()
}

const authPin = async (p) => {
  pin.value = p
  const userId = selectedSafe.value['value']['userId']
  const status = await sf.openSafeByPin(pin.value, userId)
  if (status !== 0) await ui.diagDisplay($t('HPbypin_' + status))
  else await openSession()
}

const openSession = async () => {
  await sf.getCurrentPref()
  myTrusting.value = sf.getMyTrusting()
  totalVol.value = sf.getSessionSize()
  step.value = 2
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
    await openSession()
  }
}

const myTrusting = ref(null)
const newDev = ref(false)
const devName = ref('')
const newPIN = ref('')
const pinPwd = ref(false)

const deverr = computed(() => devName.value.length < minDev ? 'PScourt' : (devName.value.length > maxDev ? 'PSlong' : ''))
const pinerr = computed(() => newPIN.value.length < minpin ? 'PScourt' : (newPIN.value.length > maxpin ? 'PSlong' : ''))
const trusterr = computed(() => deverr.value !== '' || pinerr.value !== '')

const openTrust = async () => {
  myTrusting.value = sf.getMyTrusting()
  newDev.value = sf.devId === ''
  newPIN.value = ''
  devName.value = newDev.value ? '' : sf.devName
  ui.oD(idc, 'trustit')
}

/*
export type TSession = {
  app: string
  userId: string
  profId: string
  profAbout: string | Uint8Array
  size: number
  prefs: Object | Uint8Array
}
*/
const mySessions = ref<TSession>(null)
const openUntrust = async () => {
  mySessions.value = sf.getMySessions()
  ui.oD(idc, 'untrustit')
}

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.value, newPIN.value)
    ui.fD()
    myTrusting.value = sf.getMyTrusting()
    await ui.diagDisplay($t('HPsttrust_' + status))
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const setUntrust = async () => {
  try {
    const status = await sf.setUntrust()
    ui.fD()
    myTrusting.value = sf.getMyTrusting()
    await ui.diagDisplay($t('HPstuntrust_' + status))
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const vlib = ref(0)
const vsel = ref(0)
const selS = ref() // Map<string, { c, v }>

const freeVol = () => {
  vlib.value = sf.getSessionSize()
  vsel.value = 0
  const x = new Map<string, Object>()
  for (const [id, s] of sf.tsessions) 
    x.set(id, { c: false, v: sf.volOfS(s)})
  selS.value = x
  ui.oD(idc, 'delIDBS')
}

const onSelS = () => {
  let t = 0
  for(const [id, s] of sf.tsessions) {
    const e = selS.value.get(id) 
    if (e.c) t += e.v
  }
  vsel.value = t
}

const purgeIDBS = async () => {
  const l = []
  for(const [id,] of sf.tsessions) {
    const e = selS.value.get(id) 
    if (e.c) l.push(id)
  }
  await sf.purgeIDBS(l)
  ui.fD()
}

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

