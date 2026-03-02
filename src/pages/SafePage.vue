<template>
<div class="column items-center">
<div :class="sty('md')">

  <div v-if="sf.step === 1" class="q-pa-sm q-mb-md">
    <!-- Entête : accès Internet, incognito, nom du terminal -->
    <div :class="'full-width x-py-xs column bordx' + (session.incognito && session.noNet ? '2' : '1')">
      <div class="row justify-between items-center">
        <q-toggle class="col q-pr-md" v-model="session.noNet" dense color="negative"
          :label="$t('HPnet_' + (session.noNet ? '2' : '1'))" />
        <btn-bubble class="col-auto self-start" size="sm"
          :text="$t('HPmode_' + (session.incognito ? '3' : '1'))"/>
      </div>

      <div class="row justify-between items-center">
        <q-toggle class="col q-pr-md" v-model="session.incognito" dense color="negative"
          :label="$t('HPincognito_' + (session.incognito ? '2' : '1'))"/>
        <btn-bubble class="col-auto self-start" size="sm"
          :text="$t('HPmode_' + (session.noNet ? '3' : '2'))"/>
      </div>
      <input-a prefix="HPstore" class="full-width q-my-sm" v-model="sf.mySafeStore"/>
    </div>

    <div v-if="session.hasNet && sf.devName" class="row items-center q-mt-sm">
      <span class="titre-sm text-italic">{{$t('HPterminal')}}</span>
      <span class="font-mono fs-sm text-italic q-ml-sm">{{sf.devId.substring(0,5) + ' [' + sf.devName + ']'}}</span>
    </div>

    <!-- Je suis enregistré -->
    <div class="full-width row q-mt-md items-center">
      <btn-bubble class="self-start" size="md" :text="$t('HPregist_2')"/>
      <div :class="'q-ml-sm titre-lg text-italic' + (session.noNet && session.incognito ? '  disabled' : '')">
        {{$t('HPregist_1')}}</div>
    </div>

    <div v-if="session.hasNet || !session.incognito" class="q-pl-md">
      <!-- Authentification FORTE -->
      <bar-open :bubble="$t('HPauthstrong_2')"
        :title="$t('HPauthstrong_1')" :fnopen="openStrongAuth"/>

      <!-- Authentification par code PIN -->
      <div v-if="session.hasNet && sf.users.length">
        <div v-if="session.hasNet && sf.users.length === 1">
          <bar-open :bubble="$t('HPauthbypin_2')"
            :title="$t('HPauthbypin_1a', [sf.users[0].pseudo])" :fnopen="selectUser0"/>
        </div>
        <div v-else class="column">
          <bar-open :bubble="$t('HPauthbypin_2')" :title="$t('HPauthbypin_1b', [sf.users.length])"/>
          <div class="row self-center q-mx-xl">
            <div v-for="u in sf.users" :key="u.userId"
              class="q-ml-sm font-mono fs-lg text-bold text-primary cursor-pointer"
              style="text-decoration-line: underline;"
              @click="selectUser(u)">{{u.pseudo}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Creation d'un Safe (enregistrement)-->
    <div class="full-width q-my-md">
      <bar-open1 :bubble="$t('HPregist_' + (session.noNet ? '4' : '2'))"
        :disable="session.noNet" :title="$t('HPregist_3')"
        :fnopen="createSafe"/>
    </div>

    <!-- Mode calculette -->
    <div class="full-width q-my-md">
      <bar-open1 :bubble="$t('HPregist_6')" :title="$t('HPregist_5')"
        :fnopen="validateSessionV"/>
    </div>

    <q-separator class="q-my-sm"/>

    <bar-open class="q-mt-md":bubble="$t('HPmanuinfo')"
      :disable="session.incognito || !session.hasNet" size="sm"
      :title="$t('HPmanusers')" :fnopen="manUsers"/>
  </div>

  <div v-if="sf.step === 2" class="q-pa-sm">
    <btn-cond v-if="session.hasNet" class="q-my-sm" :label="$t('HPcfgPS')" icon="settings"
      @ok="openCM"/>

    <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
    <scroll-area size="lg" class="q-mb-lg"><template #default>
      <div :class="dkli(idx)" v-for="([profId, p], idx) of locSafeProfiles" :key="profId">
        <div v-if="sOfP(profId)">
          <div :class="clSel(sOfP(profId)) + 'row q-my-sm q-py-xs'">
            <btn-cond class="col-auto q-mr-sm" round icon="more_vert"
              @ok="selSession(sOfP(profId), true)"/>
            <div class="col">
              <div class="fs-md text-bold">{{p.about || $t('HPpstar')}}</div>
              <div>
                <q-img :src="database" style="height: 18px; max-width: 18px"/>
                <span class="font-mono text-italic q-ml-md">{{dhcool(sOfP(profId).time)}}</span>
              </div>
              <div class="row q-gutter-sm">
                <div class="text-italic">{{$t('HPstartpref')}}</div>
                <btn-cond no-caps :label="$t('HPpref_1')" @ok="validateSessionS(sOfP(profId), '', 0, null)"/>
                <btn-cond no-caps v-for="[code, [time, obj]] in sf.mySafePrefs" :key="code"
                  :label="code" padding="none xs"
                  @ok="validateSessionS(sOfP(profId), code, time, obj)"/>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div :class="clSel(p) + 'row q-my-sm'">
            <btn-cond class="col-auto q-mr-sm" round icon="more_vert"
              @ok="selProfile(p, true)"/>
            <div class="col">
              <div class="fs-md text-bold">{{p.about || $t('HPpstar')}}</div>
              <div class="fs-md text-italic">{{$t('HPnotpinned')}}</div>
              <div class="row q-gutter-sm">
                <div class="text-italic">{{$t('HPstartpref')}}</div>
                <btn-cond no-caps :label="$t('HPpref_1')" @ok="validateSessionP(p, '', 0, null)"/>
                <btn-cond no-caps v-for="[code, [time, obj]] in sf.mySafePrefs" :key="code"
                  :label="code" padding="none xs"
                  @ok="validateSessionP(p, code, time, obj)"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template></scroll-area>

    <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')"
      :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
      :fnopen="openChgCodes" size="sm"/>

    <bar-open v-if="trustingMe === null" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')"
      :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
      :fnopen="openTrust" size="sm"/>

    <bar-open v-if="trustingMe !== null" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')"
      :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
      :fnopen="openTrust" size="sm"/>

    <bar-open v-if="trustingMe !== null" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')"
      :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
      :fnopen="openUntrust" size="sm"/>

    <bar-open :bubble="$t('HPtrustings_2')" :disbubble="$t('HPtrustings_2')"
      :title="$t('HPtrustings_1')"
      :disable="!session.hasNet || session.incognito || sf.openMode > 2"
      :fnopen="openTrustings" size="sm"/>

    <bar-open :bubble="$t('HPadmin_bub')" :disbubble="$t('HPadmin_bub')"
      :title="$t('HPadmin_label')"
      :disable="!session.hasNet"
      :fnopen="openAdminMgr" size="sm"/>

    <bar-open :bubble="$t('HPprefs_2')" :disbubble="$t('HPprefs_2')"
      :title="$t('HPprefs_1')"
      :disable="!session.hasNet || session.incognito"
      :fnopen="openPrefsMgr" size="sm"/>

    <bar-open :bubble="$t('HPmanuinfo')"
      :disable="session.incognito || !session.hasNet" size="sm"
      :title="$t('HPmanusers')" :fnopen="manUsers"/>

    <bar-open :bubble="$t('HPexpsafe_2')"
      :disable="session.incognito || !session.hasNet" size="sm"
      :title="$t('HPexpsafe_1')" :fnopen="exportSafe"/>

    <bar-open :bubble="$t('HPdelsafe_2')" :disbubble="$t('HPdelsafe_3')"
      :disable="session.incognito || !session.hasNet" size="sm"
      :title="$t('HPdelsafe_1')" :fnopen="opDelSafe"/>
  </div>
</div>

  <!-- Dialogue d'options de lancement -->
  <q-dialog v-model="ui.dModels[idc].optstart" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-right q-mx-xs">{{$t('HPoptstart')}}</q-toolbar-title>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <input-a v-if="session.hasNet && !selStar" class="q-my-sm"
          size="about" prefix="HPpsab" :initval="selSessionAbBefore"
          v-model="selSessionAb" :validatefn="valAbPs"/>
        <div v-else class="q-my-sm font-mono text-bold">{{selSessionAb}}</div>

        <div v-if="sf.selectedSession">
          <div v-if="session.hasNet" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="unpinme" dense :label="$t('HPunpin_0')"/>
            <btn-bubble class="col-auto self-start" size="sm"
              :text="$t('HPunpin_1')"/>
          </div>
          <div v-if="!unpinme" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="resetdb" dense :label="$t('HPresetdb_0')"/>
            <btn-bubble class="col-auto self-start" size="sm"
              :text="$t('HPresetdb_1')"/>
          </div>
        </div>
        <div v-else>
          <div v-if="session.hasNet" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="pinme" dense :label="$t('HPpin_0')"/>
            <btn-bubble class="col-auto self-start" size="sm"
              :text="$t('HPpin_1')"/>
          </div>
        </div>

        <div class="row q-my-md q-gutter-sm">
          <div class="text-italic text-bold">{{$t('HPstartpref')}}</div>
          <btn-cond no-caps :label="$t('HPpref_1')" @ok="validateSessionD('', 0, null)"/>
          <btn-cond no-caps v-for="[code, [time, obj]] in sf.mySafePrefs" :key="code"
            :label="code" padding="none xs"
            @ok="validateSessionD(code, time, obj)"/>
        </div>

      </div>
    </q-card>
  </q-dialog>

  <!-- Dialogue de saisie d'un code PIN-->
  <q-dialog v-model="ui.dModels[idc].pindial" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-right q-mx-xs">{{$t('HPsaisirpin')}}</q-toolbar-title>
        <btn-bubble :text="$t('HPauthbypin_2')"/>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <input-ps v-model="pin" prefix="PSpin" size="pin" :validatefn="authPIN"/>
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

  <!-- Dialogue d'export du safe-->
  <dialog-std1 v-model="ui.dModels[idc].exportsafe" :title="$t('HPexpsafe_1')" hdrclass='wmd'>
    <template #hdr>
      <div class="row items-center">
        <q-tabs dense v-model="exptab" class="col bg-primary text-white shadow-2">
          <q-tab name="info" :label="$t('HPexpinfo')"/>
          <q-tab name="export" :label="$t('HPexpexport')" />
        </q-tabs>
        <btn-cond class="col-auto q-ma-xs" flat icon="check"
          :disable="exptab === 'info' || cryptK.key === null || !expName"
          :label="$t('HPbackup_0')"
          @ok="doExportSafe"/>
      </div>
    </template>
    <template #default>
      <div v-if="exptab === 'info'" class="column q-mx-lg items-center">
        <div class='font-mono fs-lg text-center text-bold full-width q-my-md'>
          {{sf.userId}}</div>
        <div class="titre-md text-italic q-my-sm">{{$t('HPexppub')}}</div>
        <q-input class="q-pa-xs bord1 full-width" v-model="infopub" type="textarea" readonly
          :rows="10"/>
      </div>
      <div v-if="exptab === 'export'" class="column q-mx-lg items-center">
        <div class="q-my-sm full-width">
          <div class="titre-md text-italic">{{$t('HPimport_label')}}</div>
          <input-ps v-model="cryptK" :validatefn="valK" size="ps" prefix="HPimport"/>
        </div>
        <div v-if="cryptK.key === null" class="q-my-xs msg2">{{$t('HPimport_bf0')}}</div>
        <input-a v-if="session.hasNet && !selStar" class="q-my-sm full-width"
          size="file" prefix="HPexpname" v-model="expName"
          :disable="cryptK.key === null"
          :validatefn="doExportSafe"/>
      </div>
    </template>
  </dialog-std1>

  <!-- Gestion des users / sessions -->
  <manage-users v-if="mu" :idc="idc" @close="closeManusers"/>

  <!-- Gestion des credentials -->
  <creds-mgr v-if="cm" :idc="idc" @updated="credsUpdated"/>

  <!-- Gestion des préférences -->
  <prefs-mgr v-if="pm" :idc="idc"/>

  <!-- Gestion des rôles "admin" -->
  <admin-mgr v-if="adm" :idc="idc"/>

  <!-- Enregistrement / Changement des codes -->
  <safe-cr v-if="sc" :idc="idc" :onValidate="openSession" :mode="createMode ? 0 : 1"/>

  <!-- Gérer les terminaux de confiance -->
  <q-dialog v-model="ui.dModels[idc].trustings" persistent>
    <q-card :class="sty('md')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat
          @ok="delTrustSet = null; ui.fD()"/>
        <q-toolbar-title class="titre-lg text-right q-mx-sm">{{$t('HPtrustings_1')}}</q-toolbar-title>
        <btn-bubble :text="$t('HPtrustings_2')"/>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <div v-if="sf.devName" class="row items-center q-my-sm">
          <span class="titre-sm text-italic">{{$t('HPterminal')}}</span>
          <span class="font-mono fs-sm text-italic q-ml-sm">{{sf.devId.substring(0, 5) + ' [' + sf.devName + ']'}}</span>
        </div>
        <div class="titre-md q-my-sm">{{ $t('HPtrustings_l', sf.devices.size) }}</div>
        <scroll-area><template #default>
          <div v-for="[id, dev] in sf.devices" :key="id" class="row">
            <btn-cond class="col-1" :icon="delTrustSet.has(id) ? 'undo' : 'delete'"
              :color="delTrustSet.has(id) ? 'primary' : 'warning'"
              @ok="delTrustIt(id)"/>
            <div :class="'col-2 font-mono ellipsis' + (delTrustSet.has(id) ? ' text-strike' : '') + (id === sf.devId ? ' text-bold' : '')">
              {{ id.substring(0, 5) }}</div>
            <div :class="'col-9 font-mono' + (delTrustSet.has(id) ? ' text-strike' : '') + (id === sf.devId ? ' text-bold' : '')">
              {{ dev.devName }}</div>
          </div>
        </template></scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPtrustings_del', [delTrustSet.size])" color="warning"
          :disable="delTrustSet.size === 0" @ok="delTrustings"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Accorder ma confiance à ce terminal -->
  <q-dialog v-model="ui.dModels[idc].trustit" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-lg row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">
          {{$t(newDev ? 'HPsetdev' : 'HPchgdev')}}
        </div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="devName" prefix="PSdevname" size="dev"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPIN')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPIN" size="pin" prefix="PSpin"/>
      </div>

      <div class="q-mb-lg q-mt-md row items-start">
        <div class="col-6 q-mt-xs q-pr-sm text-right text-italic">{{$t('HPsetPseudo')}}</div>
        <input-ps class="col-6 q-pl-sm" style="max-width:16rem"
          v-model="newPseudo" size="tr" prefix="PStrig"/>
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
        {{$t('HPutnbs', sf.mySessions.size, {count: sf.mySessions.size})}}
      </div>
      <div class="column q-mb-md">
        <div class="titre-md">{{$t('HPutd_1')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_2')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_3')}}</div>
      </div>

      <div v-if="sf.mySessions.size" class="q-mb-sm q-pa-xs row">
        <div class="col-3 q-pr-md text-right titre-md text-italic">{{$t('HPutc1')}}</div>
        <div class="col-9 titre-md text-italic">{{$t('HPutc2')}}</div>
      </div>
      <div v-if="sf.mySessions.size" class="q-my-sm q-mx-md slist q-pa-xs">
        <scroll-area><template #default>
          <div v-for="[id,s] in sf.mySessions" :key="id" class="q-my-xs row">
            <div class="col-3 q-pr-md text-right font-mono">{{s.app}}</div>
            <div class="col-9 fs-md">{{s.about}}</div>
          </div>
        </template></scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('HPuntrust_1')" color="warning" @ok="setUntrust"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Confirmation de destruction du safe -->
  <q-dialog v-model="ui.dModels[idc].delsafe" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_9')}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_8')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm actif :confirm="delSafe"/>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { saveAs } from 'file-saver'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import InputA from '../components-fw/InputA.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
// import BtnConfirm from '../components-fw/BtnConfirm.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
// import ChooseIt from '../components-fw/ChooseIt.vue'
import SafeCr from '../components-fw/SafeCr.vue'
import ManageUsers from '../components-fw/ManageUsers.vue'
import CredsMgr from '../components-fw/CredsMgr.vue'
import PrefsMgr from '../components-fw/PrefsMgr.vue'
import AdminMgr from '../components-fw/AdminMgr.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'

import stores from '../stores/all'
import { TSession, Profile } from '../stores/safe-store'
import { $t, sty, dkli, dhcool } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
// import anonymousW from '../assets/anonymous_white.png'
// import anonymousB from '../assets/anonymous_black.png'
// @ts-ignore
import databaseW from '../assets/database_white.png'
// @ts-ignore
import databaseB from '../assets/database_black.png'

// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin

const encoder = new TextEncoder()

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const mu = computed(() => ui.dModels[idc].manusers)
const sc = computed(() => ui.dModels[idc].createsafe)
const cm = computed(() => ui.dModels[idc].credsmgr)
const pm = computed(() => ui.dModels[idc].prefsmgr)
const adm = computed(() => ui.dModels[idc].adminmgr)

const database = computed(() => ui.isDark ? databaseW : databaseB)

onMounted(async () => {
  await sf.init0()
})

const p0p1 = ref(null)
const pin = reactive({ inp: '', err: '' })
const selectedUser = ref(null)

watch(() => sf.step, async (s) => {
  if (s === 1) {
    pin.inp = ''
  }
})

const selectUser = (u) => {
  if (u) {
    selectedUser.value = u
    pin.value = { inp: '', err: '' }
    ui.oD(idc, 'pindial')
  }
}
const selectUser0 = (u) => { selectUser(sf.users[0]) }

const openStrongAuth = () => {
  ui.oD(idc, 'strongauthdial')
}

const authPS = async (args) => {
  ui.fD()
  const status = await sf.openSafeByPR(args.sh0, args.sh1, args.sh)
  if (status === 0) await openSession()
  else if (status > 0) await ui.diagDisplay($t('HPopsret_' + status))
}

const authPIN = async () => {
  ui.fD()
  const status = await sf.openSafeByPin(pin.inp, selectedUser.value.userId)
  if (status === 0) await openSession()
  else if (status > 0) await ui.diagDisplay($t('HPbypin_' + status))
}

const opDelSafe = () => {
  ui.oD(idc, 'delsafe')
}

const delSafe = async () => {
  const status = await sf.delSafe()
  if (status === 0) {
    await ui.diagDisplay($t('HPcsret_9'))
    ui.fD()
    sf.backToAuth()
  } else {
    await ui.diagDisplay($t('HPopsret_' + status))
  }
}

const expName = ref('')
const cryptK = reactive( { inp: '', err: '', key: null } )
const bin = ref(null)
const exptab = ref('info')
const infopub = ref('')

const setInfopub = () => {
  infopub.value = JSON.stringify([sf.auth.C, sf.auth.V], null, '\t')
}

watch(exptab, (v) => {
  setInfopub()
})

const exportSafe = async () => {
  setInfopub()
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  bin.value = encode(await sf.getBinSafe())
  if (!bin.value) {
    await ui.diagDisplay($t('HPexportsafe_ko'))
    return
  }
  ui.oD(idc, 'exportsafe')
}

const valK = async () => {
  cryptK.key = await Crypt.strongHash(cryptK.inp, true, true)
}

const doExportSafe = async () => {
  if (!expName.value) return
  const buf: Uint8Array = await Crypt.crypt(cryptK.key, bin.value)
  const nf = expName.value + (!expName.value.endsWith('.bin') ? '.bin' : '')
  // @ts-ignore
  const blob = new Blob([buf], { type: 'application/octet-stream'})
  saveAs(blob, nf)
  await ui.diagDisplay($t('HPexport_ok', [nf]))
  bin.value = null
  ui.fD()
}

const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })
const mySessions: Ref<TSession> = ref(new Map())
const trustingMe = computed(() => sf.myTrusting )

const credsUpdated = async () => {
  ui.fD()
  await openSession()
}

const prefsUpdated = async () => {
  ui.fD()
  await openSession()
}

const sOfP = (profId: string) => sf.sessionOfProfId(profId)

const openSession = async () => {
  sf.setStep(2)
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
  const t = sf.myTrusting
  newDev.value = sf.devId === ''
  newPIN.inp = ''
  devName.inp = newDev.value ? '' : sf.devName
  newPseudo.inp = t ? t.pseudo : sf.auth.pseudo
  ui.oD(idc, 'trustit')
}

const openUntrust = async () => {
  await sf.getMySessions()
  ui.oD(idc, 'untrustit')
}

const delTrustSet = ref()

const openTrustings = () => {
  delTrustSet.value = new Set()
  ui.oD(idc, 'trustings')
}

const openPrefsMgr = () => {
  ui.oD(idc, 'prefsmgr')
}

const openAdminMgr = () => {
  ui.oD(idc, 'adminmgr')
}

const delTrustIt = (id) => {
  if (delTrustSet.value.has(id)) delTrustSet.value.delete(id)
  else delTrustSet.value.add(id)
}

const delTrustings = async () => {
  console.log('delTrust')
  const st = await sf.setUntrustAll(delTrustSet.value)
  if (st === 0) {
    delTrustSet.value = null
    ui.fD()
  } else await ui.diagDisplay($t('HPopnotpin_' + st))
}

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.inp, newPIN.inp, newPseudo.inp)
    if (status < 0) return
    ui.fD()
    await ui.diagDisplay($t('HPsttrust_' + status))
    await openSession()
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const setUntrust = async () => {
  try {
    const status = await sf.setUntrust()
    if (status < 0) return
    ui.fD()
    await ui.diagDisplay($t('HPstuntrust_' + status))
    await openSession()
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const manUsers = () => {
  ui.oD(idc, 'manusers')
}

const openCM = () => {
  ui.oD(idc, 'credsmgr')
}

const openPM = () => {
  ui.oD(idc, 'prefsmgr')
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
}

const resetdb = ref(false)
const unpinme = ref(false)
const pinme= ref(false)

watch(unpinme, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

watch(resetdb, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

const nvSP = computed(() => sf.selectedSession || sf.selectedProfile)
const selSessionAb = ref('')
const selSessionAbBefore = ref('')

const valAbPs = async () => {
  const profId = sf.selectedSession ? sf.selectedSession.profId : sf.selectedProfile.profId
  try {
    const status = await sf.setAboutProfile(profId, selSessionAb.value)
    if (status !== 0)
      await ui.diagDisplay($t('HPsfop_' + status))
    else selSessionAbBefore.value = selSessionAb.value
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

const selSession = (s, dial: boolean) => {
  resetdb.value = false
  unpinme.value = false
  sf.selectedSession = s
  sf.selectedProfile = null
  if (!session.hasNet) {
    selSessionAb.value = s.about
    selSessionAbBefore.value = s.about
  } else {
    const pf = sf.profileOfProfId(s.profId)
    if (pf) {
      selSessionAb.value = pf.about
      selSessionAbBefore.value = pf.about
    } else {
      selSessionAb.value = s.about
      selSessionAbBefore.value = s.about
    }
  }
  if (dial) ui.oD(idc, 'optstart')
}

const selProfile = (profile: Profile, dial: boolean) => {
  pinme.value = false
  sf.selectedSession = null
  sf.selectedProfile = profile
  selSessionAb.value = profile.profId === '*' ? $t('HPpstar') : profile.about
  selSessionAbBefore.value = selSessionAb.value
  if (dial) ui.oD(idc, 'optstart')
}

const selStar = computed(() =>
  (sf.selectedSession && sf.selectedSession.profId === '*') ||
  (sf.selectedProfile && sf.selectedProfile.profId === '*') )

const clSel = (x) => {
  if (sf.selectedSession === x) return 'bord2 '
  if (sf.selectedProfile && sf.selectedProfile.profId === x.profId) return 'bord2 '
  return ''
}

const locSafeProfiles = ref(sf.mySafeProfiles)

watch(() => sf.mySafeProfiles, (v) => {
  locSafeProfiles.value = v
})

const validateSessionS = async (s, prefCode, prefTime, prefObj) => {
  selSession(s)
  await validateSession(prefCode, prefTime, prefObj)
}

const validateSessionP = async (p, prefCode, prefTime, prefObj) => {
  selProfile(p)
  await validateSession(prefCode, prefTime, prefObj)
}

const validateSessionD = async (prefCode, prefTime, prefObj) => {
  ui.fD()
  await validateSession(prefCode, prefTime, prefObj)
}

const validateSession = async (prefCode, prefTime, prefObj) => {
  let sv = sf.selectedSession
  const sp = sf.selectedProfile
  let profile: Profile = null

  if (sv) {
    // reprise d'une session épinglée
    if (!session.hasNet) {
      // mode avion : reprise telle quelle (seul son time est mis à jour)
      await sf.setTSession(sv, false)
    } else {
      if (sv.profId !== '*')
        profile = locSafeProfiles.value.get(sv.profId)
      if (!profile) {
        /* PROBLEME : la session est épinglée mais son profile a été détruit depuis
        on lui redonne le profil universel
        SOIT elle n'avait pas de profile */
        profile = { profId: '*', about: '', crIds: [] }
        sv.profId = '*'
      }
      sv.prefCode = prefCode
      sv.prefObj = prefObj
      if (unpinme.value) {
        /* c'est une exécution SANS base (non épinglée), FUGITIVE
        elle EST effacée en tant que session
        elle peut avoir un profil (ou '*') et une préférence (ou par défaut)
        */
        await sf.delTSession([sv])
        session.setDbName('')
      } else {
        // save tsession avec time, raz db si requis
        await sf.setTSession(sv, resetdb.value)
        session.setDbName(sv.dbName)
      }
    }

  } else {
    /* nouvelle session ouverte depuis un profile
    - soit sélectionné,
    - soit '*'.
    */
    profile = sp

    if (pinme.value) { // épingler la session: il Y A du réseau
      const nvs = sf.newTSession({
        app: cfg.appname,
        userId: sf.userId,
        profId: sp.profId,
        about: sp.about,
        size: TSession.initSize(),
        time: 0,
        prefCode: prefCode,
        prefTime: prefTime,
        prefObj: prefObj
      }) as TSession
      await sf.setTSession(nvs, true) // true: force reset du volume
      session.setDbName(nvs.dbName)
    } else {
      /* il y a OU NON du réseau
        c'est une exécution SANS base (non épinglée), FUGITIVE
        elle N'EST PAS enregistrée en tant que session
        elle peut avoir un profil (ou '*') et une préférence (ou par défaut)
      */
    }
  }

  sf.setStep(0)
  if (prefCode) session.updatePref(prefCode, prefTime, decode(prefObj))
  else session.updatePref('', 0, {})
  session.setStartContext(sf.userId, profile.about, sf.getCreds(profile))
}

const validateSessionV = () => {
  sf.userId = null
  sf.keyK = null
  sf.setStep(0)
  session.updatePref('', 0, {})
  session.setStartContext('', '', new Map())
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
