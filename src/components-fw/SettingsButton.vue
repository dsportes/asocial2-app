<template>
<div>
  <q-btn v-if="config.opSignal" flat dense color="purple-7" class="bg-white" icon="wifi"/>
  <q-btn v-else flat dense icon="settings" :class="config.newVersionReady ? 'bg-negative text-white' : ''">
    <q-menu>
      <q-list style="min-width: 300px">

        <q-item v-if="config.newVersionReady" clickable dense v-close-popup
          class="bg-negative text-white"
          @click="config.newVersionDialog = true">
          <q-item-section avatar><q-avatar size="xl" icon="system_update"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('RLtit1')}}</q-item-section>
        </q-item>
        <q-separator v-if="config.newVersionReady"/>

        <q-item clickable dense v-close-popup @click="openHelp('topHelp')">
          <q-item-section avatar><q-avatar size="xl" icon="help"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('genhelp')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item v-for="lg in config.K.localeOptions" :key="lg.value" dense :class="cl(lg)"
          @click="choix(lg)" clickable v-close-popup>
          <q-item-section avatar><q-avatar size="xl">{{lg.flag}}</q-avatar></q-item-section>
          <q-item-section class="fs-lg">{{lg.label}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="darkClear">
          <q-item-section avatar><q-avatar size="xl" icon="contrast"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('darkclear')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="theme = true">
          <q-item-section avatar><q-avatar size="xl" icon="palette"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('theme')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="pings = true">
          <q-item-section avatar><q-avatar size="xl" icon="network_ping"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('pings')}}</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable dense v-close-popup @click="reloadPage">
          <q-item-section avatar><q-avatar size="xl" icon="restart_alt"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('restartApp')}}</q-item-section>
        </q-item>

        <q-item clickable dense v-close-popup @click="coolBye">
          <q-item-section avatar><q-avatar size="xl" icon="close"/></q-item-section>
          <q-item-section class="fs-lg">{{$t('closeApp')}}</q-item-section>
        </q-item>

        <q-item>
          <q-item-section class="font-mono text-center text-italic">{{ $t('buildapi', [config.K.BUILD, config.K.APIVERSION]) }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <!-- Contrôle de l'autorisation des notifications-->
  <q-dialog v-model="config.permDialog" persistent>
    <permission-dialog/>
  </q-dialog>

  <!-- Information / option d'installation d'une nouvelle version -->
  <q-dialog v-model="config.newVersionDialog" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <q-btn dense icon="close" color="warning" :label="$t('later')"
          @click="config.newVersionDialog = false"/>
        <q-toolbar-title>{{$t('RLtit1')}}</q-toolbar-title>
        <help-button page="reloadApp"/>
      </q-toolbar>

      <div class="q-pa-sm">
        <div class="titre-md q-my-md">{{$t('RLtit2')}}</div>
        <div class="row q-my-sm justify-between items-center">
          <div class="titre-md text-bold">{{$t('RLopt1')}}</div>
          <q-btn dense padding="none" icon="system_update" color="primary"
            :label="$t('clickhere')" @click="reloadPage"/>
        </div>
        <div class="row q-my-sm justify-between items-center">
          <div class="col titre-md q-my-sm text-italic">{{$t('RLopt2')}}</div>
          <q-btn class="col-auto q-ml-sm" dense padding="none" icon="close"
            color="primary" :label="$t('gotit')" @click="config.newVersionDialog = false"/>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- Affiche l'opération en cours et propose son interruption -->
  <q-dialog v-model="config.opDialog" maximized persistent>
    <div v-if="config.opSpinner >= 2" class="column items-center q-ma-lg">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div :class="sty() + 'cursor-pointer stop'" @click="confirmstopop = true">
          <div class="row items-center justify-between q-pa-sm" style="width:20rem">
            <div class="col column items-center">
              <div class="text-bold titre-md">{{$t('MLAopc')}}</div>
              <div class="text-bold text-italic">{{$t('op_' + config.opEncours)}}</div>
              <div class="titre-sm">{{$t('MLAint')}}</div>
            </div>
            <div class="col-auto row items-center justify-center q-pa-sm">
              <q-spinner color="primary" size="40px" :thickness="4"/>
              <div class="font-mono fs-xs text-center text-white text-bold bg-negative tag">
                {{config.opSpinner}}</div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <!-- Confirmation d'interruption de l'opération en cours -->
  <q-dialog v-model="confirmstopop">
    <q-card>
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [$t('op_' + config.opEncours)])}}</q-card-section>
      <q-card-actions vertical align="right" class="q-gutter-sm">
        <q-btn flat color="primary" :label="$t('MLAcf3')" @click="confirmstopop = false"/>
        <q-btn flat color="primary" :label="$t('MLAcf4')" @click="confirmstopop = false; abortPostOp()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="theme" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <q-btn dense icon="close" color="warning" @click="theme = false"/>
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

  <!-- Pings du serveur -->
  <q-dialog v-model="pings" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbp">
        <q-btn dense icon="close" color="warning" @click="pings = false"/>
        <q-toolbar-title>{{$t('pings')}}</q-toolbar-title>
        <q-btn dense icon="check" color="primary" @click="opSetSrvStatus(1)"/>
        <q-btn dense icon="check" color="warning" @click="opSetSrvStatus(2)"/>
        <help-button page="reloadApp"/>
      </q-toolbar>

      <div class="column q-pa-sm q-gutter-md">
        <q-input filled v-model="toecho" :label="$t('toecho')">
          <template v-slot:append>
            <q-btn icon="send" color="primary" :disable="toecho === ''" @click="opEcho"/>
          </template>
        </q-input>
        <div class="font-mono">{{$t('echo', [echo])}}</div>
      </div>

      <q-separator color="orange" class="q-my-md"/>

      <div class="column items-center">
        <q-btn icon-right="send" color="primary":label="$t('ping')" @click="opGetSrvStatus"/>
        <div class="q-mt-sm q-mx-sm font-mono height-4 text-center">{{resping}}</div>
      </div>

    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, setCssVar } from 'quasar'

import stores from '../stores/all'
import HelpButton from './HelpButton.vue'
import PermissionDialog from './PermissionDialog.vue'
import { $t, $q, sty, reloadPage, openHelp, sleep, coolBye } from '../src-fw/util'
import { Echo, GetSrvStatus, SetSrvStatus } from '../src-fw/operations'
import { localeOption } from '../stores/config-store'

const i18n = useI18n()
const config = stores.config

const confirmstopop = ref(false)
const theme = ref(false)

const cl = (lg: localeOption) => config.optionLocale.value === lg.value ? 'disabled' : ''

const choix = (lg: localeOption) : void => {
  i18n.locale.value = lg.value
  config.setLocale(lg.value)
}

function setCss() {
  const d = $q.dark.isActive ? 0 : 1
  const t = config.theme
  for(const c in t) setCssVar(c, t[c][d])
}

function darkClear () {
  $q.dark.toggle()
  setCss()
}

$q.dark.set(true)
setCss()

const styd = (c: string) => 'background:' + config.K.theme[c][0]

const pings = ref(false)
const toecho = ref('')
const echo = ref('')

async function opEcho () : Promise<void>  {
  try {
    echo.value = ''
    echo.value = await new Echo().run(toecho.value)
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

const resping = ref('')
async function opGetSrvStatus () : Promise<void> {
  try {
    resping.value = ''
    const { now, st, at, txt } = await new GetSrvStatus().run()
    const nowS = new Date(now).toISOString()
    const atS = at ? new Date(at).toISOString() : '?'
    const stS = $t('srvStatus_'+ st, [atS])
    const srvBUILD = res['srvBUILD']
    resping.value = $t('srvStatus', [nowS, stS, srvBUILD, txt || ''])
  } catch (e) {
    resping.value = 'err:' + (e.code || '???')
  }
}

async function opSetSrvStatus (stx) : Promise<void> {
  try {
    resping.value = ''
    const { now, st, at, txt } = await ServSrvStatus().run(stx)
    const nowS = new Date(now).toISOString()
    const atS = at ? new Date(at).toISOString() : '?'
    const stS = $t('srvStatus_' + st, [atS])
    const srvBUILD = res['srvBUILD']
    resping.value = $t('srvStatus', [nowS, stS, srvBUILD, txt || ''])
  } catch (e) {
    resping.value = 'err:' + (e.code || '???')
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.tag { border-radius:10px; height: 20px; width: 20px; padding-top: 2px; overflow:hidden; }
.stop { border-radius : 8px; border: 2px solid $grey-5}
.stop:hover { border-color: $negative }
.pal { width: 40px; height: 24px; margin: 8px }
.dk { background: var(--q-dark); border: 1px solid white; border-radius: 8px }
.li { background: white; border: 1px solid black; border-radius: 8px }
</style>
