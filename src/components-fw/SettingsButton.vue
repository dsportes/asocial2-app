<!-- Bouton d'ouverture du menu droit "settings"
-->
<template>
<div>
  <q-btn v-if="session.opSignal" flat dense color="purple-7" class="bg-white" icon="wifi"/>
  <q-btn v-else flat dense icon="settings" :class="session.newVersionReady ? 'bg-negative text-white' : ''">
    <q-menu>
      <q-list style="min-width: 300px;">

        <q-item v-if="session.newVersionReady" @click="session.newVersionDialog = true"
          clickable dense v-close-popup
          class="bg-negative text-white">
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

        <q-item clickable dense v-close-popup @click="ui.setDark(!ui.isDark)">
          <q-item-section avatar><q-avatar size="xl" icon="contrast"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('darkclear')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="dialogs.theme = true">
          <q-item-section avatar><q-avatar size="xl" icon="palette"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('theme')}}</q-item-section>
        </q-item>

        <q-separator v-if="session.step === 3"/>

        <q-item v-if="session.step > 0" @click="dialogs.userProfile = true"
          clickable dense v-close-popup>
          <q-item-section avatar><q-avatar size="xl" icon="person"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('SButtitle')}}</q-item-section>
        </q-item>

        <q-item v-if="session.step > 0" @click="dialogs.edprf = true"
          clickable dense v-close-popup>
          <q-item-section avatar><q-avatar size="xl" icon="settings"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('settings')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="dialogs.ServiceStatus = true">
          <q-item-section avatar><q-avatar size="xl" icon="cloud"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('servicestatus')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="dialogs.crypto = true">
          <q-item-section avatar><q-avatar size="xl" icon="key"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('crypto')}}</q-item-section>
        </q-item>

        <q-separator/>

        <q-item v-if="session.step === 3" clickable dense v-close-popup @click="ui.sessionClose">
          <q-item-section avatar><q-avatar size="xl" icon="exit_to_app"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('endsession')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="ui.confirmQuit">
          <q-item-section avatar><q-avatar size="xl" icon="close"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('closeApp')}}</q-item-section>
        </q-item>

        <q-separator />

        <div class="q-pa-xs column items-center">
          <div class="row">
            <div class="col-6 text-right titre-md text-italic q-pr-sm">{{$t('app')}}</div>
            <div class="font-mono text-bold">{{config.K.APPNAME}}</div>
          </div>
          <div class="row">
            <div class="col-6 text-right titre-md text-italic q-pr-sm">{{$t('build')}}</div>
            <div class="font-mono text-bold">{{config.K.BUILD}}</div>
          </div>
          <btn-cond label="Import Safe" size="sm" flat icon="warning"
            color="warning" @ok="dialogs.SafeExport = true"/>
        </div>
      </q-list>
    </q-menu>
  </q-btn>

  <safe-export v-if="dialogs.SafeExport" v-model="dialogs.SafeExport" tab="restore" @done="coolBye"/>

  <q-dialog v-model="dialogs.ServiceStatus" vue="ServiceStatus"
    full-height persistent>
    <q-card :class="sty('sm') + ' q-pa-sm'">
      <q-toolbar class="tbs">
        <btn-cond flat :label="$t('gotit')" icon="check" color="none"
          @ok="closeSS"/>
        <q-toolbar-title class="titre-md full-width text-center">{{$t('servicestatus')}}</q-toolbar-title>
      </q-toolbar>
    <select-svcorg class="full-width q-mx-xs"
      initorg="?" initsvc="?" @select="setOS"/>

    <status-site v-if="so.site" v-model="so" class="q-mt-md"/>

    <div v-if="so.site" class="q-my-sm titre-md">
      <div v-if="so.admin" class="row q-gutter-sm items-center">
        <img :src="superman" width="24px"/>
        <div class="titre-md text-bold">{{ $t('APsiteadmin') }}</div>
      </div>
      <div class="titre-md">{{ $t('APsinfo', [so.site, surl]) }}</div>
    </div>

    <div v-if="so.site && so.org" class="q-my-md">
      <div class="q-mb-sm titre-md">{{ $t('orgStatus', [so.org, so.svcLabel, so.site]) }}</div>
      <status-org v-model="so"/>
    </div>
    </q-card>
  </q-dialog>

  <!-- Contrôle de l'autorisation des notifications-->
  <q-dialog v-model="session.permDialog" persistent>
    <permission-box/>
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
        <div :class="sty() + 'cursor-pointer stop'" @click="dialogs.confirmStopop = true">
          <div class="row items-center justify-between q-pa-sm" style="width:20rem">
            <div class="col column items-center">
              <div class="text-bold titre-md">{{$t('MLAopc')}}</div>
              <div class="text-bold text-italic">{{ session.opEncoursName}}</div>
              <!--div class="text-bold text-italic">{{$t('op_' + session.opEncours.opName)}}</div-->
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
  <q-dialog v-model="dialogs.confirmStopop">
    <q-card>
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [$t('op_' + session.opEncours.opName)])}}</q-card-section>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <btn-cond flat :label="$t('MLAcf_3')"
          @ok="dialogs.confirmStopop = false"/>
        <btn-cond flat :label="$t('MLAcf_4')"
          @ok="dialogs.confirmStopop = false; session.opEncours.abort()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des thèmes clair / foncé -->
  <q-dialog v-model="dialogs.theme" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <btn-cond icon="close" color="warning" @ok="dialogs.theme = false"/>
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
  <dialog-std1 v-model="dialogs.crypto" vh="80" vue="SettingsButton"
    :title="$t('crypto')" hdrclass='wmd' help="pings">
    <template #default>
      <div class="q-pa-xs">
        <input-b class="q-mt-md q-mb-sm" v-model="ps" size="ps"
          prefix="SBphrase" @validate="validPs"/>
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_sh')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.b64" />
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_sha')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.shaps" />
        <div class="q-mt-md titre-md text-italic">{{$t('SBphrase_shaS')}}</div>
        <q-input dense class="q-mb-md font-mono text-bold" filled v-model="cr.shaSps" />

        <q-separator class="q-my-md" color="orange" />

        <div class="row item-center q-gutter-md">
          <btn-cond class="q-mb-md" no-caps :label="$t('SBgenuserid')" @ok="genId"/>
          <div class="font-mono fs-lg">{{ usid }}</div>
        </div>

        <q-separator class="q-my-md" color="orange" />

        <div class="text-italic titre-md q-my-xs text-center">{{ $t('SBgencc') }}</div>
        <div class="row justify-around q-my-xs">
          <btn-cond class="q-mb-md" :label="$t('SBgensv')" @ok="genSV"/>
          <btn-cond class="q-mb-md" :label="$t('SBgendc')" @ok="genDC"/>
        </div>
        <div v-if="cr.x" class="q-my-sm titre-md text-italic">
          {{$t('SBgen_' + cr.x)}}</div>
        <q-input class="q-pa-xs bord1" v-model="cr.pems" type="textarea"
         :rows="15"/>
      </div>
    </template>
  </dialog-std1>

  <!-- Maj préférences -->
  <dialog-std1 v-model="dialogs.edprf" vue="SettingsButton"
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

  <!-- Profil de l'utilisateur -->
  <dialog-std0 :title="$t('SButtitle')" v-model="dialogs.userProfile" vue="SettingsButton">
    <template #default>
      <user-profile/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive, watch } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { SOA } from '../src-fw/registry'
import { LocPref } from '../stores/safe-store'
import { localeOption } from '../stores/config-store'
import { Crypt, toPem } from '../src-fw/crypt'
import { $t, sty, reloadPage, dhcool, coolBye } from '../src-fw/util'
import { keyToB64 } from '../src-fw/b64'
import { AOperation } from '../src-fw/operation'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import PermissionBox from '../components-fw/PermissionBox.vue'
import InputB from '../components-fw/InputB.vue'
import UserProfile from '../components-fw/UserProfile.vue'
import StatusSite from '../components-fw/StatusSite.vue'
import StatusOrg from '../components-fw/StatusOrg.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import SafeExport from '../dialogs-fw/SafeExport.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import DialogStd1 from '../dialogs-fw/DialogStd1.vue'
import PrefEditor from '../components/PrefEditor.vue'

// @ts-ignore
import superman from '../assets/superman.jpg'

const i18n = useI18n()
const config = stores.config
const session = stores.session
const sf = stores.safe
const ui = stores.ui

const dialogs = reactive({
  SafeExport: false,
  ServiceStatus: false,
  theme: false,
  edprf: false,
  crypto: false,
  confirmStopop: false,
  userProfile: false
})

const so = reactive({
  org: '',
  site: '',
  svc: '',
  ready: false,
  admin: false
})
const surl = computed(() => 
  AOperation.urls.get(so.site) || '?')
const usid = ref('')
const genId = () => {
  usid.value = Crypt.rnd(15)
}
const setOS = async (soa: SOA) => {
  so.org = soa.org
  so.svc = soa.svc
  so.svcLabel = soa.svcLabel
  so.site = soa.site
  so.admin = soa.admin
  so.ready = true
}
const closeSS = () => {
  so.org = ''
  so.svc = ''
  so.svcLabel = ''
  so.site = ''
  so.admin = ''
  so.ready = false
  dialogs.ServiceStatus = false
}

const svcop = reactive({
  SVC: '',
  $OP: ''
})
const svcurl = ref('')
const user = ref('')
const org = ref('')

const resetHot = () => {
  svcurl.value = ''
  svcop.SVC = ''
  svcop.$OP = ''
  user.value = ''
  org.value = ''
}

const tab = ref('cred')
watch(tab, (t) => {
  if (t === 'hot') resetHot()
})

const cl = (lg: localeOption) => config.optionLocale.value === lg.value ? 'disabled' : ''

const choix = (lg: localeOption) : void => {
  i18n.locale.value = lg.value
  config.setLocale(lg.value)
}

ui.setDark(true)

const styd = (c: string) => 'background:' + config.K.theme[c][0]

const edDiag = computed(() => session.edPref.diag )

const openPrefs = () => {
  const ep = session.pref
  session.setEdPref(ep.code, ep.time, decode(encode(ep.obj)))
  dialogs.edprf = true
}

const edValid = async () => {
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
  dialogs.edpref = false
}

const cr = reactive({ b64: '', shaps: '', shaSps: '', pems: '', x: 0 })
const ps = reactive({ inp: '', err: ''})

const validPs = async () => {
  const sh = await Crypt.strongHash(ps.inp, false, true) as Uint8Array
  cr.b64 = keyToB64(sh)
  cr.shaps = Crypt.sha(sh, false)
  cr.shaSps = Crypt.shaS(sh)
}

const genSV = async () => {
  const { pub, priv } = await Crypt.getSVKeyPair()
  const t1 = toPem(pub, true)
  const t2 = toPem(priv)
  cr.x = 1
  cr.pems = t1 + '\n\n' + t2 + '\n'
}

const genDC = async () => {
  const { pub, priv } = await Crypt.getKeyPair()
  const t1 = toPem(pub, true)
  const t2 = toPem(priv)
  cr.x = 2
  cr.pems = t1 + '\n\n' + t2 + '\n'
}

const setGrantRevoke = async (grant: boolean) => {
  const b = await sf.GRSvcOpOrg (svcop.SVC, grant ? svcop.$OP : null, org.value)
  if (b) await ui.diagDisplay($t('recorded'))
}

const setSvcUrl = async () => {
  const b = await sf.SetOpUrl (svcop.SVC, svcop.$OP, svcurl.value)
  if (b) await ui.diagDisplay($t('recorded'))
}
resetHot()
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
