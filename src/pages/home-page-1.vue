<template>
<div class="column items-center">
  <q-stepper v-model="step" color="primary" animated class="pwmd"
    header-class="titre-lg">
    <q-step :name="1" :title="$t('HPauthentif')" icon="passkey" class="q-pa-sm">

      <div class="full-width row justify-between q-px-xs" style="min-height:2rem">
        <q-toggle v-model="session.hasNet"
          :class="'q-pa-xs' + (!session.hasNet ? 'text-bold bg-warning' : '')"
          dense color="positive"
          checked-icon="cloud" unchecked-icon="cloud_off"
          :label="$t(session.hasNet ? 'HPnet' : 'HPplane')" />
        <btn-cond v-if="!sf.incognito" round icon="local_police" 
          size="sm" color="negative" @ok="opCfReset"/>
      </div>

      <div class="full-width row q-px-xs" style="min-height:2rem">
        <q-toggle v-model="sf.incognito"
          :class="'col-auto q-mt-xs q-pa-xs' + (sf.incognito ? 'text-bold bg-warning' : '')"
          dense color="negative"
          :label="$t('HPincognito_' + (sf.incognito ? '1' : '2'))" />
      </div>

      <div v-if="sf.incognito && !session.hasNet" class="q-ma-md row justify-between items-center">
        <div class="col q-mr-sm titre-md q-my-md text-italic text-warning text-bold">
          {{ $t('HPnosession') }}</div>
        <btn-cond class="col-auto" :label="$t('open')" icon="send" 
          @ok="validateSessionV()"/>
      </div>

      <div v-else>
        <q-tabs v-model="tab" dense align="justify" class="q-mt-sm">
          <q-tab no-caps name="1" class="bg-primary">
            <div class="column items-center">
              <q-icon name="person" size="32px"/>
              <div class='titre-md text-bold text-white'>{{$t('HPtab_1')}}</div>
            </div>
          </q-tab>
          <q-tab :disable="!session.hasNet" no-caps name="2" class="bg-secondary">
            <div class="column items-center">
              <q-icon name="person_add" size="32px"/>
              <div class='titre-md text-bold text-white'>{{$t('HPtab_2')}}</div>
            </div>
          </q-tab>
          <q-tab :disable="sf.incognito" no-caps name="3" class="bg-grey-7">
            <div class="column items-center">
              <q-img :src="anonymousB" style="height: 32px; max-width: 32px;"/>
              <div class='titre-md text-bold text-black'>{{$t('HPtab_3')}}</div>
            </div>
          </q-tab>
        </q-tabs>

        <div v-if="tab === '1'" :class="'tab' + tab + ' tablr tabb q-pa-sm'">

          <div class="row q-mb-md items-start q-gutter-xs">
            <q-icon class="col-auto" name="info" size="1.2rem" />
            <div class="col">
              <span class="titre-md text-italic">{{$t('HPnbUt', nbUt)}}</span>
              <span v-if="sf.devName" class="font-mono text-bold q-ml-sm">
                {{'[' + sf.devName + ']'}}</span>
              <div v-if="!nbUt && !session.hasNet"
                class="titre-md text-italic">{{$t('HPnoplane')}}</div>
            </div>
          </div>

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

        <div v-if="tab === '2'" 
          :class="'tab' + tab + ' tablr tabb q-pa-sm' + (!session.hasNet ? ' disabled' : '')">

          <div class="row q-mb-md items-start q-gutter-xs">
            <q-icon class="col-auto" name="info" size="1.2rem" />
            <div class="col">
              <span class="titre-md text-italic">{{$t('HPnbUt', nbUt)}}</span>
              <span v-if="sf.devName" class="font-mono text-bold q-ml-sm">
                {{'[' + sf.devName + ']'}}</span>
              <div v-if="!nbUt && !session.hasNet"
                class="titre-md text-italic">{{$t('HPnoplane')}}</div>
            </div>
          </div>

          <safe-cr create-mode :onValidate="openSession"/>
        </div>

        <div v-if="tab === '3'" 
          :class="'tab' + tab + ' tablr tabb q-pa-sm' + (sf.incognito ? ' disabled' : '')">

          <div class="row q-mb-md items-start q-gutter-xs">
            <q-icon class="col-auto" name="info" size="1.2rem" />
            <div class="col">
              <span class="titre-md text-italic">{{$t('HPnban', nbAn)}}</span>
              <div v-if="!nbAn && !session.hasNet"
                class="titre-md text-italic">{{$t('HPnoplane')}}</div>
            </div>
          </div>

          <div class="titre-md text-italic">{{$t('HP3ps')}}</div>
          <input-ps v-model="locPS" iconcheck
            :validate="validateLocPS"
            :sz="cfg.K.sizeP1" :label="$t('PSphrase')" :ph="$t('PSphraseh')"/>

          <div v-if="sf.keyK !== null" class="q-my-md">
            <div v-if="newLocUt" class="titre-md">{{$t('HP3v1')}}</div>
            <div v-else>
              <div class="titre-md">{{$t('HP3v2_0')}}</div>
              <div class="titre-md q-ml-md">{{$t('HP3v2_1')}}</div>
              <div class="titre-md q-ml-md">{{$t('HP3v2_2')}}</div>
            </div>
            <div class="row justify-between q-gutter-sm items-center">
              <input-ps class="col" v-model="locTr"
                :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
              <btn-cond class="col-auto" :label="$t('HPitsme')"
                :disable="locTr.err !== ''"
                @ok="validateLocTr"/>
            </div>
          </div>
        </div>
      </div>
    </q-step>

    <q-step v-if="!sf.incognito || session.hasNet"
     :name="2" :title="$t('HPsession')" icon="send">
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

        <div v-if="tab === '3'">
          <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
          <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div :class="(nvClicked ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
              @click="nvSession()">
              <div class="col-7 q-pr-xs">{{$t('HPnvs')}}</div>
              <div class="col-5"></div>
            </div>
            <div :class="dkli(idx + 1)" v-for="(s, idx) of mySessions" :key="s.profId">
              <div :class="(selectedSession === s ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
                @click="selSession(s)">
                <div class="col-7 q-pr-xs">{{s.about}}</div>
                <div class="col-5 ">{{dhcool(s.time)}}</div>
              </div>
            </div>
          </q-scroll-area>
          <div v-if="nvSP" class="q-mt-md">
            <q-checkbox v-if="selectedSession && !sf.incognito" 
              v-model="razdb" :label="$t('HPresetdb')" 
              style="margin-left: -12px"/>
            <div class="titre-md text-italic q-mt-md">
              {{$t(selectedSession ? 'HPrensession' : 'HPnouvsession')}}
            </div>
            <input-ps v-model="newSessionName"
              :sz="cfg.K.sizeSn" :label="$t('PSsn')" :ph="$t('PSsnh')"/>
            <div :class="(newSessionName.err !== '' ? 'disabled' : '') + ' q-mt-md'">
              <div class="titre-md text-italic text-bold text-right">
                {{$t('HPwprfs')}}</div>
              <q-card-actions vertical align="right">
                <btn-cond flat :label="$t('HPpref_1')" @ok="validateSession('', null)"/>
                <btn-cond v-for="[code, data] in sf.tprefs" :key="code"
                  flat :label="'... ' + code" @ok="validateSession(code, data)"/>
              </q-card-actions>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
          <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
            class='bord1 q-pa-xs'>
            <div :class="(nvClicked ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
              @click="nvSession()">
              <div class="col-7 q-pr-xs">{{$t('HPnvs')}}</div>
              <div class="col-5"></div>
            </div>
            <div :class="dkli(idx + 1)" v-for="(s, idx) of mySessions" :key="s.profId">
              <div :class="clSel(s) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
                @click="selSession(s)">
                <div class="col-7 q-pr-xs">{{pincode + ' ' + s.about}}</div>
                <div class="col-5 ">{{dhcool(s.time)}}</div>
              </div>
            </div>
            <div :class="dkli(idx + 1 + mySessions.length)" 
              v-for="([profId, p], idx) of myProfiles2" :key="profId">
              <div :class="clSel(p) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
                @click="selProfile(profId, p)">
                <div class="col-7 q-pr-xs q-pl-xs">{{p.about}}</div>
                <div class="col-5">{{$t('HPnotpinned')}}</div>
              </div>
            </div>
          </q-scroll-area>
          <div v-if="nvSP" class="q-mt-md">
            <q-checkbox v-if="selectedSession && !sf.incognito" 
              v-model="unpinme" :label="$t('HPunpinme')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="selectedSession && !sf.incognito && !unpinme" 
              v-model="razdb" :label="$t('HPresetdb')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="!selectedSession && !sf.incognito" 
              v-model="pinned" :label="$t('HPsetpinned')" 
              style="margin-left: -12px"/>
            <div class="titre-md text-italic q-mt-md">
              {{$t(selectedSession ? 'HPrensession' : 'HPnouvsession')}}
            </div>
            <input-ps v-model="newSessionName"
              :sz="cfg.K.sizeSn" :label="$t('PSsn')" :ph="$t('PSsnh')"/>
            <div :class="(newSessionName.err !== '' ? 'disabled' : '') + ' q-mt-md'">
              <div class="titre-md text-italic text-bold text-right">
                {{$t('HPwprfs')}}</div>
              <q-card-actions vertical align="right">
                <btn-cond flat :label="$t('HPpref_1')" @ok="validateSession('', null)"/>
                <btn-cond v-for="[code, data] in myPrefs" :key="code"
                  flat :label="'... ' + code" @ok="validateSession(code, data)"/>
              </q-card-actions>
            </div>
          </div>
        </div>
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
            <div v-if="s.about !== ''" class="row q-mb-sm fs-md">
              <div class="col-1"></div>
              <div class="col-11">{{s.about}}</div>
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
            <div class="col-9 fs-md">{{s.about}}</div>
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

const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin
const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const tab = ref('1')

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
const pin = reactive({ inp: '', err: '' })
const selectedSafe = ref(null)
const totalVol = ref(0)

watch(() => ui.reopenSession, async (v) => {
  if (v) {
    await sf.init0()
    if (session.hasNet) await sf.reloadSafe()
    await openSession()
  }
}) 

const options = computed(() => {
  const r = []
  if (sf.trustings)
    sf.trustings.forEach(e => { 
      if (!e.isLocal) r.push({ label: e.pseudo, value: e }) 
    })
  return r
})

const nbUt = computed(() => {
  if (!sf.trustings || !sf.trustings.size) return 0
  let n = 0; for (const t of sf.trustings) if (!t.isLocal) n++
  return n
})

const nbAn = computed(() => {
  if (!sf.trustings || !sf.trustings.size) return 0
  let n = 0; for (const t of sf.trustings) if (t.isLocal) n++
  return n
})

const mayPIN = computed(() => !sf.incognito && options.length > 0 && session.hasNet)

const mayPS = computed(() => session.hasNet || (!sf.incognito && nbUt.value > 0))

watch(options, (ap) => { selectedSafe.value = ap.length ? ap[0] : null })

const backToAuth = () => {
  step.value = 1
  pin.inp = ''
  locPS.inp = ''
  sf.keyK = null
}

const authPS = async (args) => {
  const status = await sf.openSafeByPR(args.sh0, args.sh1, args.sh)
  if (status !== 0) await ui.diagDisplay($t('HPopsret_' + status))
  else await openSession()
}

const authPIN = async () => {
  const userId = selectedSafe.value['value']['userId']
  const status = await sf.openSafeByPin(pin.inp, userId)
  if (status !== 0) await ui.diagDisplay($t('HPbypin_' + status))
  else await openSession()
}

type Profile = {
  about: string
  creds: string[]
}

const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })

const mySessions = ref<TSession>()
const myTrusting = ref()

/* Seulement pour un utilisateur enregistré :
- myProfiles: Map des profiles NON cités dans une session épinglée
- myPrefs: prefs enregistrées dans le Safe
*/
const myProfiles: Ref<Map<string, Profile>> = ref()
const myProfiles2: Ref<Map<string, Profile>> = ref()
const myPrefs: Ref<Map<string, Uint8Array>> = ref()
const nvClicked = ref()

const openSession = async () => {
  nvClicked.value = false
  if (!sf.incognito && !sf.hasIDBS) await sf.init1()

  mySessions.value = await sf.getMySessions()
  myTrusting.value = sf.getMyTrusting()
  totalVol.value = sf.getSessionSize()
  
  if (!sf.incognito) {
    await sf.loadMyLocalPrefs()
    await sf.loadMyLocalCreds()
  }

  if (tab.value !== '3') {
    const profIds = new Set<string>()
    for (const s of mySessions.value) 
      if (s.profId) profIds.add(s.profId)
    myProfiles.value = sf.getMySafeProfiles()
    myProfiles2.value = new Map<string, Profile>()
    for (const [profId, p] of myProfiles.value) {
      if (!profIds.has(profId)) myProfiles2.value.set(profId, p)
    }
    myPrefs.value = sf.getMySafePrefs()
    if (!sf.incognito) {
      await sf.refreshLocalPrefs()
      await sf.refreshLocalCreds()
    }
  } else {
    myPrefs.value = sf.tprefs
  }

  selectedSession.value = null
  selectedProfile.value = null
  step.value = 2
}

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
const newLocUt = ref(false)

const validateLocPS = async () => {
  if (locPS.err !== '') return
  sf.keyK = await Crypt.strongHash(locPS.inp, true, true)
  sf.userId = '$' + Crypt.shaS(sf.keyK)
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
      hsh: Crypt.sha(sf.keyK, true),
      creds: [],
      prefs: null
    })
  } else {
    myTrusting.value.pseudo = locTr.inp
  }
  if (!sf.hasIDBS) await sf.init1()
  await sf.setTrusting(myTrusting.value)
  openSession()
}

type TSession = { 
  app: string // code de l'application
  userId: string // id de l'utilisateur
  profId: string // id du profil
  about: string | Uint8Array // commentaire de l'utilisateur sur cette session
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal
  credIds?: string[] // liste des codes des credentials
  prefCode: string // préférences utilisées la dernière fois
}

const selectedSession: Ref<TSession> = ref(null)
const selectedProfile: Ref<{string, Profile}> = ref(null)
const razdb = ref(false)
const unpinme = ref(false)
const pinned = ref(false)
const newSessionName = reactive({ inp: '', err: '' })

watch(razdb, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPrazbl'))
})

const nvSP = computed(() => nvClicked.value || selectedSession.value || selectedProfile.value)

const nvSession = () => {
  nvClicked.value = true
  razdb.value = false
  selectedSession.value = null
  selectedProfile.value = null
  newSessionName.inp = ''
}

const selSession = (s) => {
  nvClicked.value = false
  razdb.value = false
  selectedSession.value = s
  selectedProfile.value = null
  newSessionName.inp = s.about
}

const clSel = (x) => {
  if (selectedSession.value === x) return 'bord2 '
  if (selectedProfile.value && selectedProfile.value.profile === x) return 'bord2 '
  return ''
}

const selProfile = (profId: string, profile: Profile) => {
  nvClicked.value = false
  razdb.value = false
  selectedSession.value = null
  selectedProfile.value = { profId, profile }
  newSessionName.inp = profile.about
}

type TCred = {
  credId: string // id du credential
  about: Uint8Array // commentaire crypté de l'utilisateur sur cette session
  data: Uint8Array // objet serialisé
}

const getCreds = (credIds: string[]) : Map<string, TCred> => {
  const creds: Map<string, TCred> = new Map<string, TCred>()
  if (credIds && credIds.length) {
    if (session.hasNet) {
      for(const id of credIds) {
        const tc = sf.creds.get(id)
        if (tc) creds.put(id, tc)
      }
    } else {
      for(const id of credIds) {
        const tc = sf.tcreds.get(id)
        if (tc) creds.put(id, tc)
      }
    }
  }
  return creds
}

/*
const validateSession = async (code, data) => {
  if (newSessionName.err !== '') return
  let sv = selectedSession.value

  if (!sv) {
    sv = sf.newTSession({
      app: cfg.appname,
      userId: sf.userId,
      profId: '',
      about: '',
      size: 0,
      time: 0,
      credIds: [],
      prefCode: ''
    })
  }
  sv.about = newSessionName.inp
  sv.prefCode = code

  await sf.setTSession(sv, razdb.value)
  session.setDbName(sf.incognito ? '' : sv.dbName)

  await goToApp(sv.about, getCreds(sv.credIds), code, data)
}
*/

const validateSession = async (code, data) => {
  if (newSessionName.err !== '') return

  let sv = selectedSession.value
  const sp = selectedProfile.value
  let credIds: string[]
  let about: string = newSessionName.inp

  if (sv) { 
    // reprise d'une session épinglée
    const profile: Profile = myProfiles.value.get(sv.profId)

    if (profile) {
      if (profile.about !== about && session.hasNet) 
        // Maj du profile dans Safe
        await sf.setAboutProfile(sv.profId, about)
      // Récupération des credIds du profile Safe
      sv.credIds = profile.creds
    } // Sinon on laisse ses credIds tel quel
    sv.about = about
    sv.prefCode = code

    credIds = sv.credIds
    if (!unpinme.value) {
      // save tsession avec time, raz db si requis
      await sf.setTSession(sv, razdb.value)
      session.setDbName(sf.incognito ? '' : sv.dbName)
    } else {
      await sf.delTSession(sv)
    }

  } else if (sp) { 
    // nouvelle session ouverte depuis un profile (QUI EXISTE)
    // Il y a TOUJOURS du réseau pour avoir pu choisir un "profile"
    const profId = sp.profId
    const profile = sp.profile

    if (profile.about !== about)
      // Maj du profile dans Safe
      await sf.setAboutProfile(profId, about)

    if (pinned.value) { 
      // session épinglée
      const nvs = sf.newTSession({
        app: cfg.appname,
        userId: sf.userId,
        profId: profId,
        about: about,
        credIds: profile.creds,
        size: 0,
        time: 0,
        prefCode: code
      } as TSession)
      await sf.setTSession(nvs, true)
    }

    credIds = profile.creds

  } else {
    // nouvelle session vierge de droits
    // Il y a OU NON du réseau
    let profId = ''
    const credIds = []

    // Création du profile dans Safe - S'il y a du réseau
    if (session.hasNet) {
      profId = Crypt.shaS(Crypt.random(16))
      await sf.setAboutProfile(profId, about)
    }

    if (pinned.value) { 
      // Session épinglée : AVEC profil si réseau et sinon SANS profil
      const nvs = sf.newTSession({
        app: cfg.appname,
        userId: sf.userId,
        profId,
        about,
        credIds,
        size: 0,
        time: 0,
        prefCode: code
      })
      await sf.setTSession(nvs, true)
      session.setDbName(sf.incognito ? '' : nvs.dbName)
    } else {
      /* Ouverture d'une session "fugitive":
      - ne laissant aucune trace en local dans IDBS
      - sans profil
      - sans droits
      - sans IDB
      L'exécution n'aura laissée aucune trace (sans dans les DBs de l'appli)
      */
    }
  }

  await goToApp(about, getCreds(credIds), code, data)
}

const validateSessionV = async () => {
  await goToApp('', new Map<string, TCred>(), '', null)
}

const goToApp = async (about: string, creds: Map<string, TCred>, code: string, data: Uint8Array) => {
  let prefObj: Object = null
  let prefCode: string = ''
  try {
    prefObj = data ? decode(data) : null
    prefCode = code
  } catch (e) {
    console.log(e)
  }

  session.setStartContext({
    userId: sf.userId || '',
    about: about || '',
    creds,
    prefObj,
    prefCode
  })
  console.log('Go to app')
  ui.setPage('appHome')
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2 { border: 1px solid $warning; }
.diag { background: yellow; font-weight: bold; color: black; padding: 2px;
  border: 2px solid $negative; border-radius: 7px; width:100%; }
.bbot, .slist { border-bottom: 1px solid $grey-5 !important; }
.btop, .slist { border-top: 1px solid $grey-5 !important; }

.tablr { border-left: 2px solid; border-right: 2px solid; }
.tabb { border-bottom-right-radius: 7px; border-bottom-left-radius: 7px; border-bottom: 2px solid; }
.tab1 { border-color: $primary !important; }
.tab2 { border-color: $secondary !important; }
.tab3 { border-color: $grey-7 !important; }

.select:hover { background-color: $yellow-2; color: black; }
</style>
