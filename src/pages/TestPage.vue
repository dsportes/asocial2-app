<template>
<div class="column items-center">
  <btn-cond v-if="hasBtn1" label="T1" class="q-ml-xs" @ok="t1"/>
  <btn-cond label="T2" class="q-ml-xs" @ok="t2"/>
  <btn-cond icon="add" :label="$t('plus1')" @ok="plus1"/>
  <btn-cond class="q-ml-sm" icon="remove" :label="$t('moins1')" @ok="moins1"/>
  <div class="font-mono q-pa-sm">{{echo}}</div>
  <q-file class="full-width q-ma-xs" filled v-model="fileList"
    :label="$t('pickfile')" max-file-size="50000000" max-file="1">
    <template v-slot:append>
      <btn-cond icon="upload" class="q-mr-SM" :disable="fd.size === 0" @ok="uploadFile"/>
      <btn-cond icon="download" :disable="fd.size === 0" @ok="downloadFile"/>
    </template>
  </q-file>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { saveAs } from 'file-saver'
// @ts-ignore
import ext2mime from 'ext2mime'
import { readFile, fileDescr, u8ToB64 } from '../src-fw/util'
import { SafeOperation } from '../src-fw/operation'
import { getData, putData } from '../src-fw/net'
import { Crypt, fromPem, u8ToHex, testECDH, testSH } from '../src-fw/crypt'
import BtnCond from '../components-fw/BtnCond.vue'
import stores from '../stores/all'
// import anonymousW from '../assets/anonymous_white.png'
// import anonymousB from '../assets/anonymous_black.png'
// import databaseW from '../assets/database_white.png'
// import databaseB from '../assets/database_black.png'
// import superman from '../assets/superman.jpg'
// import incognito from '../assets/incognito_blanc.svg'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const ui = stores.ui
const dataSt = stores.data
const session = stores.session

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

/* scripts de test *************************************************/
const hasBtn1 = computed(() => session.pref.obj.btn1)

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

class $Shas extends SafeOperation {
  constructor () { super('$Shas') }

  async run () {
    try {
      const inp = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const sh1 = await Crypt.strongHash(inp, true, true) as Uint8Array
      const input = u8ToB64(sh1, true)
      const shas = Crypt.shaS(sh1)
      const res = await this.post({ input })
      if (res.shaS === shas)
        console.log('ok')
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
  const ret = await new $Shas().run()
  console.log(ret.shaS)
}

const t2 = async () => {
  await testECDH()
  // await testSH()
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
  const sign2 = Crypt.signFromAsn1(signAsn1) // Pour openSSL
  const h1 = u8ToHex(sign)
  const h2 = u8ToHex(signAsn1)
  console.log('---- EC / ASN1 -------')
  console.log(h1)
  console.log(h2)
  console.log('----------------------')
  const h3 = u8ToHex(sign2)
  if (h1 === h3)
    console.log('trop cool !!!')

  console.log(u8ToB64(signAsn1))
  console.log(u8ToB64(sign))

  const v = await Crypt.verify(fromPem(pubPem, true), sign, args['x'])

  args['sign'] = signAsn1
  args['pubPem'] = pubPem
  const ret = await new Verify().run(args)
  console.log(v, ret)
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>