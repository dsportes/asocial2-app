<template>
  <q-dialog v-model="ui.dModels['0'].dialogExc" persistent>
    <q-card v-if="ui.exc" :class="sty('md')">
      <q-card-section>
        <div class="titre-lg btnbg">{{$t('EX_' + major)}}</div>
        <div v-if="major !== 10" class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <btn-cond color="primary" icon="arrow_forward"
          :label="$t('EX_continue')" @ok="cont"/>
        <btn-cond color="warning" icon="logout" 
          :label="$t('EX_quit')" @ok="reload"/>
        <btn-cond color="warning" icon="refresh" 
          :label="$t('EX_reload')" @ok="reload"/>
      </q-card-actions>
      <q-card-section v-if="major !== 1 && exc.stack" class="q-pt-none">
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
import BtnCond from './BtnCond.vue'

/* code
EX_1: 'Interruption volontaire (appui sur le bouton rouge)',
EX_2: 'Erreur d`accès au serveur, réseau indisponible ?',
EX_3: 'Erreur d\'accès à la base locale',
EX_4: 'Erreur inattendue survenue dans le traitement sur le poste',
EX_5: 'Données saisies non conformes',
EX_6: 'Donnée absente ou corrompue détectée par le browser',
EX_7: 'Erreur inattendue survenue dans le traitement sur le serveur',
EX_8: 'Données transmises au serveur non conformes',
EX_9: '"BUG" très probable: le serveur a lu une donnée corrompue ou n\'a pas trouvé une donnée qui aurait dû être présente.',

1000: erreurs fonctionnelles FW
2000: erreurs fonctionnelles APP
3000: assertions FW
4000: assertions APP
8000: assertions FW - transmises à l'administrateur
9000: assertions APP - transmises à l'administrateur

public code: number
public label: string
public opName: string
public org: string
public stack: string
public args: string[]
public message: string
*/

const ui = stores.ui
const errstack = ref(false)
const exc = computed(() =>  ui.exc || { code: 0 })
const major = computed(() => { const c = exc.value.code; return Math.floor(c / 1000) })
const html = computed(() => {
  const e = exc.value
  const str = !e.args ? $t('EX_' + e.code) : $t('EX_' + e.code, e.args)
  return  e.code + ' - ' + str.replace(/\n/g, '<br>')
})

async function bye () {
  ui.oD('0', 'confirmQuit')
}

async function reload () {
  ui.oD('0', 'confirmQuit')
}

function cont () {
  ui.hideExc()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.stackclass { height: 15rem; border: 1px solid black; font-size: 0.8rem }
</style>
