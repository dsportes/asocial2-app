<template>
<div class="column items-center">
  <div :class="sty('md')">
    <div v-if="sf.tab === 'login' && sf.step === 1">
      <mode-net/>
      <security-site v-model="sf.safeStore"/>
      <login-block @logged="sf.setStep(2)"/>
    </div>

    <div v-if="sf.tab === 'login' && sf.step === 2" class="column items-center q-pa-sm">
      <mode-incognito/>

      <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
      <scroll-area size="lg" class="full-width q-mb-lg">
        <template #default>
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
        </template>
      </scroll-area>

      <safe-tools/>
    </div>

    <div v-if="sf.tab === 'guest'">
      <div class="titre-lg text-italic text-center q-my-md">{{$t('INVtit')}}</div>

    </div>
  </div>

  <!-- Dialogue d'options de lancement -->
  <q-dialog v-model="ui.dModels[myidc].optstart" persistent>
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

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
import { decode } from '@msgpack/msgpack'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import SecuritySite from '../components-fw/SecuritySite.vue'
import SafeTools from '../components-fw/SafeTools.vue'
import LoginBlock from '../components-fw/LoginBlock.vue'
import ModeNet from '../components-fw/ModeNet.vue'
import ModeIncognito from '../components-fw/ModeIncognito.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

import stores from '../stores/all'
import { TSession, Profile } from '../stores/safe-store'
import { $t, sty, dkli, dhcool, coolBye } from '../src-fw/util'

// @ts-ignore
import databaseW from '../assets/database_white.png'
// @ts-ignore
import databaseB from '../assets/database_black.png'

// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

watch(() => sf.safeStore, (v) => {
  console.log('Safe Store >>> [' + v + ']')
})

const myidc = ui.getIdc('SafePage')
onUnmounted(() => ui.closeVue(myidc))

const database = computed(() => ui.isDark ? databaseW : databaseB)

onMounted(async () => {
  await sf.init0()
})

const sOfP = (profId: string) => sf.sessionOfProfId(profId)

const resetdb = ref(false)
const unpinme = ref(false)
const pinme= ref(false)

watch(unpinme, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

watch(resetdb, async (ap) => {
  if (ap === true) await ui.diagDisplay($t('HPresetdb_1'))
})

// const nvSP = computed(() => sf.selectedSession || sf.selectedProfile)
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

const selSession = (s, dial?: boolean) => {
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
  if (dial) ui.oD(myidc, 'optstart')
}

const selProfile = (profile: Profile, dial?: boolean) => {
  pinme.value = false
  sf.selectedSession = null
  sf.selectedProfile = profile
  selSessionAb.value = profile.profId === '*' ? $t('HPpstar') : profile.about
  selSessionAbBefore.value = selSessionAb.value
  if (dial) ui.oD(myidc, 'optstart')
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

/*
const validateSessionV = () => {
  sf.userId = null
  sf.keyK = null
  sf.setStep(0)
  session.updatePref('', 0, {})
  session.setStartContext('', '', new Map())
}
*/

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
