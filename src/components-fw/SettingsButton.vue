<!-- TODO
Gérer la saisie d'un credential
-->
<template>
<div>
  <q-btn v-if="session.opSignal" flat dense color="purple-7" class="bg-white" icon="wifi"/>
  <q-btn v-else flat dense icon="settings" :class="session.newVersionReady ? 'bg-negative text-white' : ''">
    <q-menu>
      <q-list style="min-width: 350px">

        <q-item v-if="session.newVersionReady" clickable dense v-close-popup
          class="bg-negative text-white"
          @click="session.newVersionDialog = true">
          <q-item-section avatar><q-avatar size="xl" icon="system_update"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('RLtit1')}}</q-item-section>
        </q-item>
        <q-separator v-if="session.newVersionReady"/>

        <q-item clickable dense v-close-popup @click="ui.openHelp('topHelp')">
          <q-item-section avatar><q-avatar size="xl" icon="help"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('genhelp')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item v-for="lg in config.K.localeOptions" :key="lg.value" dense
          :class="cl(lg) + ' text-center'"
          @click="choix(lg)" clickable v-close-popup>
          <q-item-section class="fs-lg">{{lg.label}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="darkClear">
          <q-item-section avatar><q-avatar size="xl" icon="contrast"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('darkclear')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="ui.oD(idc, 'theme')">
          <q-item-section avatar><q-avatar size="xl" icon="palette"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('theme')}}</q-item-section>
        </q-item>

        <q-separator v-if="stores.safe.step === 0"/>

        <q-item  v-if="stores.safe.step === 0" clickable dense v-close-popup @click="openPrefs">
          <q-item-section avatar><q-avatar size="xl" icon="settings"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('settings')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="ui.oD(idc, 'pings')">
          <q-item-section avatar><q-avatar size="xl" icon="network_ping"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('tech')}}</q-item-section>
        </q-item>

        <q-separator v-if="ui.page !== 'home'" />

        <q-item clickable dense v-close-popup @click="cfReloadPage">
          <q-item-section avatar><q-avatar size="xl" icon="restart_alt"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('restartApp')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="cfCoolBye">
          <q-item-section avatar><q-avatar size="xl" icon="close"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('closeApp')}}</q-item-section>
        </q-item>

        <scroll-area size="sm" class="q-mt-sm full-width"><template #default>
          <div class="row">
            <div class="titre-md text-italic q-pr-sm text-primary">{{$t('app')}}</div>
            <div class="font-mono">{{config.K.APPNAME}}</div>
            <div class="font-mono">{{ $t('build') + ': ' + config.K.BUILD }}</div>
          </div>
          <div class="titre-md text-italic q-mt-sm text-primary">{{ $t('services') }}</div>
          <div v-for="[svc, x] in services" :key="svc" class="q-ml-md column">
            <div class="font-mono fs-sm">
              <span :class="svc === defsvc ? 'text-bold' : ''">{{svc}}</span>
              <span class="q-ml-md">{{x.url}}</span>
              <span class="q-ml-sm">[{{x.api}}]</span>
            </div>
          </div>
          <div class="row q-mt-sm">
            <div class="titre-md text-italic q-pr-sm text-primary">
              {{$t('userid')}}</div>
            <div class="font-mono">{{sf.userId ? sf.userId: $t('unknown')}}</div>
          </div>
          <div class="row">
            <div class="titre-md text-italic q-pr-sm text-primary">{{$t('username')}}</div>
            <div class="font-mono">{{sf.userName ? sf.userName: $t('unknown')}}</div>
          </div>
          <div class="row">
            <div class="titre-md text-italic q-pr-sm text-primary">{{$t('authby')}}</div>
            <div class="font-mono">{{$t('authby_' + sf.openMode)}}</div>
          </div>
          <div class="row">
            <div class="titre-md text-italic q-pr-sm text-primary">{{$t('sessionid')}}</div>
            <div class="font-mono">{{session.sessionInfo}}</div>
          </div>
          <div v-if="sf.step !== 0" class="row">
            <div class="titre-md text-italic q-pr-sm text-primary">{{$t('step')}}</div>
            <div class="font-mono">{{$t('step_' + sf.step)}}</div>
          </div>
        </template></scroll-area>
        <!-- Test surcharge traductions
        <q-item>
          <q-item-section class="font-mono text-center text-italic">{{ $t('blabla') + ' - ' + $t('blabla1') }}</q-item-section>
        </q-item>
        -->

      </q-list>
    </q-menu>
  </q-btn>

  <!-- Contrôle de l'autorisation des notifications-->
  <q-dialog v-model="session.permDialog" persistent>
    <permission-dialog/>
  </q-dialog>

  <!-- Information / option d'installation d'une nouvelle version -->
  <q-dialog v-model="session.newVersionDialog" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" :label="$t('later')"
          @ok="session.newVersionDialog = false"/>
        <q-toolbar-title>{{$t('RLtit1')}}</q-toolbar-title>
        <help-button page="reloadApp"/>
      </q-toolbar>

      <div class="q-pa-sm">
        <div class="titre-md q-my-md">{{$t('RLtit2')}}</div>
        <div class="row q-my-sm justify-between items-center">
          <div class="titre-md text-bold">{{$t('RLopt1')}}</div>
          <btn-cond icon="system_update" color="primary"
            :label="$t('clickhere')" @ok="reloadPage"/>
        </div>
        <div class="row q-my-sm justify-between items-center">
          <div class="col titre-md q-my-sm text-italic">{{$t('RLopt2')}}</div>
          <btn-cond class="col-auto q-ml-sm" icon="close"
            color="primary" :label="$t('gotit')" @ok="session.newVersionDialog = false"/>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- Affiche l'opération en cours et propose son interruption -->
  <q-dialog v-model="session.opDialog" maximized persistent>
    <div v-if="session.opSpinner >= 2" class="column items-center q-ma-lg">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div :class="sty() + 'cursor-pointer stop'" @click="ui.oD(idc, 'confirmstopop')">
          <div class="row items-center justify-between q-pa-sm" style="width:20rem">
            <div class="col column items-center">
              <div class="text-bold titre-md">{{$t('MLAopc')}}</div>
              <div class="text-bold text-italic">{{$t('op_' + session.opEncours.opName)}}</div>
              <div class="titre-sm">{{$t('MLAint')}}</div>
            </div>
            <div class="col-auto row items-center justify-center q-pa-sm">
              <q-spinner color="primary" size="40px" :thickness="4"/>
              <div class="font-mono fs-xs text-center text-white text-bold bg-negative tag">
                {{session.opSpinner}}</div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <!-- Confirmation d'interruption de l'opération en cours -->
  <q-dialog v-model="ui.dModels[idc].confirmstopop">
    <q-card>
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [$t('op_' + session.opEncours.opName)])}}</q-card-section>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <btn-cond flat :label="$t('MLAcf3')" @ok="ui.fD"/>
        <btn-cond flat :label="$t('MLAcf4')" @ok="ui.fD(); session.opEncours.abort()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des thèmes clair / foncé -->
  <q-dialog v-model="ui.dModels[idc].theme" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title>{{$t('theme')}}</q-toolbar-title>
        <help-button page="reloadApp"/>
      </q-toolbar>
      <div class="q-pa-sm">
        <div class="font-def fs-sm">Normal sm</div>
        <div class="font-def fs-md">Normal md</div>
        <div class="font-def text-italic fs-md">Normal italic md</div>
        <div class="font-def text-bold fs-md">Normal bold md</div>
        <div class="font-def text-bold text-italic fs-md">Normal italic bold md</div>
        <div class="font-def fs-xl">Normal xl</div>
        <div class="fs-xl">Normal Def xl</div>
        <div class="fs-sm font-mono q-mt-md">Mono 1 l 0 O wiw sm</div>
        <div class="fs-md font-mono">Mono 1 l 0 O wiw md</div>
        <div class="text-italic fs-md font-mono">Mono 1 l 0 O wiw italic md</div>
        <div class="text-bold fs-md font-mono">Mono 1 l 0 O wiw italic md</div>
        <div class="text-italic text-bold fs-md font-mono">Mono 1 l 0 O wiw italic bold md</div>
        <div class="fs-xl font-mono">Mono 1 l 0 O iii xl</div>
        <div class="fs-xl font-mono">Mono 1 l 0 O www xl</div>
        <div class="titre-sm q-mt-md">Titre sm</div>
        <div class="titre-md">Titre md</div>
        <div class="text-italic titre-md">Titre italic md</div>
        <div class="text-bold titre-md">Titre italic md</div>
        <div class="text-italic text-bold titre-md">Titre italic bold md</div>
        <div class="titre-xl">Titre xl</div>

        <q-separator color="orange" class="q-my-md"/>
        <div class="spsm">
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THprimary')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('primary')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('primary')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THsecondary')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('secondary')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('secondary')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THinfo')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('info')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('info')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THaccent')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('accent')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('accent')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THpositive')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('positive')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('positive')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THnegative')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('negative')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('negative')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THwarning')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('warning')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('warning')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THmsgbg')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('msgbg')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('msgbg')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THmsgtc')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('msgtc')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('msgtc')"/></div>
        </div>

        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THtbptc')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('tbptc')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('tbptc')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THtbstc')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('tbstc')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('tbstc')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THbtnbg')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('btnbg')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('btnbg')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THbtntc')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('btntc')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('btntc')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THbtwbg')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('btwbg')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('btwbg')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THbtwtc')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('btwtc')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('btwtc')"/></div>
        </div>
        <div class="q-my-sm row reverse q-gutter-sm items-center">
          <div class="col titre-md w10 ">{{$t('THmdtitre')}}</div>
          <div class="dk col-auto"><div class="pal" :style="styd('mdtitre')"/></div>
          <div class="li col-auto"><div class="pal" :style="styd('mdtitre')"/></div>
        </div>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- Outils techniques -->
  <dialog-std1 v-if="ui.dModels[idc].pings" v-model="ui.dModels[idc].pings" vh="80"
    :title="$t('tech')" hdrclass='wmd' help="pings">
    <template #hdr>
      <div class="row items-center wmd full-width">
        <btn-cond v-if="sf.step === 0"
          class="col-auto q-mr-xs" icon="check" :disable="org === ''" @ok="opSetSrvStatus(1)"/>
        <btn-cond v-if="sf.step === 0"
          class="col-auto q-mr-lg" icon="check" :disable="org === ''" color="warning" @ok="opSetSrvStatus(2)"/>
        <q-tabs dense v-model="tab" class="col bg-primary text-white shadow-2">
          <q-tab name="pings" :label="$t('pings')"/>
          <q-tab name="crypto" :label="$t('crypto')" />
          <q-tab name="cred" :label="$t('cred')" />
        </q-tabs>
      </div>
    </template>
    <template #default>
      <div v-if="tab === 'pings'" class="q-pa-xs">
        <q-separator color="orange" class="q-my-md"/>

        <input-a size="org" prefix="orgcode" v-model="org"/>

        <q-separator color="orange" class="q-my-md"/>

        <div class="column q-px-sm">
          <btn-cond icon-right="send" :label="$t('ping')" :disable="org === ''"
            @click="opGetSrvStatus"/>
          <div class="q-mt-sm q-mx-sm font-mono height-4">{{resping}}</div>
        </div>

        <q-separator color="orange" class="q-my-md"/>

        <div class="column q-px-sm q-gutter-md q-mb-md">
          <input-a size="org" prefix="toecho" v-model="toecho" :validatefn="opEcho"/>
          <div class="font-mono">{{$t('echo', [echo])}}</div>
        </div>
      </div>
      <div v-if="tab === 'crypto'" class="q-pa-xs">
        <input-ps class="q-mt-md q-mb-sm" v-model="ps" size="p1"
          prefix="SBphrase" :validatefn="validPs"/>
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_sh')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.b64" />
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_sha')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.shaps" />
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_shaS')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.shaSps" />

        <q-separator class="q-my-md" color="orange" />

        <btn-cond class="q-mb-md" :label="$t('SBgensv')" @ok="genSV"/>
        <div class="q-mt-md titre-md text-italic">{{$t('SBgensv2')}}</div>
        <q-input class="q-pa-xs bord1" v-model="cr.pems" type="textarea"
         :rows="15"/>
      </div>
      <div v-if="tab === 'cred'" class="q-pa-xs">
        <div class="row q-my-sm q-gutter-sm">
          <btn-cond class="warning" :label="$t('reset')" icon="undo"
            @ok="resetCred"/>
          <btn-cond :label="$t('SBgencred')" icon="check"
            @ok="genCred"/>
        </div>
        <input-a class="q-my-xs" prefix="aboutcred"
          v-model="cred.about"/>
        <q-select dense class="q-my-xs q-ml-lg" filled v-model="cred.svc" 
          :options="Array.from(config.services.keys())" :label="$t('service')"/>
        <input-a class="q-my-xs" size="org" prefix="orgcode"
          v-model="cred.org"/>
        <q-select dense class="q-my-xs q-ml-lg" filled v-model="cred.role" 
          :options="optsRoles" emit-value :label="$t('ROLE')"/>
        <input-a class="q-my-xs" size="entid" prefix="SBentid"
          v-model="cred.entid"/>
        <input-a class="q-my-xs" size="entkey" prefix="SBentkey"
          v-model="cred.entkey"/>
        <div class="q-my-xs titre-md text-italic">{{$t('SBprivpem')}}</div>
        <q-input dense class="q-pa-xs bord1" v-model="cred.pems" type="textarea"
         :rows="7"/>
        <div class="q-my-sm titre-md text-italic">{{$t('SBcredres')}}</div>
        <q-input dense class="q-pa-xs bord1" v-model="credRes" type="textarea"
         :rows="10"/>
      </div>

    </template>
  </dialog-std1>
  <!-- Maj préférences -->
  <dialog-std1 v-model="ui.dModels[idc].edprf"
    :title="$t('HPprefs_ed')" hdrclass='wmd'>
    <template #hdr>
      <div class="row q-ma-xs items-center justify-between">
        <div class="row col">
          <div class="titre-md text-bold q-mr-md">{{session.edPref.code}}</div>
          <div class="font-mono fs-sm text-italic">[{{dhcool(session.edPref.time)}}]</div>
        </div>
        <btn-cond class="q-ml-xs" icon="check" :label="$t('validate')" @ok="edValid"
          :color="session.edPref.chg ? 'warning' : 'primary'"
          :disable="edDiag !== ''"/>
      </div>
      <div v-if="edDiag" class="msg">{{edDiag}}</div>
    </template>
    <template #default>
      <q-separator class="q-my-xs"/>
      <pref-editor class="q-pa-xs"/>
    </template>
  </dialog-std1>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onUnmounted, computed, reactive, watch } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { LocPref } from '../stores/safe-store'
import HelpButton from './HelpButton.vue'
import BtnCond from './BtnCond.vue'
import PermissionDialog from './PermissionDialog.vue'
import DialogStd1 from './DialogStd1.vue'
import DialogStd0 from './DialogStd0.vue'
import PrefEditor from '../components/PrefEditor.vue'
import InputA from '../components-fw/InputA.vue'
import InputPs from '../components-fw/InputPs.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import { $t, sty, reloadPage, sleep, coolBye, dhcool, u8ToB64 } from '../src-fw/util'
import { EchoText, GetSrvStatus, SetSrvStatus } from '../src-fw/operations'
import { localeOption } from '../stores/config-store'
import { Crypt, toPem } from '../src-fw/crypt'
import { Credential, CredObj } from '../src-fw/credential'

const i18n = useI18n()
const config = stores.config
const session = stores.session
const sf = stores.safe
const ui = stores.ui
const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const services = ref()
{
  const m = new Map<string, Object>()
  for (const svc in config.K.SERVICES) m.set(svc, config.K.SERVICES[svc])
  services.value = m
}
const defsvc = ref(config.K.DEFAULT_SERVICE)

const tab = ref('cred')
watch(tab, (t) => {
  if (t === 'cred') resetCred()
})

const cl = (lg: localeOption) => config.optionLocale.value === lg.value ? 'disabled' : ''

const choix = (lg: localeOption) : void => {
  i18n.locale.value = lg.value
  config.setLocale(lg.value)
}

const org = ref('')
const toecho = ref('')
const echo = ref('')

function darkClear () {
  ui.setDark(!ui.isDark)
}

ui.setDark(true)

const styd = (c: string) => 'background:' + config.K.theme[c][0]

async function opEcho () : Promise<void>  {
  try {
    echo.value = ''
    echo.value = await new EchoText().run('ADMIN_A', toecho.value)
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

const resping = ref('')
async function opGetSrvStatus () : Promise<void> {
  try {
    resping.value = ''
    const { now, st, at, txt } = await new GetSrvStatus().run(org.value)
    const nowS = new Date(now).toISOString()
    const atS = at ? new Date(at).toISOString() : '?'
    const stS = $t('srvStatus_'+ st, [atS])
    resping.value = $t('srvStatus', [nowS, stS, txt || ''])
  } catch (e) {
    resping.value = 'err:' + (e.code || '???')
  }
}

async function opSetSrvStatus (stx) : Promise<void> {
  try {
    resping.value = ''
    const { now, st, at, txt } = await new SetSrvStatus().run(org.value, stx)
    const nowS = new Date(now).toISOString()
    const atS = at ? new Date(at).toISOString() : '?'
    const stS = $t('srvStatus_' + st, [atS])
    resping.value = $t('srvStatus', [nowS, stS, txt || ''])
  } catch (e) {
    resping.value = 'err:' + (e.code || '???')
  }
}

const cfReloadPage = () => { ui.oD('0', 'confirmQuit') }
const cfCoolBye = () => { ui.oD('0', 'confirmQuit') }

const edDiag = computed(() => session.edPref.diag )

const openPrefs = () => {
  const ep = session.pref
  session.setEdPref(ep.code, ep.time, decode(encode(ep.obj)))
  ui.oD(idc, 'edprf')
}

const edValid = async () => {
  ui.fD()
  const edP = session.edPref
  if (!edP.chg) return
  const p: LocPref  = {
    code: edP.code,
    time: Date.now(),
    obj: encode(edP.obj)
  }
  session.updatePref(p.code, p.time, edP.obj)
  if (edP.code) {
    const m = new Map()
    m.set(p.code, p)
    await stores.safe.updatePrefs(m, [])
  }
}

const cr = reactive({ b64: '', shaps: '', shaSps: '', pems: '' })
const ps = reactive({ inp: '', err: ''})

const validPs = async () => {
  const sh = await Crypt.strongHash(ps.inp, false, true) as Uint8Array
  cr.b64 = u8ToB64(sh, true)
  cr.shaps = Crypt.sha(sh, false)
  cr.shaSps = Crypt.shaS(sh)
}

const genSV = async () => {
  const { pub, priv } = await Crypt.getSVKeyPair()
  cr.pems = toPem(pub, true) + '\n\n' + toPem(priv)
}

const optsRoles = ref([])
for (const r of config.K.roles) optsRoles.value.push({ value: r, label : $t('ROLE' + r)})

const cred0 = { svc: '', id: '', about:'', role: '', org: '', entid: '', entkey: '', pems: '', hpems: '' }
const cred : Ref<CredObj> = ref({ ...cred0})
const credRes = ref('')
const resetCred = () => {
  credRes.value = ''
  cred.value = { ...cred0 }
}

const genCred = () => {
  try {
    const c = new Credential(cred.value)
    credRes.value = c.toJson
  } catch (e) {
    credRes.value = e.toString()
  }
}
resetCred()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.tag { border-radius:10px; height: 20px; width: 20px; padding-top: 2px; overflow:hidden; }
.stop { border-radius : 8px; border: 2px solid $grey-5}
.stop:hover { border-color: $negative }
.pal { width: 40px; height: 24px; margin: 8px }
.dk { background: var(--q-dark); border: 1px solid white; border-radius: 8px }
.li { background: white; border: 1px solid black; border-radius: 8px }
</style>
