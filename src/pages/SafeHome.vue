<template>
<div class="column items-center">
  <!--
  <btn-cond label="BUG" @ok="bug"/>
  <btn-cond confirm label="test" tp="coucou" @ok="console.log('okkkkkkkkk')"/>
  -->
  <div :class="sty('md')">
    <div v-if="sf.tab === 'login' && sf.step === 1">
      <mode-net/>
      <login-block @logged="session.noNet ? opPlane() : sf.setStep(2)"/>
    </div>

    <div v-if="sf.step === 2" class="column items-center">
      <div :class="dkli(idx) + ' full-width'" v-for="([profId, p], idx) of locSafeProfiles" :key="profId">
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
                <div class="text-italic text-bold">{{$t('HPstartpref')}}</div>
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
    </div>

    <div v-if="sf.tab === 'guest' && sf.step === 1" class="q-pa-xs">
      <q-expansion-item v-model="g1m" group="g1"
        :class="g1m ? 'bord2' : ''">
        <template v-slot:header>
          <bar-title prefix="HPinvtit_1" large/>
        </template>
        <div v-if="g1m" class="q-ml-sm">
          <login-create class="full-width"
            v-model="g1m"
            @done="sf.tab3 = 'newr'; sf.setStep(3)"/>
        </div>
      </q-expansion-item>

      <q-expansion-item v-model="g2m" group="g1"
        :class="g2m ? 'bord2' : ''">
        <template v-slot:header>
          <bar-title prefix="HPinvtit_2" large/>
        </template>
        <div v-if="g2m" class="q-ml-sm">
          <login-create class="full-width" hasaccount
            v-model="g2m"
            @done="sf.tab3 = 'scan'; sf.setStep(3)"/>
        </div>
      </q-expansion-item>

      <bar-open class="q-mt-md q-mb-xs full-width" :bubbleleft="$t('SFHvisit_bub')"
        :title="$t('SFHvisit_label')" @open="opGuest"/>

      <bar-open class="q-my-xs full-width" :bubbleleft="$t('SFHcalc_bub')"
        :title="$t('SFHcalc_label')" @open="opCalc"/>

    </div>
  </div>

  <div v-if="sf.step === 3" class="q-pa-xs">
    <demands-scan/>
  </div>

  <!-- Dialogue d'options de lancement -->
  <q-dialog v-model="dialogs.optstart" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar class="tbs">
        <btn-cond color="none" size="lg" icon="chevron_left" flat @ok="dialogs.optstart = false"/>
        <q-toolbar-title class="titre-lg text-right q-mx-xs">{{$t('HPoptstart')}}</q-toolbar-title>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <input-a v-if="session.hasNet && !selStar" class="q-my-sm"
          size="about" prefix="HPpsab" :initval="selSessionAbBefore"
          v-model="selSessionAb" @validate="valAbPs"/>
        <div v-else class="q-my-sm font-mono text-bold">{{selSessionAb}}</div>

        <div v-if="sf.selectedSession">
          <div v-if="session.hasNet" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="unpinme" dense :label="$t('HPunpin_0')"/>
            <btn-bubble class="col-auto self-start"
              :text="$t('HPunpin_1')"/>
          </div>
          <div v-if="!unpinme" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="resetdb" dense :label="$t('HPresetdb_0')"/>
            <btn-bubble class="col-auto self-start"
              :text="$t('HPresetdb_1')"/>
          </div>
        </div>
        <div v-else>
          <div v-if="session.hasNet" class="q-my-sm row justify-between items-center">
            <q-toggle class="col q-pr-md" v-model="pinme" dense :label="$t('HPpin_0')"/>
            <btn-bubble class="col-auto self-start"
              :text="$t('HPpin_1')"/>
          </div>
        </div>

        <div class="row q-my-md q-gutter-sm">
          <div class="text-italic text-bold">{{$t('HPstartpref')}}</div>
          <btn-cond no-caps :label="$t('HPpref_1')"
            @ok="dialogs.optstart = false; validateSession('', 0, null)"/>
          <btn-cond no-caps v-for="[code, [time, obj]] in sf.mySafePrefs" :key="code"
            :label="code" padding="none xs"
            @ok="dialogs.optstart = false; validateSession(code, time, obj)"/>
        </div>

      </div>
    </q-card>
  </q-dialog>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, onMounted, watch } from 'vue'
// @ts-ignore
import { decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { TSession, Profile } from '../stores/safe-store'
import { $t, sty, dkli, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import LoginBlock from '../components-fw/LoginBlock.vue'
import ModeNet from '../components-fw/ModeNet.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import LoginCreate from '../components-fw/LoginCreate.vue'
import DemandsScan from '../components-fw/DemandsScan.vue'
// import { Bug } from '../src-fw/operations'

// @ts-ignore
import databaseW from '../assets/database_white.png'
// @ts-ignore
import databaseB from '../assets/database_black.png'

// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin

const ui = stores.ui
const sf = stores.safe
const session = stores.session
const cfg = stores.config

const dialogs = reactive({
  optstart: false
})

const database = computed(() => ui.isDark ? databaseW : databaseB)

onMounted(async () => {
  await sf.init0()
})

const sOfP = (profId: string) => sf.sessionOfProfId(profId)

const resetdb = ref(false)
const unpinme = ref(false)
const pinme= ref(false)
const g1m = ref(false)
const g2m = ref(false)

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
  } catch (e: any) {
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
  if (dial) dialogs.optstart = true
}

const selProfile = (profile: Profile, dial?: boolean) => {
  pinme.value = false
  sf.selectedSession = null
  sf.selectedProfile = profile
  selSessionAb.value = profile.profId === '*' ? $t('HPpstar') : profile.about
  selSessionAbBefore.value = selSessionAb.value
  if (dial) dialogs.optstart = true
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

const validateSession = async (prefCode, prefTime, prefObj) => {
  let sv = sf.selectedSession
  const sp = sf.selectedProfile
  let profile: Profile | null = null

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
  if (profile)
    session.setStartContext(profile.about, sf.getCreds(profile))
}

const opGuest = () => {
  session.noNet = false
  sf.setStep(0)
  session.setStartContext('', new Map())
}

const opCalc = () => {
  session.noNet = true
  sf.setStep(0)
  session.setStartContext('', new Map())
}

const opPlane = () => {
  session.noNet = true
  sf.setStep(0)
  session.setStartContext('', new Map())
}

/* const bug = async () => {
  await new Bug('AS2', 'doda').run()
  console.log('bug done')
} */

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordv { border-left: 1px solid $grey-8; }
.q-toolbar__title { font-size: medium !important;}
.bord2 { border: 1px solid $warning; }

</style>
