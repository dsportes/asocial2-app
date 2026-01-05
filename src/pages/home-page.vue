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
          <btn-cond v-if="!sf.incognito" round icon="local_police" 
            size="sm" color="negative" @ok="opCfReset"/>
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
      </div>

      <q-tabs v-model="tab" dense align="justify" class="q-mt-sm">
        <q-tab no-caps name="1" class="bg-primary">
          <div class="column items-center">
            <q-icon name="person" size="32px"/>
            <div class='titre-md text-bold text-white'>{{$t('HPtab_1')}}</div>
          </div>
        </q-tab>
        <q-tab v-if="!sf.incognito && session.hasNet" 
          no-caps name="2" class="bg-secondary">
          <div class="column items-center">
            <q-icon name="person_add" size="32px"/>
            <div class='titre-md text-bold text-white'>{{$t('HPtab_2')}}</div>
          </div>
        </q-tab>
        <q-tab no-caps name="3" class="bg-grey-7">
          <div class="column items-center">
            <q-img :src="anonymousB" style="height: 32px; max-width: 32px;"/>
            <div class='titre-md text-bold text-black'>{{$t('HPtab_3')}}</div>
          </div>
        </q-tab>
      </q-tabs>

      <div v-if="!sf.incognito" 
        :class="'tab' + tab + ' tablr q-px-sm row q-py-sm items-start'">
        <q-icon class="col-1" name="info" size="1.2rem" />
        <div class="col-11">
          <span class="titre-md text-italic">{{$t('HPnbUt', nbUt)}}</span>
          <span v-if="sf.devName" class="font-mono text-bold q-ml-sm">
            {{'[' + sf.devName + ']'}}</span>
        </div>
      </div>

      <div v-if="tab === '1'" :class="'tab' + tab + ' tablr tabb q-px-sm q-py-sm'">

        <p0-p1 v-if="mayPS" class="q-mt-md" @ok="authPS"
          :title="$t('HPauth_' + (mayPIN ? '2' : '1'))"/>

        <div v-if="mayPIN">
          <div class="tbs q-mt-md q-px-xs titre-md text-italic">{{$t('HPseluser_1')}}</div>
          <div class="q-ml-md q-px-xs titre-sm text-italic">{{$t('HPseluser_2')}}</div>
          <div class="q-ml-md q-mb-sm row items-center">
            <q-select class="col-6 q-pr-sm" dense filled :label="$t('HPiam')"
              transition-show="flip-up" transition-hide="flip-down"
              v-model="selectedSafe" :options="options" />
            <input-ps class="col-6" style="max-width:16rem" v-model="pin"
              :validate="authPIN" iconcheck :disable="selectedSafe === null"
              :sz="cfg.K.sizePin" :label="$t('PSpin')" :ph="$t('PSpinh')"/>              
          </div>
        </div>
      </div>

      <div v-if="tab === '2'" :class="'tab' + tab + ' tablr tabb q-px-sm q-py-sm'">
        <safe-cr create-mode :onValidate="openSession"/>
      </div>

      <div v-if="tab === '3'" :class="'tab' + tab + ' tablr tabb q-px-sm q-py-sm'">
        <div class="titre-md text-italic">{{$t('HP3ps')}}</div>
        <input-ps v-model="locPS" iconcheck
          :validate="validateLocPS"
          :sz="cfg.K.sizeP1" :label="$t('PSphrase')" :ph="$t('PSphraseh')"/>

        <div v-if="locK !== null">
          <div v-if="newLocUt" class="q-my-sm">
            <div class="titre-md">{{$t('HP3v1')}}</div>
            <input-ps v-model="locTr" iconcheck
              :validate="validateLocTr"
              :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
          </div>
          <div v-else class="q-my-sm">
            <div class="titre-md">{{$t('HP3v2_0')}}</div>
            <div class="titre-md q-ml-md">{{$t('HP3v2_1')}}</div>
            <div class="titre-md q-ml-md">{{$t('HP3v2_2')}}</div>
            <input-ps v-model="locTr" iconcheck
              :validate="validateLocTr"
              :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
          </div>
        </div>
      </div>
    </q-step>

    <q-step :name="2" :title="$t('HPsession')" icon="send">
      <div class="q-pa-sm">
        <div class="full-width row justify-between items-center">
          <btn-cond icon="chevron_left" :label="$t('HPauthentif')" size="md" flat
            color="warning" @ok="backToAuth"/>
          <div class="titre-sm text-italic">{{$t('HPauthby_' + sf.openMode)}}</div>
          <q-btn icon="more_vert" size="md">
            <q-menu>
              <q-list style="min-width: 350px">
                <q-item v-if="tab !== '3' && sf.openMode !== 3" clickable v-close-popup
                    @click="ui.oD(idc, 'chgCodes')">
                  <q-item-section class="titre-md text-right">{{$t('HPchgcodes')}}</q-item-section>
                </q-item>
                <q-separator/>

                <div v-if="tab !== '3' && sf.openMode !== 3 && myTrusting === null"
                  class="titre-sm text-italic q-mr-lg q-mt-xs">{{$t('HPtrust')}}</div>
                <q-item v-if="tab !== '3' && sf.openMode !== 3 && myTrusting === null" clickable v-close-popup
                    @click="openTrust">
                  <q-item-section class="titre-md text-right">{{$t('HPtrust_a')}}</q-item-section>
                </q-item>
                <q-separator v-if="tab !== '3' && sf.openMode !== 3 && myTrusting === null"/>

                <div v-if="tab !== '3' && sf.openMode !== 3 && myTrusting !== null"
                  class="titre-sm text-italic q-mr-lg q-mt-xs">{{$t('HPuntrust')}}</div>
                <q-item v-if="tab !== '3' && sf.openMode !== 3 && myTrusting !== null" clickable v-close-popup
                    @click="openUntrust">
                  <q-item-section class="titre-md text-right">{{$t('HPuntrust_r')}}</q-item-section>
                </q-item>
                <q-item v-if="tab !== '3' && sf.openMode !== 3 && myTrusting !== null" clickable v-close-popup
                    @click="openTrust">
                  <q-item-section class="titre-md text-right">{{$t('HPuntrust_p')}}</q-item-section>
                </q-item>
                <q-separator v-if="tab !== '3' && sf.openMode !== 3 && myTrusting !== null"/>

                <div class="titre-sm text-italic q-mr-lg">
                  <span>
                    {{$t('HPvol_1', sf.tsessions.size, { count: sf.tsessions.size })}}</span>
                  <span class="q-ml-sm" v-if="sf.tsessions.size !== 0">
                    {{$t('HPvol_2', [edvol(totalVol)])}}</span>
                </div>
                <q-item v-if="sf.tsessions.size !== 0 && sf.openMode !== 3 && myTrusting !== null" clickable v-close-popup
                    @click="freeVol">
                  <q-item-section class="titre-md text-right">{{$t('HPvol_3')}}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <q-separator class="full-width q-mt-xs q-mb-sm"/>

        <div class="text-center titre-lg q-my-md">TODO !</div>
      </div>
    </q-step>
  </q-stepper>

  <!-- Changement des codes -->
  <q-dialog v-model="ui.dModels[idc].chgCodes" persistent>
    <q-card :class="sty('md')">
      <safe-cr :onValidate="openSession"/>
    </q-card>
  </q-dialog>

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

        <div class="row titre-md text-italic">
          <div class="col-1"/>
          <div class="col-4">{{$t('HPupc_1')}}</div>
          <div class="col-4">{{$t('HPupc_2')}}</div>
          <div class="col-3">{{$t('HPupc_3')}}</div>
        </div>
        <div class="row q-mb-sm titre-md text-italic">
          <div class="col-1"/>
          <div class="col-11">{{$t('HPupc_4')}}</div>
        </div>
        <q-separator class="q-mt-xs q-mb-sm"/>

        <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle">
          <div :class="dkli(idx)" v-for="([id, s], idx) of sf.tsessions" :key="id">
            <div class="row font-mono fs-md items-start">
              <q-checkbox class="col-1" dense size="sm" 
                v-model="selS.get(id).c"
                @update:model-value="onSelS"/>
              <div class="col-4 ellipsis q-pr-xs">{{sf.pseudoOfS(s)}}</div>
              <div class="col-4 ellipsis q-pr-xs">{{s.app}}</div>
              <div class="col-3">{{edvol(sf.volOfS(s))}}</div>
            </div>
            <div class="row font-mono fs-md items-start">
              <div class="col-1"></div>
              <div class="col-11">{{dhcool(s.time)}}</div>
            </div>
            <div v-if="s.profAboutStr !== ''" class="row q-mb-sm fs-md">
              <div class="col-1"></div>
              <div class="col-11">{{s.profAboutStr}}</div>
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

  <!-- Accorder ma confiance à ce terminal -->
  <q-dialog v-model="ui.dModels[idc].trustit" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-lg row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">
          {{$t(newDev ? 'HPsetdev' : 'HPchgdev')}}
        </div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem" v-model="devName"
          :sz="cfg.K.sizeDev" :label="$t('PSdevname')" :ph="$t('PSdevnameh')"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPIN')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem" v-model="newPIN"
          :sz="cfg.K.sizePin" :label="$t('PSpin')" :ph="$t('PSpinh')"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPseudo')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem" v-model="newPseudo"
          :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPtrust_1')" color="warning" :disable="trusterr" @ok="setTrust"/>
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
            <div class="col-9 fs-md">{{s.profAboutStr}}</div>
          </div>
        </q-scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPuntrust_1')" color="warning" @ok="setUntrust"/>
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
import InputPs from '../components-fw/InputPs.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import ChooseIt from '../components-fw/ChooseIt.vue'
import SafeCr from '../components-fw/SafeCr.vue'

import stores from '../stores/all'
import type { TSession } from '../stores/safe-store'
import { $t, $q, sty, dkli, equ8, edvol, dhcool, coolBye } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import anonymousW from '../assets/anonymous_white.png'
import anonymousB from '../assets/anonymous_black.png'

// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin
const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const hasIDB = ref(false)
const tab = ref('1')

onMounted(async () => { 
  hasIDB.value = await sf.init0()
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
const pin = reactive({ inp: '', err: '' })
const selectedSafe = ref(null)
const totalVol = ref(0)

const options = computed(() => {
  const r = []
  if (sf.trustings)
    sf.trustings.forEach(e => { r.push({ label: e.pseudo, value: e }) })
  return r
})

const nbUt = computed(() => sf.trustings ? sf.trustings.size : 0)

const mayPIN = computed(() => !sf.incognito && nbUt.value > 0 && session.hasNet)

const mayPS = computed(() => session.hasNet || (!sf.incognito && nbUt.value > 0))

watch(options, (ap) => { selectedSafe.value = ap.length ? ap[0] : null })

const backToAuth = () => {
  step.value = 1
  pin.inp = ''
  locPS.inp = ''
  locK.value = null
}

const authPS = async (args) => {
  const status = await sf.openSafe(args.sh0, args.sh1, args.sh)
  if (status !== 0) await ui.diagDisplay($t('HPopsret_' + status))
  else await openSession()
}

const authPIN = async () => {
  const userId = selectedSafe.value['value']['userId']
  const status = await sf.openSafeByPin(pin.inp, userId)
  if (status !== 0) await ui.diagDisplay($t('HPbypin_' + status))
  else await openSession()
}

const openSession = async () => {
  if (!sf.incognito) {
    if (!hasIDB.value) await sf.init1()
    await sf.getCurrentPref()
  }
  await sf.decryptSessions()
  myTrusting.value = sf.getMyTrusting()
  totalVol.value = sf.getSessionSize()
  step.value = 2
}

const myTrusting = ref(null)
const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })

const dup = computed(() => {
  let b = false
  sf.trustings.forEach(e => { 
    if (e.userId !== sf.userId && e.pseudo === newPseudo.inp) b = true 
  })
  return b
})

watch(newPseudo, (v) => { if (!v.err && dup.value) v.err = $t('PSdup') })

const trusterr = computed(() => devName.err !== '' || newPIN.err !== '' || newPseudo.err !== '')

const openTrust = async () => {
  myTrusting.value = sf.getMyTrusting()
  newDev.value = sf.devId === ''
  newPIN.inp = ''
  devName.inp = newDev.value ? '' : sf.devName
  newPseudo.inp = sf.auth.pseudo
  ui.oD(idc, 'trustit')
}

const mySessions = ref<TSession>(null)

const openUntrust = async () => {
  mySessions.value = sf.getMySessions()
  ui.oD(idc, 'untrustit')
}

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.inp, newPIN.inp, newPseudo.inp)
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
  await openSession()
}

const locPS = reactive({ inp: '', err: ''})
const locTr = reactive({ inp: '', err: ''})
const locK = ref(null)
const newLocUt = ref(false)

const validateLocPS = async () => {
  if (locPS.err !== '') return
  locK.value = await Crypt.strongHash(locPS.inp, true, false)
  sf.userId = '$' + Crypt.shaS(locK.value)
  myTrusting.value = sf.getMyTrusting()
  newLocUt.value = myTrusting.value === null
  locTr.inp = newLocUt.value ? '' : myTrusting.value.pseudo
}

const validateLocTr = async () => {
  if (locTr.err !== '') return
  if (newLocUt.value) {
    myTrusting.value = sf.newTrustingL({
      userId: sf.userId,
      pseudo: locTr.inp,
      hsh: Crypt.sha(locK.value, true),
      creds: [],
      prefs: null
    })
  } else {
    myTrusting.value.pseudo = locTr.inp
  }
  if (!hasIDB.value) await sf.init1()
  await sf.setTrusting(myTrusting.value)
  sf.keyK = locK.value
  openSession()
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

.tablr { border-left: 2px solid; border-right: 2px solid; }
.tabb { border-bottom-right-radius: 7px; border-bottom-left-radius: 7px; border-bottom: 2px solid; }
.tab1 { border-color: $primary !important; }
.tab2 { border-color: $secondary !important; }
.tab3 { border-color: $grey-7 !important; }
</style>
