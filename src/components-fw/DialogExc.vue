<template>
  <q-dialog v-model="ui.dModels['0'].dialogExc" persistent>
    <q-card :class="sty('md')">
      <q-toolbar class="tbs">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('EX_' + major)}}</q-toolbar-title>
      </q-toolbar>
      <q-card-section v-if="!abort">
        <div class="titre-md" v-html="html"/>
      </q-card-section>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <btn-cond color="primary" icon="arrow_forward"
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
import BtnCond from './BtnCond.vue'

/* code
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
const exc = computed(() => ui.exc || { code: 0 })
const major = computed(() => { const c = exc.value.code; return Math.floor(c / 1000) })
const html = computed(() => {
  const e = exc.value
  const str = !e.args ? $t('EX_' + e.code) : $t('EX_' + e.code, e.args)
  return  e.code + ' - ' + str.replace(/\n/g, '<br>')
})
const abort = computed(() => major.value === 10)

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
