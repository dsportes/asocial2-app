<template>
<div class="column items-center">
<div :class="sty('md')">

  <div v-if="sf.step == 1" class="q-pa-sm">
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

    <div v-if="session.hasNet || !session.incognito" class="q-pl-md">
      <!-- Authentification FORTE -->
      <bar-open :bubble="$t('HPauthstrong_2')"
        :title="$t('HPauthstrong_1')" :fnopen="openStrongAuth"/>

      <!-- Authentification par code PIN -->
      <div v-if="session.hasNet && users && users.length">
        <div v-if="session.hasNet && users.length === 1">
          <bar-open :bubble="$t('HPauthbypin_2')"
            :title="$t('HPauthbypin_1a', [users[0].pseudo])" :fnopen="selectUser0"/>
        </div>
        <div v-else class="column">
          <bar-open :bubble="$t('HPauthbypin_2')" :title="$t('HPauthbypin_1b', [users.length])"/>
          <div class="row self-center q-mx-xl">
            <div v-for="u in users" :key="u.userId"
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
  </div>

  <div v-if="sf.step === 2" class="q-pa-sm">
    <btn-cond v-if="session.hasNet" class="q-my-sm" :label="$t('HPcfgPS')" icon="settings"
      @ok="openCM"/>

    <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
    <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
      class='bord1 q-pa-xs'>
      <div :class="dkli(idx)" v-for="([profId, p], idx) of sf.mySafeProfiles" :key="profId">
        <div v-if="sOfP(profId)">
          <div :class="clSel(sOfP(profId)) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selSession(sOfP(profId))">
            <div class="col-7 q-pr-xs">{{pincode + ' ' + (sOfP(profId).about || $t('HPpstar'))}}</div>
            <div class="col-4 text-italic">{{dhcool(sOfP(profId).time)}}</div>
            <div v-if="sOfP(profId).hasCache" class="col-1 row justify-end">
              <q-img :src="database" style="height: 24px; max-width: 24px"/>
            </div>
            <div v-else class="col-1"/>
          </div>
        </div>
        <div v-else>
          <div :class="clSel(p) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
            @click="selProfile(p)">
            <div class="col-7 q-pr-xs q-pl-xs">{{p.about || $t('HPpstar')}}</div>
            <div class="col-4">{{$t('HPnotpinned')}}</div>
            <div class="col-1"/>
          </div>
        </div>
      </div>
    </q-scroll-area>

    <div v-if="nvSP" class="q-mt-md">
      <div v-if="sf.selectedSession">
        <div class="row justify-between items-center">
          <q-toggle class="col q-pr-md" v-model="unpinme" dense :label="$t('HPunpin_0')"/>
          <btn-bubble class="col-auto self-start" size="sm"
            :text="$t('HPunpin_1')"/>
        </div>
        <div v-if="selHasCache && !unpinme" class="row justify-between items-center">
          <q-toggle class="col q-pr-md" v-model="resetdb" dense :label="$t('HPresetdb_0')"/>
          <btn-bubble class="col-auto self-start" size="sm"
            :text="$t('HPresetdb_1')"/>
        </div>
      </div>
      <div v-else>
        <div class="row justify-between items-center">
          <q-toggle class="col q-pr-md" v-model="pinme" dense :label="$t('HPpin_0')"/>
          <btn-bubble class="col-auto self-start" size="sm"
            :text="$t('HPpin_1')"/>
        </div>
      </div>

      <div v-if="sf.selectedSession" class="font-mono text-bold q-mt-sm">
        {{sf.selectedSession.profId === '*' ? $t('HPpstar') : sf.selectedSession.about}}
      </div>
      <div class="titre-md text-italic text-bold text-right">{{$t('HPwprfs')}}</div>
      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('HPpref_1')" @ok="validateSession('', null)"/>
        <btn-cond v-for="[code, data] in sf.mySafePrefs" :key="code"
          flat :label="'... ' + code" @ok="validateSession(code, data)"/>
      </q-card-actions>
    </div>

    <q-separator class="q-my-md" color="orange"/>

    <bar-open :bubble="$t('HPchgcodes_2')" :disbubble="$t('HPchgcodes_2d')" 
      :title="$t('HPchgcodes_1')" :disable="sf.openMode > 2"
      :fnopen="openChgCodes" size="sm"/>

    <bar-open v-if="!isTrusted" :bubble="$t('HPtrust_2')" :disbubble="$t('HPtrust_2d')" 
      :title="$t('HPtrust_1')" :disable="sf.openMode > 2"
      :fnopen="openTrust" size="sm"/>

    <bar-open v-if="isTrusted" :bubble="$t('HPchgpin_2')" :disbubble="$t('HPtrust_2d')" 
      :title="$t('HPchgpin_1')" :disable="sf.openMode > 2"
      :fnopen="openTrust" size="sm"/>

    <bar-open v-if="isTrusted" :bubble="$t('HPuntrust_2')" :disbubble="$t('HPtrust_2d')" 
      :title="$t('HPuntrust_1')" :disable="sf.openMode > 2"
      :fnopen="openUntrust" size="sm"/>
  </div>

  <q-separator class="q-mt-sm q-mb-md" color="orange"/>

  <bar-open v-if="session.hasNet" :bubble="$t('HPcredsmgr_2')" class="q-pa-sm q-my-sm"
    :title="$t('HPcredsmgr_1')" :fnopen="openCM" size="sm"/>

  <bar-open class="q-pa-sm q-mb-md":bubble="$t('HPmanuinfo')"
    :disable="session.incognito || !session.hasNet" size="sm"
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

  <!-- Gestion des users / sessions --> 
  <manage-users v-if="mu" :idc="idc" @close="closeManusers"/>

  <!-- Gestion des credentials --> 
  <creds-mgr v-if="cm" :idc="idc" @updated="credsUpdated"/>

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
        <q-scroll-area style="height: 150px" :barStyle="barStyle" :thumbStyle="thumbStyle">
          <div v-for="[id,s] in sf.mySessions" :key="id" class="q-my-xs row">
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
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
import { decode } from '@msgpack/msgpack'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
// import BtnConfirm from '../components-fw/BtnConfirm.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
// import ChooseIt from '../components-fw/ChooseIt.vue'
import SafeCr from '../components-fw/SafeCr.vue'
import ManageUsers from '../components-fw/ManageUsers.vue'
import CredsMgr from '../components-fw/CredsMgr.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'
import { Credential } from '../src-fw/credential'

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
const cm = computed(() => ui.dModels[idc].credsmgr)

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
    if ((!session.hasNet && session.incognito) || !sf.userId) {
      sf.step = 1
    } else {
      if (session.hasNet) 
        await sf.reloadSafe()
      if (!session.incognito) 
        await openSession()
    }
  }
})

watch(() => sf.step, (s) =>{
  if (s === 1) {
    pin.inp = ''
  }
})

const users = computed(() => sf.trustings ? Array.from(sf.trustings.values()) : [])

const selectUser = (u) => {
  selectedUser.value = u
  pin.value = { inp: '', err: '' }
  ui.oD(idc, 'pindial')
}
const selectUser0 = (u) => { selectUser(users.value[0]) }

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

/*
type Profile = {
  about: string
  creds: string[]
}
*/

const newDev = ref(false)
const devName = reactive({ inp: '', err: '' })
const newPIN = reactive({ inp: '', err: '' })
const newPseudo = reactive({ inp: '', err: '' })
const mySessions: Ref<TSession> = ref(new Map())
const myTrusting = ref<null> 
const isTrusted = computed(() => myTrusting.value !== null)

const credsUpdated = async () => {
  ui.fD()
  await openSession()
}

const sOfP = (profId: string) => { return sf.sessionOfProfId(profId) }

const openSession = async () => {
  if (!session.incognito && !sf.hasIDBS) 
    await sf.init1()
  await sf.getMySessions()
  myTrusting.value = sf.getMyTrusting()
  sf.selectedSession = null
  sf.selectedProfile = null
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
  const t = sf.getMyTrusting()
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

const setTrust = async () => {
  try {
    const status = await sf.setTrust(devName.inp, newPIN.inp, newPseudo.inp)
    if (status < 0) return
    ui.fD()
    await ui.diagDisplay($t('HPsttrust_' + status))
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

const resetdb = ref(false)
const unpinme = ref(false)
const pinme= ref(false)
const newProfAbout = reactive({ inp: '', err: '' })

watch(unpinme, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

watch(resetdb, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

const nvSP = computed(() => sf.selectedSession || sf.selectedProfile)
const selHasCache = computed(() => sf.selectedSession && sf.selectedSession.hasCache)

const selSession = (s) => {
  resetdb.value = false
  unpinme.value = false
  sf.selectedSession = s
  sf.selectedProfile = null
  newProfAbout.inp = s.about
}

const selProfile = (profile: Profile) => {
  pinme.value = false
  sf.selectedSession = null
  sf.selectedProfile = profile
  newProfAbout.inp = profile.about
}

const selStar = (() => 
  (sf.selectedSession && sf.selectedSession.profId === '*') || 
  (sf.selectedProfile && sf.selectedProfile.profId === '*') )

const clSel = (x) => {
  if (sf.selectedSession === x) return 'bord2 '
  if (sf.selectedProfile && sf.selectedProfile.profId === x.profId) return 'bord2 '
  return ''
}

const validateSession = async (prefCode, prefObj) => {
  if (newProfAbout.err !== '') return

  let sv = sf.selectedSession
  const sp = sf.selectedProfile
  let about: string = newProfAbout.inp
  let profile: Profile = null

  if (sv) { 
    // reprise d'une session épinglée
    if (!session.hasNet) {
      // mode avion : reprise telle quelle (seul son time est mis à jour)
      await sf.setTSession(sv, false)
    } else {
      if (sv.profId !== '*') {
        profile = sf.mySafeProfiles.get(sv.profId)
        if (profile) {
          if (profile.about !== about) {
            // Renommer le profile dans le Safe
            const status = await sf.setAboutProfile(sv.profId, about)
            if (status < 0) return
            if (status > 0) await ui.diagDisplay($t('HPopsret_' + status))
            sv.about = about
          }
        } else {
          /* PROBLEME 
          la session est épinglée mais son profile a été détruit depuis
          on lui redonne le profil universel
          */
          profile = { profId: '*', about: '', crIds: [] }
          sv.profId = '*'
        }
      }
      sv.prefCode = prefCode
      sv.prefObj = prefObj
      if (unpinme.value) {
        sv.hasCache = false
        await sf.delTSession(sv)
      } else {
        // save tsession avec time, raz db si requis
        await sf.setTSession(sv, resetdb.value)
        session.setDbName(sv.hasCache ? sv.dbName : '')
      }
    }

  } else { // sp : existe
    /* nouvelle session ouverte depuis un profile 
    QUI EXISTE puisqu'il a été sélectionné.
    Il y a TOUJOURS du réseau pour avoir pu choisir un "profile"
    */
    profile = sp
    if (sp.profId !== '*' && sp.about !== about) // Maj du profile dans Safe
      await sf.setAboutProfile(sp.profId, about)

    if (pinme.value) { // épingler la session
      const nvs = sf.newTSession({
        app: cfg.appname,
        userId: sf.userId,
        profId: sp.profId,
        about: about,
        hasCache: true,
        size: 0,
        time: 0,
        prefCode: prefCode,
        prefObj: prefObj
      }) as TSession
      await sf.setTSession(nvs, true) // true: par superstition ! (db ne devrait pas exister)
      session.setDbName(nvs.dbName)
    }
  } 

  await goToApp(about, sf.getCreds(profile), prefCode, prefObj)
}

const validateSessionV = async () => {
  sf.userId = null
  sf.keyK = null
  await goToApp('', new Map<string, Credential>(), '', null)
}

const goToApp = async (about: string, creds: Map<string, Credential>, code: string, data: Uint8Array) => {
  sf.step = 0
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
