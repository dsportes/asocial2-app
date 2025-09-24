<template>
<div>
  <q-toolbar class="bg-primary text-white q-ma-none">
    <q-btn label="WP" size="md" @click="startWP"
      :color="config.hashSub ? 'green' : 'red'"
      :disable="!wpStartable"
    />
    <q-btn label="T1" @click="t1"/>
    <q-btn label="T2" @click="t2"/>
    <q-btn label="T4" @click="t4"/>
    <q-toolbar-title class="titre-md">{{$t('titre', [config.dataSt.cpt])}}</q-toolbar-title>
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
import { useI18n } from 'vue-i18n'

import { useConfigStore} from './stores/config-store'
import { K } from './app/constants'
import { setConfig, readFile, fileDescr } from './app/util'
import { postOp, getData, putData } from './app/net'
import { testECDH, testSH } from './app/crypt'
import { initWP } from './app/wputil'

import { Crypt } from './app/crypt'

import SettingsButton from './components/SettingsButton.vue'
import HelpButton from './components/HelpButton.vue'

const $q = useQuasar()
const config: any = useConfigStore()
const $t: Function = useI18n().t // Pour rendre accessible $t dans le code
setConfig(config, $t, $q)

const wpStartable = computed(() => config.permState === 'granted' && config.registration && config.hashSub)

const startWP = async () => {
  await initWP()
}

function plus1 () : void {
  config.dataSt.cpt++
}
function moins1 () : void {
  config.dataSt.cpt--
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

const t3 = async () => {
  // await testECDH()
  const ps = await Crypt.strongHash('ma belle phrase', '', '$/@')
  console.log(ps)
  console.log(Crypt.sha32(ps))
  // await testSH()
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
  const response = await fetch(K.urlsrv + 'send-notification', {
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

const t1b = () => {
  config.setAppUpdated()
  // reloadPage()
  // config.callSW({ type: 'FROM_APP', arg: 'coucou'})
}

const t4 = async () => {
  const res = await postOp('TestAuth', {
    authRecord: {
      sessionId : 'session789',
      devAppToken : 'bof',
      time: Date.now(),
      tokens : [
        { type: 'ADMIN', value: 'oKqMNBgdGotqrhdE9dChrJ8WY_b821OnauupPZiY5cg'},
        { type: 'TEST1', toto: 'titi'},
        { type: 'TEST2', toto: 'titi'},
      ]
    }
   })
  console.log('TestAuth:' + res.auths)
}

</script>

<style lang="scss" scoped>
@import './css/app.scss';
.wifi { position: fixed; right: 3px; top: 3px; border-radius: 15px; }
</style>
