<template>
<q-layout view="hHh lpR fFf">
  <q-header>
    <safe-header v-if="ui.page==='home'"/>

    <q-toolbar v-else class="full-width tbp">
      <about-session/>
      <!--q-img :src="incognito" class="bg-primary" @click="beep(mybeep)"
        style="height: 30px; max-width: 30px;"/-->
      <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
        <q-tooltip>{{session.sessionInfo}}</q-tooltip>
      </btn-cond>
      <btn-cond class="q-ml-xs" icon="home" color="warning" @ok="backToOpenSession"/>

      <btn-cond label="Home" class="q-ml-xs" @ok="ui.setPage('home')"/>

      <btn-cond label="T1" class="q-ml-xs" @ok="t1"/>

      <btn-cond label="T2" class="q-ml-xs" @ok="t2"/>

      <q-toolbar-title class="titre-md q-mx-md">{{$t('titre', [dataSt.cpt])}}</q-toolbar-title>

      <btn-cond icon="add" :label="$t('plus1')" @ok="plus1"/>

      <btn-cond class="q-ml-sm" icon="remove" :label="$t('moins1')" @ok="moins1"/>

      <settings-button class="q-ml-sm"/>

      <help-button class="q-ml-xs" page="DOCpg"/>
    </q-toolbar>
  </q-header>

  <q-page-container class="font-def">
    <transition name="anim1">
      <q-page v-if="ui.page === 'home'"><safe-page/></q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'appHome'">

        <div class="font-mono q-pa-sm">{{echo}}</div>
        <q-file class="full-width q-ma-xs" filled v-model="fileList"
          :label="$t('pickfile')" max-file-size="50000000" max-file="1">
          <template v-slot:append>
            <btn-cond icon="upload" class="q-mr-SM" :disable="fd.size === 0" @ok="uploadFile"/>
            <btn-cond icon="download" :disable="fd.size === 0" @ok="downloadFile"/>
          </template>
        </q-file>
      </q-page>
    </transition>
    <transition name="anim1">
      <q-page v-if="ui.page === 'test2'">
        <div class="column full-width">
          Page test 2
          <btn-cond label="Go Home" @ok="ui.setPage('home')"/>
        </div>
      </q-page>
    </transition>
  </q-page-container>

  <got-it v-if="ui.dModels['0'].diag"/>
  <confirm-quit v-if="ui.dModels['0'].confirmQuit"/>
  <dialog-exc v-if="ui.dModels['0'].dialogExc"/>
  <dialog-help v-if="ui.dModels['0'].dialogHelp"/>

</q-layout>
</template>

<script setup lang="ts">
// @ts-ignore
import ext2mime from 'ext2mime'
// @ts-ignore
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { useQuasar } from 'quasar'

import stores from './stores/all'
// @ts-ignore
import incognito from './assets/incognito_blanc.svg'

import { set$t, readFile, fileDescr, beep, b64ToU8, u8ToB64 } from './src-fw/util'
import { TestAuth } from './src-fw/operations'
import { Operation, SafeOperation } from './src-fw/operation'
import { getData, putData } from './src-fw/net'
import { Crypt, toPem, fromPem, u8ToHex, arrayBuffertohex, hexToArrayBuffer, testECDH, testSH } from './src-fw/crypt'
import { testCred } from './src-fw/credential'

import SafePage from './pages/SafePage.vue'
import SafeHeader from './pages/SafeHeader.vue'

import AboutSession from './components-fw/AboutSession.vue'
import SettingsButton from './components-fw/SettingsButton.vue'
import HelpButton from './components-fw/HelpButton.vue'
import BtnCond from './components-fw/BtnCond.vue'
import GotIt from './components-fw/GotIt.vue'
import ConfirmQuit from './components-fw/ConfirmQuit.vue'
import DialogExc from './components-fw/DialogExc.vue'
import DialogHelp from './components-fw/DialogHelp.vue'
import { Help } from './src-fw/help'
// @ts-ignore
import mybeep from './assets/beep.mp3?inline'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// import { initWP } from './src-fw/wputil'

// testCred()

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const config = stores.config
const session = stores.session
const dataSt = stores.data
const ui = stores.ui
const sf = stores.safe

const $t = useI18n().t // Pour rendre accessible $t dans le code
const $q = useQuasar()
set$t($t)
ui.set$t$q($t, $q)

onMounted(async () => { // Sur onMounted parce que async
  // await testECDH()
  // await testSH()
  await session.setRegistration(b64ToU8(config.K.vapidPublicKey), config.location, config.K.APPNAME)
})

ui.setScreenWH($q.screen.width, $q.screen.height)
watchEffect(() => {
  ui.setScreenWH($q.screen.width, $q.screen.height)
})

const backToOpenSession = async () => {
  const ok = await ui.diagDisplay($t('HPbackopen'), true)
  if (ok)
    ui.backToOpenSession()
}

/* scripts de test *************************************************/

function plus1 () : void { dataSt.setCpt(dataSt.cpt + 1)}
function moins1 () : void { dataSt.setCpt(dataSt.cpt - 1)}

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
  /*
  try {
    const res = await postOp('GetPutUrl', { id1: 'toto', id2: 'tata', id3: fd.value.name, put: put })
    echo.value = res['url']
  } catch (e) {
    echo.value = ''
  }
  */
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

const t4x = async () => {
  const res = await new TestAuth().run('demo')
  console.log('TestAuth:' + res)
}

class EchoPHP extends SafeOperation {
  constructor () { super('$EchoText') }

  async run (data) {
    try {
      SafeOperation.setSafeUrl('http://localhost:8888')
      const res = await this.post(data)
      return res
    } catch(e) {
      this.ko(e)
    }
  }
}

class Hash extends SafeOperation {
  constructor () { super('$Hash') }

  async run (data) {
    try {
      SafeOperation.setSafeUrl('http://localhost:8888')
      const res = await this.post(data)
      return res
    } catch(e) {
      this.ko(e)
    }
  }
}

class Verify extends SafeOperation {
  constructor () { super('$Verify') }

  async run (data) {
    try {
      SafeOperation.setSafeUrl('http://localhost:8888')
      const res = await this.post(data)
      return res
    } catch(e) {
      this.ko(e)
    }
  }
}

const t1 = async () => {
  const data = {
    'key1': 'value1',
    'key2': 2
  }
  const ret = await new EchoPHP().run(data)
  console.log(JSON.stringify(ret['echo']))
}

const t2h = async () => {
  const args = {
    bin: Crypt.random(32)
  }
  const sha = Crypt.sha(args.bin, false)
  const shaS = Crypt.shaS(args.bin)
  const ret = await new Hash().run(args)
  console.log(shaS + '\n' + ret['shaS'] + '\n' + sha + '\n' + ret['sha'])
}

const t2 = async () => {
  await testECDH()
}

const t2sv = async () => {
  // rsa.KJUR.crypto.ECDSA.concatSigToASN1Sig()
  const x = 'toto est tres tres beau'
  const args = {
    x: encoder.encode(x)
  }
  const privPem = `-----BEGIN PRIVATE KEY-----
MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIAqJmA2j3axukNE3LT
7aJB16W6RHWYpMW0RoT3F+Yrb3Yb5JQmApUTVDHkkZFWq+cAcRRoj99OdIQQw1PJ
txLhplWhgYkDgYYABABmTTVrJdbm3nYdkRA0aMoby0tFd94bxsJadHrAZM7PLDLG
uCU1QHNV7qMvAmtTQSxhIt6feTpVypgsz/0yP+mrbwF5FBPE/N6vgfL9GKzfMUG7
mESBKpy98Xt2a9dCacc13uvqaMhvSrlZNQQpllyiysxrpJjC7enPbOlTeatEoKO5
zA==
-----END PRIVATE KEY-----`

  const pubPem = `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQAZk01ayXW5t52HZEQNGjKG8tLRXfe
G8bCWnR6wGTOzywyxrglNUBzVe6jLwJrU0EsYSLen3k6VcqYLM/9Mj/pq28BeRQT
xPzer4Hy/Ris3zFBu5hEgSqcvfF7dmvXQmnHNd7r6mjIb0q5WTUEKZZcosrMa6SY
wu3pz2zpU3mrRKCjucw=
-----END PUBLIC KEY-----`

  const sign = await Crypt.sign(fromPem(privPem), args['x'])
  const signAsn1 = Crypt.signToAsn1(sign) // Pour openSSL

  console.log(u8ToB64(signAsn1))
  console.log(u8ToB64(sign))

  const v = await Crypt.verify(fromPem(pubPem, true), sign, args['x'])

  args.sign = signAsn1
  args.pubPem = pubPem
  const ret = await new Verify().run(args)
  console.log(v, ret)
}

</script>

<style lang="scss" scoped>
@import './css/app.scss';
.wifi { position: fixed; right: 3px; top: 3px; border-radius: 15px; }

.anim1-enter-active { transition: all 0.3s;}
.anim1-leave-active { transition: all 0.3s;}
.anim1-enter-from { opacity:0; transform: translateX(50%);}
.anim1-leave-to { opacity:0; transform: translateX(-50%);}
</style>
