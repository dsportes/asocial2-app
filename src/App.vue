<template>
<div>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-btn label="T1" :color="config.focus ? 'green' : 'red'" @click="t1"/>
    <q-toolbar-title class="titre-md">{{$t('titre', [config.dataSt.cpt])}}</q-toolbar-title>
    <q-btn icon="add" :label="$t('plus1')" @click="plus1"/>
    <q-btn class="q-mr-sm" icon="remove" :label="$t('moins1')" @click="moins1"/>
    <bouton-langue class="q-mr-sm" style="position:relative;top:2px;"/>
    <q-btn icon="contrast" round @click="$q.dark.toggle()"/>

    <q-icon class="wifi bg-white" v-if="config.opSignal" size="30px" color="purple-7" name="wifi"/>
  </q-toolbar>

  <div class="row q-pa-sm justify-center q-gutter-md">
    <q-input filled v-model="echo" :label="$t('echo')">
      <template v-slot:append>
        <q-btn icon="check" :disable="echo === ''" @click="opEcho"/>
      </template>
    </q-input>
    <q-btn icon="send" :label="$t('ping')" @click="opPing"/>
  </div>
  <div class="font-mono q-pa-sm">{{echo}}</div>
  <q-file class="full-width q-ma-xs" filled v-model="fileList"
    :label="$t('pickfile')" max-file-size="50000000" max-file="1">
    <template v-slot:append>
      <q-btn icon="upload" class="q-mr-SM" :disable="fd.size === 0" @click="uploadFile"/>
      <q-btn icon="download" :disable="fd.size === 0" @click="downloadFile"/>
    </template>
  </q-file>

  <!-- Affiche l'opération en cours et propose son interruption -->
  <q-dialog v-model="config.opDialog" maximized persistent backdrop-filter="sepia(90%)">
    <stop-operation/>
  </q-dialog>

  <div class="stop row justify-center q-pa-xl" v-if="config.dialogSTOP">
    <div class="titre-xxl cursor-pointer" @click="fermer">Fermer la fenêtre</div>
    <div>{{config.dialogIDX}}</div>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import ext2mime from 'ext2mime'

// @ts-ignore
import { ref, computed, watch } from 'vue'
// @ts-ignore
import { useQuasar } from 'quasar'
// @ts-ignore
import { useConfigStore } from './stores/config-store'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import BoutonLangue from './components/BoutonLangue.vue'
// @ts-ignore
import StopOperation from './components/StopOperation.vue'

import { setConfig, postOp, abortPostOp, getData, putData, readFile, fileDescr } from './app/util'

console.log('Open App.vue')

const $q = useQuasar()
const config: any = useConfigStore()
const $t: Function = useI18n().t // Pour rendre accessible $t dans le code
setConfig(config, $t, $q)

function plus1 () : void {
  config.dataSt.cpt++
}
function moins1 () : void {
  config.dataSt.cpt--
}

const fermer = () => {
  const idx = config.dialogIDX
  console.log('Fermer - focus >>> ', idx)
  /*
  const w = browser.windows.get(idx)
  w.then((x) => {
    console.log('x?')
  })
  */
  window.location.href = 'https://asocialapps.github.io/frdocs/about.html'
}

/* ça ne marche pas !
const toStop = computed(() => config.dialogSTOP)

watch(toStop, () => {
  fermer()
})
*/


const echo = ref('')

const fileList = ref(null)
const defFd: fileDescr = { name: 'titi.jpg', size: 0 }
const fd = ref(defFd)
const fileType = computed(() => !fd.value ? '' :
  ( fd.value.type ? fd.value.type : ext2mime(fd.value.name || '')))

watch(fileList, async (file: any) : Promise<void> => {
  if (file) fd.value = await readFile(file, true)
})

async function opEcho () : Promise<void>  {
  try {
    const res = await postOp('EchoTexte', { text: echo.value })
    echo.value = res['echo']
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

async function getPutUrl (put: boolean) : Promise<void> {
  try {
    const res = await postOp('GetPutUrl', { id1: 'toto', id2: 'tata', id3: fd.value.name, put: put })
    echo.value = res['url']
  } catch (e) {
    echo.value = ''
  }
}

async function downloadFile () : Promise<void> {
  await getPutUrl(false)
  if (echo.value) try {
    const data = await getData(echo.value)
    const blob = new Blob([data], { type: fileType.value })
    const url = URL.createObjectURL(blob)
    setTimeout(() => { window.open(url, '_blank') }, 100)
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

async function uploadFile () : Promise<void> {
  await getPutUrl(false)
  if (echo.value) try {
    await putData(echo.value, fd.value.u8)
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

const res = ref('')
async function opPing () : Promise<void> {
  try {
    const x = await postOp('PingDB', { })
    res.value = x['status'] + ' - ' + x['msg']
  } catch (e) {
    echo.value = 'err:' + (e.code || '???')
  }
}

const t1 = () => {
  config.callSW("coucou")
}

/*
onfocus = (event) => {
  config.getFocus()
}

onblur = (event) => {
  config.lostFocus()
}

onbeforeunload = (event) => {
  config.callSW('App closing')
}
*/

</script>

<style lang="scss" scoped>
@import './css/app.scss';
.wifi { position: fixed; right: 3px; top: 3px; border-radius: 15px; }
.stop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: white; color: black; z-index: 1000}
</style>
