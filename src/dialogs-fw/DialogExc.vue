<!-- Dialogue APP de récupéation des exceptions au retour des opérations-->
<template>
  <q-dialog v-model="ui.appDialogs.DialogExc" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbs">
        <btn-bubble :text="$t('EX' + major + '_bub')"/>
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('EX' + major + '_label')}}</q-toolbar-title>
      </q-toolbar>
      <q-card-section v-if="!abort">
        <div class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <btn-cond v-if="!exc.background" color="primary" icon="arrow_forward"
          :label="$t('EX_continue')" @ok="cont"/>
        <btn-cond color="warning" icon="logout" 
          :label="$t('EX_quit')" @ok="reload"/>
        <btn-cond color="warning" icon="refresh" 
          :label="$t('EX_reload')" @ok="reload"/>
      </q-card-actions>
      <q-card-section v-if="!abort && exc.stack" class="q-pt-none">
        Stack <q-toggle v-model="errstack"/>
        <q-input v-if="errstack" type="textarea" autogrow v-model="exc.stack" class="q-pa-xs stackclass font-mono"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/all'
import { sty, $t } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

/* code
public code: number
public label: string
public opName: string
public org: string
public stack: string
public args: string[]
public message: string

background: true si l'opération a été lancé en mode background

Codes:
  Détecté par l'application
  1: erreur fonctionnelle APP
  2: erreur fonctionnelle FW
  3: assertion FW - BUG: 
  4: assertion APP - BUG:
  8: FW : Exception technique DB / réseau
  9: APP: Exception technique DB / réseau
  10: FW : Exception technique DB / réseau : configuration suspectée
  11: APP: Exception technique DB / réseau : configuration suspectée
  99: Interruption actionnée par l'utilisateur

  Remonté d'un service - assertions 13...16 transmises à l'adiministarteur
  101: erreur fonctionnelle FW : non détectable par l'application
  102: erreur fonctionnelle APP : non détectable par l'application
  103: assertion FW - BUG: l'erreur fonctionnelle est censée avoir été bloquée par l'application
  104: assertion APP - BUG: l'erreur fonctionnelle est censée avoir été bloquée par l'application
  105: assertions FW - Données incohérentes non détectables par l'application
  106: assertions APP - Données incohérentes non détectables par l'application
  108: FW : Exception technique DB / réseau
  109: APP : Exception technique DB / réseau
  110: FW : Exception technique DB / réseau : configuration suspectée
  111: APP : Exception technique DB / réseau : configuration suspectée
*/

const ui = stores.ui
const errstack = ref(false)
const exc = computed(() => ui.exc.ex || { code: 0 })
const major = computed(() => { const c = exc.value.code; return Math.floor(c / 1000) })
const html = computed(() => {
  const e = exc.value
  const str = !e.args ? $t('EX_' + e.code) : $t('EX_' + e.code, e.args)
  return  e.code + ' - ' + str.replace(/\n/g, '<br>')
})
const abort = computed(() => major.value === 10)

async function bye () {
  ui.confirmQuit()
}

async function reload () {
  ui.confirmQuit()
}

function cont () {
  ui.hideExc()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.stackclass { height: 15rem; border: 1px solid black; font-size: 0.8rem }
</style>
