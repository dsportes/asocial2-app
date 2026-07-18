<template>
<div class="column items-center">
  <btn-cond label="T0A" class="q-ml-xs" @ok="t0a"/>
  <btn-cond label="T0B" class="q-ml-xs" @ok="t0b"/>
  <btn-cond v-if="hasBtn1" label="T1" class="q-ml-xs" @ok="t1"/>
  <btn-cond label="T2" class="q-ml-xs" @ok="t2"/>
  <btn-cond label="TCAS" class="q-ml-xs" @ok="tcas"/>
  <btn-cond label="TCASLIST" class="q-ml-xs" @ok="tclist"/>
  <btn-cond label="SelCode" class="q-ml-xs" @ok="dialogs.selCode = true"/>
  <btn-cond icon="add" :label="$t('plus1')" @ok="plus1"/>
  <btn-cond class="q-ml-sm" icon="remove" :label="$t('moins1')" @ok="moins1"/>
  <div class="font-mono q-pa-sm">{{echo}}</div>
  <div>{{ doc1.nom }}</div>
  <q-file class="full-width q-ma-xs" filled v-model="fileList"
    :label="$t('pickfile')" max-file-size="50000000" max-file="1">
    <template v-slot:append>
      <btn-cond icon="upload" class="q-mr-SM" :disable="fd.size === 0" @ok="uploadFile"/>
      <btn-cond icon="download" :disable="fd.size === 0" @ok="downloadFile"/>
    </template>
  </q-file>

  <select-code v-model="dialogs.selCode" :values="selValues"
    title="Selection fleur"
    @select="selC" @close="selC('RIEN')" />
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
import { readFile, fileDescr } from '../src-fw/util'
import { $Document } from '../src-fw/registry'
import { keyToB64 } from '../src-fw/b64'
import { SafeOperation, Operation } from '../src-fw/operation'
import { getData, putData } from '../src-fw/net'
import { Crypt, fromPem, u8ToHex, testECDH, testSH } from '../src-fw/crypt'
import BtnCond from '../components-fw/BtnCond.vue'
import SelectCode from '../dialogs-fw/SelectCode.vue'
import stores from '../stores/all'
import { IDocStore, getStore } from '../stores/docs'

const as2org1: IDocStore = getStore('as2', 'org1')
const as2org2: IDocStore = getStore('as2', 'org2')
const assoorg3: IDocStore = getStore('asso', 'org3')

// @ts-expect-error
as2org1.set('Auteur', 'pko', { nom: 'toto'})
// @ts-expect-error
as2org1.set('Auteur', 'pki', { nom: 'titi'})
// @ts-expect-error
as2org2.set('Auteur', 'pku', { nom: 'tutu'})
// @ts-expect-error
assoorg3.set('Asso', 'pka', { nom: 'tata'})

// @ts-expect-error
console.log(as2org1.get('Auteur', 'pki').nom)

const doc1 = ref(as2org1.get('Auteur', 'pki'))

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const ui = stores.ui
const dataSt = stores.data
const session = stores.session

const t0a = () => {
  doc1.value.nom = 'tada'
}
const t0b = () => {
  as2org1.del()
}


const dialogs = reactive({
  selCode: false
})

/* scripts de test *************************************************/
const hasBtn1 = computed(() => session.pref.obj.btn1)

const selValues = ref([])
for (let i = 0; i < 10; i++)
  for(const x of ['rose', 'lilas', 'JASmin', 'tuLIPe'])
    selValues.value.push(x + '_' + i)

function plus1 () : void { dataSt.setCpt(dataSt.cpt + 1)}
function moins1 () : void { dataSt.setCpt(dataSt.cpt - 1)}

function selC (c) { console.log('Selected:', c) }
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
  } catch (e: any) {
    echo.value = 'err:' + (e.code || '???')
  }
}

async function uploadFile () : Promise<void> {
  await getPutUrl(false)
  if (echo.value) try {
    await putData(echo.value, fd.value.u8)
  } catch (e: any) {
    echo.value = 'err:' + (e.code || '???')
  }
}

/* Test shaS en PHP */
const t1 = async () => {
  const $Shas = new SafeOperation('$Shas', 'http://localhost:8888')
  try {
    const inp = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const sh1 = await Crypt.strongHash(inp, true, true) as Uint8Array
    const input = keyToB64(sh1)
    const shas = Crypt.shaS(sh1)
    $Shas.args.input = input
    const res = await $Shas.post()
    if (res.shaS === shas)
      console.log('ok')
  } catch(e: any) {
    $Shas.ko(e)
  }
}

const t2 = async () => {
  await testECDH()
  // await testSH()
}

/* Test $Verify en PHP */
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

  console.log(keyToB64(signAsn1))
  console.log(keyToB64(sign))

  const v = await Crypt.verify(fromPem(pubPem), sign, args['x'])

  args['sign'] = signAsn1
  args['pubPem'] = pubPem
  const verify = new SafeOperation('$Verify', 'http://localhost:8888')
  verify.args = args
  const ret = await verify.post()
  console.log(v, ret)
}

const tcas = async () => {
  const op = new Operation('Case2Test', 'AS2', 'doda')
  try {
    await op.post()
  } catch (e) {
    op.ko(e)
  }
}
const tclist = async () => {
  const op = new Operation('Case2List', 'AS2', 'doda')
  try {
    const res = await op.post()
    console.log(res.list)
  } catch (e) {
    op.ko(e)
  }
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
