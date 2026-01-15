<template>
<div class="column items-center">
<div :class="sty('md')">

  <div v-if="sf.step == 1" class="q-pa-sm">
    <!-- Entête : accès Internet, incognito, nom du terminal -->
    <div :class="'full-width x-py-xs column bordx' + (session.incognito && session.noNet ? '2' : '1')">
      <div class="row">
        <btn-bubble class="self-start q-mr-md" :text="$t('HPmode_' + (session.incognito ? '3' : '1'))"/>
        <q-toggle v-model="session.noNet" dense color="negative"
          :label="$t('HPnet_' + (session.noNet ? '2' : '1'))" />
      </div>

      <div class="row">
        <btn-bubble class="self-start q-mr-md" :text="$t('HPmode_' + (session.noNet ? '3' : '2'))"/>
        <q-toggle v-model="session.incognito" dense color="negative"
          :label="$t('HPincognito_' + (session.incognito ? '2' : '1'))"/>
      </div>
    </div>

    <div v-if="session.hasNet && sf.devName" class="row items-center q-mt-sm">
      <span class="titre-sm text-italic">{{$t('HPterminal')}}</span>
      <span class="font-mono fs-sm text-italic q-ml-sm">{{'[' + sf.devName + ']'}}</span>
    </div>

    <q-separator class="q-my-md"/>

    <!-- Je suis enregistré -->
    <div class="full-width row q-mt-md items-center">
      <btn-bubble class="self-start" size="md" :text="$t('HPregist_2')"/>
      <div :class="'q-ml-sm titre-lg text-italic' + (session.noNet && session.incognito ? '  disabled' : '')">
        {{$t('HPregist_1')}}</div>
    </div>

    <div v-if="session.hasNet || !session.incognito" class="q-pl-xl">
      <!-- Authentification par code PIN -->
      <div v-if="session.hasNet && users.length" class="row items-center">
        <btn-bubble size="sm" class="col-auto self-start q-mr-sm" :text="$t('HPauthbypin_2')"/>
        <div class="col text-right">
          <div class="column">
            <div class='titre-md q-mr-xs'>{{$t('HPauthbypin_1')}}</div>
            <div class="row justify-end">
              <div v-for="u in users" :key="u.userId"
                class="q-ml-sm font-mono fs-lg text-bold text-primary cursor-pointer"
                style="text-decoration-line: underline;"
                @click="selectUser(u)">
                {{u.pseudo}}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Authentification FORTE -->
      <bar-open :bubble="$t('HPauthstrong_2')" size="sm"
        :title="$t('HPauthstrong_1')" :fnopen="openStrongAuth"/>
    </div>

    <!-- Creation d'un Safe (enregistrement)-->
    <div class="full-width row q-mt-md items-center">
      <btn-bubble :text="$t('HPregist_0')"/>
      <div :class="'q-ml-sm titre-lg text-italic' + (session.noNet ? ' disabled' :'')">
        {{$t('HPregist_0')}}</div>
    </div>

    <div class="full-width row q-pl-xl items-center">
      <bar-open size="sm"
        :bubble="$t('HPregist_' + (session.noNet || session.incognito ? '5' : '2'))" 
        :disable="session.noNet"
        :title="$t('HPregist_3')" :fnopen="createSafe"/>
    </div>

    <q-separator class="q-my-sm"/>
      
    <!-- Utilisateur connu localement -->
    <div>
      <div class="full-width row q-mt-md items-center">
        <btn-bubble class="self-start" size="md" :text="$t('HPlocal_2')"/>
        <div :class="'q-ml-sm titre-lg text-italic' + (session.incognito ? '  disabled' : '')">
          {{$t('HPlocal_1')}}</div>
      </div>

      <div v-if="!session.incognito" class="q-ml-xl">
        <div class="titre-md text-italic">{{$t('HP3ps')}}</div>
        <input-ps v-model="locPS" iconcheck
          :validate="validateLocPS"
          :sz="cfg.K.sizeP1" :label="$t('PSphrase')" :ph="$t('PSphraseh')"/>
      </div>
    </div>

    <q-separator class="q-my-sm"/>

    <!-- Utilisateur ni enregistré ni connu localement -->
    <div class="full-width row q-mt-md items-center">
      <btn-bubble class="self-start" size="md" :text="$t('HPnini_2')"/>
      <div class="q-ml-sm titre-lg text-italic">{{$t('HPnini_1')}}</div>
    </div>
    <bar-open v-if="session.hasNet" :bubble="$t('HPnini_2v')" :title="$t('HPnini_1v')" 
      :fnopen="validateSessionV" size="sm"/>
    <bar-open v-else :bubble="$t('HPnini_2c')" :title="$t('HPnini_1c')" 
      :fnopen="validateSessionV" size="sm"/>
  </div>

  <div v-if="sf.step === 2" class="q-pa-sm">
    <div v-if="!sf.isRegistered()">
      <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
      <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="(nvClicked ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
          @click="nvSession()">
          <div class="col-11 q-pr-xs">{{$t('HPnvs')}}</div>
          <div class="col-1"/>
        </div>
        <div :class="dkli(idx + 1)" v-for="(s, idx) of mySessions" :key="s.profId">
          <div :class="(selectedSession === s ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selSession(s)">
            <div class="col-7 q-pr-xs">{{s.about}}</div>
            <div class="col-4 ">{{dhcool(s.time)}}</div>
            <div v-if="s.hasCache" class="col-1 row justify-end">
              <q-img :src="database" style="height: 24px; max-width: 24px"/>
            </div>
            <div v-else class="col-1"/>
          </div>
        </div>
      </q-scroll-area>
      <div v-if="nvSP" class="q-mt-md">
        <div v-if="nvClicked">
          <q-checkbox v-model="wantdb" :label="$t('HPwantdb')" 
            style="margin-left: -12px"/>
        </div>
        <div v-else> <!-- selectedSession -->
          <div v-if="selHasCache">
            <q-checkbox v-model="unwantdb" :label="$t('HPunwantdb')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="!unwantdb" v-model="razdb" :label="$t('HPresetdb')" 
              style="margin-left: -12px"/>
          </div>
          <div v-else>
            <q-checkbox v-model="wantdb" :label="$t('HPwantdb')" 
              style="margin-left: -12px"/>
          </div>
        </div>

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

    <div v-if="sf.isRegistered()">
      <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
      <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
        class='bord1 q-pa-xs'>
        <div :class="(nvClicked ? 'bord2 ' : '') + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
          @click="nvSession()">
          <div class="col-11 q-pr-xs">{{$t('HPnvs')}}</div>
          <div class="col-1"></div>
        </div>
        <div :class="dkli(idx + 1)" v-for="(s, idx) of mySessions" :key="s.profId">
          <div :class="clSel(s) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selSession(s)">
            <div class="col-7 q-pr-xs">{{pincode + ' ' + s.about}}</div>
            <div class="col-4 ">{{dhcool(s.time)}}</div>
            <div v-if="s.hasCache" class="col-1 row justify-end">
              <q-img :src="database" style="height: 24px; max-width: 24px"/>
            </div>
            <div v-else class="col-1"/>
          </div>
        </div>
        <div :class="dkli(idx + 1 + mySessions.length)" 
          v-for="([profId, p], idx) of myProfiles2" :key="profId">
          <div :class="clSel(p) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selProfile(profId, p)">
            <div class="col-7 q-pr-xs q-pl-xs">{{p.about}}</div>
            <div class="col-4">{{$t('HPnotpinned')}}</div>
            <div class="col-1"/>
          </div>
        </div>
      </q-scroll-area>

      <div v-if="nvSP" class="q-mt-md">
        <div v-if="nvClicked">
          <q-checkbox v-model="pinned" :label="$t('HPsetpinned')" 
            style="margin-left: -12px"/>
          <q-checkbox v-model="wantdb" :label="$t('HPwantdb')" 
            style="margin-left: -12px"/>
        </div>
        <div v-else>
          <div v-if="selectedSession">
            <q-checkbox v-model="unpinme" :label="$t('HPunpinme')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="selHasCache && !unpinme" 
              v-model="unwantdb" :label="$t('HPunwantdb')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="selHasCache && !unpinme && !unwantdb" 
              v-model="razdb" :label="$t('HPresetdb')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="!selHasCache && !unpinme"
              v-model="wantdb" :label="$t('HPwantdb')" 
              style="margin-left: -12px"/>
          </div>
          <div v-else>
            <q-checkbox v-model="pinned" :label="$t('HPsetpinned')" 
              style="margin-left: -12px"/>
            <q-checkbox v-if="pinned" v-model="wantdb" :label="$t('HPwantdb')" 
              style="margin-left: -12px"/>
          </div>
        </diV>

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

      <q-separator class="q-my-md" color="orange"/>

      <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')" 
        :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
        :fnopen="openChgCodes" size="sm"/>

      <bar-open v-if="myTrusting === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')" 
        :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
        :fnopen="openTrust" size="sm"/>

      <bar-open v-if="myTrusting !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')" 
        :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
        :fnopen="openUntrust" size="sm"/>
      
      <bar-open v-if="myTrusting !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')" 
        :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
        :fnopen="openTrust" size="sm"/>

    </div>
  </div>

  <q-separator class="q-mt-sm q-mb-md" color="orange"/>

  <bar-open class="q-pa-sm q-mb-md":bubble="$t('HPmanuinfo')"
    :disable="session.incognito"
    :title="$t('HPmanusers')" :fnopen="manUsers"/>
</div>

  <!-- Dialogue de saisie d'un code PIN-->
  <q-dialog v-model="ui.dModels[idc].pindial" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-right q-mx-xs">{{$t('HPsaisirpin')}}</q-toolbar-title>
        <btn-bubble :text="$t('HPauthbypin_2')"/>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <input-ps v-model="pin"
          :validate="authPIN" iconcheck
          :sz="cfg.K.sizePin" :label="$t('PSpin')" :ph="$t('PSpinh')"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Dialogue d'authentification forte-->
  <q-dialog v-model="ui.dModels[idc].strongauthdial" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-right q-mx-sm">{{$t('HPauthstrong_1')}}</q-toolbar-title>
        <btn-bubble :text="$t('HPauthstrong_2')"/>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <p0-p1 @ok="authPS"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Dialogue de validation d'un utilisateur local -->
  <q-dialog v-model="ui.dModels[idc].authlocaldial" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-right q-mx-sm">
          {{$t(newLocUt ? 'HPauthlocal_0' : 'HPauthlocal_1')}}
        </q-toolbar-title>
      </q-toolbar>
      <q-toolbar inset class="row justify-between">
        <btn-cond flat :label="$t('HPcorrectps')" @ok="ui.fD()"/>
        <btn-cond flat :label="$t(newLocUt ? 'validate' : 'HPitsme')"
          :disable="locTr.err !== ''" @ok="validateLocTr"/>
      </q-toolbar>
      <div class="q-pa-sm">
        <div class="titre-md q-my-lg">
          <div v-if="newLocUt">{{$t('HP3v1')}}</div>
          <div v-else>
            <div class="titre-md">{{$t('HP3v2_0')}}</div>
            <div class="titre-md q-ml-md">{{$t('HP3v2_1')}}</div>
            <div class="titre-md q-ml-md">{{$t('HP3v2_2')}}</div>
          </div>
        </div>
        <input-ps class="q-mb-lg" v-model="locTr"
          :sz="cfg.K.sizeTr" :label="$t('PStrig')" :ph="$t('PStrigh')"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Gestion des users / sessions --> 
  <manage-users v-if="mu" :idc="idc" @close="closeManusers"/>

  <!-- Enregistrement / Changement des codes -->
  <safe-cr v-if="sc" :idc="idc" :onValidate="openSession" :createMode="createMode"/>

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
import ManageUsers from '../components-fw/ManageUsers.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'

import stores from '../stores/all'
import type { TSession } from '../stores/safe-store'
import { $t, $q, sty, dkli, equ8, edvol, dhcool, coolBye } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import anonymousW from '../assets/anonymous_white.png'
import anonymousB from '../assets/anonymous_black.png'
import databaseW from '../assets/database_white.png'
import databaseB from '../assets/database_black.png'

const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin
const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const mu = computed(() => ui.dModels[idc].manusers)
const sc = computed(() => ui.dModels[idc].createsafe)

const database = computed(() => ui.isDark ? databaseW : databaseB)

onMounted(async () => { 
  await sf.init0()
})

const p0p1 = ref(null)
const pin = reactive({ inp: '', err: '' })
const selectedUser = ref(null)

watch(() => ui.reopenSession, async (v) => {
  if (v) {
    await sf.init0()
    if (session.hasNet && sf.isRegistered()) 
      await sf.reloadSafe()
    if (!session.incognito) await openSession()
  }
})

watch(() => sf.step, (s) =>{
  if (s === 1) {
    pin.inp = ''
    locPS.inp = ''
  }
})

const users = computed(() => {
  const l = []
  if (sf.trustings) sf.trustings.forEach(e => { 
    if (!e.isLocal) l.push(e) })
  return l
})

const selectUser = (u) => {
  selectedUser.value = u
  pin.value = { inp: '', err: '' }
  ui.oD(idc, 'pindial')
}

const openStrongAuth = () => {
  ui.oD(idc, 'strongauthdial')
}

const authPS = async (args) => {
  ui.fD()
  const status = await sf.openSafeByPR(args.sh0, args.sh1, args.sh)
  if (status !== 0) await ui.diagDisplay($t('HPopsret_' + status))
  else await openSession()
}

const authPIN = async () => {
  ui.fD()
  const status = await sf.openSafeByPin(pin.inp, selectedUser.value.userId)
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
  if (!session.incognito.value && !sf.hasIDBS) await sf.init1()

  mySessions.value = await sf.getMySessions()
  myTrusting.value = sf.getMyTrusting()
  
  if (!session.incognito) {
    await sf.loadMyLocalPrefs()
    await sf.loadMyLocalCreds()
  }

  if (sf.isRegistered()) {
    const profIds = new Set<string>()
    for (const s of mySessions.value) 
      if (s.profId) profIds.add(s.profId)
    myProfiles.value = sf.getMySafeProfiles()
    myProfiles2.value = new Map<string, Profile>()
    for (const [profId, p] of myProfiles.value) {
      if (!profIds.has(profId)) myProfiles2.value.set(profId, p)
    }
    myPrefs.value = sf.getMySafePrefs()
    if (!session.incognito.value) {
      await sf.refreshLocalPrefs()
      await sf.refreshLocalCreds()
    }
  } else {
    myPrefs.value = sf.tprefs
  }

  selectedSession.value = null
  selectedProfile.value = null
  sf.step = 2
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
  newPseudo.inp = myTrusting.value ? myTrusting.value.pseudo : sf.auth.pseudo
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

const manUsers = () => {
  ui.oD(idc, 'manusers')
}

const createMode = ref()

const createSafe = () => {
  createMode.value = true
  ui.oD(idc, 'createsafe')
}

const openChgCodes = () => {
  createMode.value = false
  ui.oD(idc, 'createsafe')
}

const closeManusers = () => {
  ui.fD()
  setTimeout(async () => {
    await sf.init0()
    if (sf.step === 2)
      await openSession()
  }, 100)
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
  ui.oD(idc, 'authlocaldial')
}

const validateLocTr = async () => {
  if (locTr.err !== '') return
  ui.fD()
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
const wantdb = ref(false)
const unwantdb = ref(false)
const unpinme = ref(false)
const pinned = ref(false)
const newSessionName = reactive({ inp: '', err: '' })

watch(unwantdb, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPrazbl'))
})

const nvSP = computed(() => nvClicked.value || selectedSession.value || selectedProfile.value)
const selHasCache = computed(() => selectedSession.value && selectedSession.value.hasCache)

const reset = () => {
  nvClicked.value = false
  razdb.value = false
  unpinme.value = false
  pinned.value = false
  wantdb.value = false
  unwantdb.value = false
  selectedSession.value = null
  selectedProfile.value = null
  newSessionName.inp = ''
}

const nvSession = () => {
  reset()
  nvClicked.value = true
}

const selSession = (s) => {
  reset()
  selectedSession.value = s
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

const validateSession = async (code, data) => {
  if (newSessionName.err !== '') return

  let sv = selectedSession.value
  const sp = selectedProfile.value
  let credIds: string[]
  let about: string = newSessionName.inp

  if (sv) { 
    // reprise d'une session épinglée
    const profile: Profile = sf.isRegistered() ? myProfiles.value.get(sv.profId) : null

    if (profile) {
      if (profile.about !== about && session.hasNet) 
        // Maj du profile dans Safe
        await sf.setAboutProfile(sv.profId, about)
      // Récupération des credIds du profile Safe
      sv.credIds = profile.creds
    } // Sinon on laisse ses credIds tel quel
    sv.about = about
    sv.prefCode = code
    if (unwantdb.value) sv.hasCache = false
    else if (wantdb.value) sv.hasCache = true

    credIds = sv.credIds
    if (!unpinme.value) {
      // save tsession avec time, raz db si requis
      await sf.setTSession(sv, razdb.value)
      session.setDbName(sv.hasCache ? sv.dbName : '')
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
        hasCache: wantdb.value,
        size: 0,
        time: 0,
        prefCode: code
      } as TSession)
      await sf.setTSession(nvs, true) // true: par superstition ! (db ne devrait pas exister)
      session.setDbName(nvs.hasCache ? nvs.dbName : '')
    }

    credIds = profile.creds

  } else {
    // nouvelle session vierge de droits. Il y a OU NON du réseau
    let profId = ''
    const credIds = []

    // Création du profile dans Safe - S'il y a du réseau
    if (sf.isRegistered() && session.hasNet) {
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
        hasCache: wantdb.value,
        size: 0,
        time: 0,
        prefCode: code
      })
      await sf.setTSession(nvs, true)
      session.setDbName(wantdb.value ? nvs.dbName : '')
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
  sf.userId = null
  sf.keyK = null
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
.bordx1 { border: 2px solid transparent; }
.bordx2 { border: 2px solid $warning; }

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

.exp0 { margin: 0 1px; border: 1px solid $primary; }
.exp1 { margin: 0 1px; border: 1px solid $secondary; }
.exp2 { margin: 0 1px; border: 1px solid $purple; }
.exp3 { margin: 0 1px; border: 1px solid $grey-9; }

.select:hover { background-color: $yellow-2; color: black; }

</style>
