<template>
<div>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-btn label="WP" size="md" @click="startWP"
      :color="config.hashSub ? 'green' : 'red'"
      :disable="!wpStartable"
    />
    <q-btn label="T4" @click="t4"/>
    <q-toolbar-title class="titre-md">{{$t('titre', [dataSt.cpt])}}</q-toolbar-title>
    <q-btn icon="add" :label="$t('plus1')" @click="plus1"/>
    <q-btn class="q-mr-sm" icon="remove" :label="$t('moins1')" @click="moins1"/>

    <settings-button class="q-mr-sm"/>
    <help-button page="x1"/>
  </q-toolbar>

  <div class="font-mono q-pa-sm">{{echo}}</div>
  <q-file class="full-width q-ma-xs" filled v-model="fileList"
    :label="$t('pickfile')" max-file-size="50000000" max-file="1">
    <template v-slot:append>
      <q-btn icon="upload" class="q-mr-SM" :disable="fd.size === 0" @click="uploadFile"/>
      <q-btn icon="download" :disable="fd.size === 0" @click="downloadFile"/>
    </template>
  </q-file>

  <got-it v-if="ui.dModels['0'].diag"/>
  <confirm-quit v-if="ui.dModels['0'].confirmQuit"/>
  <dialog-exc v-if="ui.dModels['0'].dialogExc"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import ext2mime from 'ext2mime'
// @ts-ignore
import { ref, computed, watch } from 'vue'
// @ts-ignore
import { useQuasar, setCssVar } from 'quasar'
// @ts-ignore
import { useI18n } from 'vue-i18n'

import stores from './stores/all'

import { setTQ, readFile, fileDescr, setCss } from './src-fw/util'
import { TestAuth } from './src-fw/operations'
import { postOp, getData, putData } from './src-fw/net'
import { Crypt, testECDH, testSH } from './src-fw/crypt'
import { initWP } from './src-fw/wputil'

import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import GotIt from './components-fw/Gotit.vue'
import ConfirmQuit from './components-fw/ConfirmQuit.vue'
import DialogExc from './components-fw/DialogExc.vue'

const $t = useI18n().t // Pour rendre accessible $t dans le code
const $q = useQuasar()
setTQ($t, $q)

const config = stores.config
const dataSt = stores.data
const ui = stores.ui

$q.dark.set(true)
setCss()

const wpStartable = computed(() => 
  config.permState === 'granted' && config.registration && config.sessionId)

const startWP = async () => {
  await initWP()
}

function plus1 () : void {
  dataSt.cpt++
}
function moins1 () : void {
  dataSt.cpt--
}

const echo = ref('')

const fileList = ref(null)
const defFd: fileDescr = { name: 'titi.jpg', size: 0 }
const fd = ref(defFd)
const fileType = computed(() => !fd.value ? '' :
  ( fd.value.type ? fd.value.type : ext2mime(fd.value.name || '')))

watch(fileList, async (file: any) : Promise<void> => {
  if (file) fd.value = await readFile(file, true)
})

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
    const blob = new Blob([new Uint8Array(data)], { type: fileType.value })
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

/*
const t1 = async () => {
  const appurl = window.location.origin + window.location.pathname
  const res = await postOp('TestMessage', { hashSub: config.hashSub, appurl})
  console.log('Demande notif:' + JSON.stringify(res.message))
}

const t2 = async () => {
  const appurl = window.location.origin + window.location.pathname
  const res = await postOp('TestMessage', { hashSub: config.hashSub, notifme: true, appurl })
  console.log('Demande notif:' + JSON.stringify(res.message))
}

const t3a = async () => {
  const res = await postOp('TestMessage', { hashSub: config.hashSub })
  console.log('Demande notif:' + JSON.stringify(res.message))
}

const t2b = async () => {
  const args = {
    token: config.token,
    title: 'Hello world',
    body: 'coucou'
  }
  const response = await fetch(config.K.urlsrv + 'send-notification', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  })
  const content = await response.json()
  console.log(content)
}
*/

const t3 = async () => {
  // await testECDH()
  const ps = await Crypt.strongHash('ma belle phrase', '', '$/@')
  console.log(ps)
  console.log(Crypt.sha32(ps))
  // await testSH()
}

const t1b = () => {
  config.setAppUpdated()
  // reloadPage()
  // config.callSW({ type: 'FROM_APP', arg: 'coucou'})
}

const t4 = async () => {
  const res = await new TestAuth().run()
  console.log('TestAuth:' + res)
}

</script>

<style lang="scss" scoped>
@import './css/app.scss';
.wifi { position: fixed; right: 3px; top: 3px; border-radius: 15px; }
</style>
