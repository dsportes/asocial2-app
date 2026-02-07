<template>
<dialog-std2 v-model="mu" :title="$t('HPmanusers')">
<template #hdr>
  <div class="row q-px-xs q-mb-md" style="min-height:3rem">
    <btn-cond v-if="tab === 'user'" flat size="lg" class="col-auto" 
      :label="$t('validate') + ' (' + nbdel + ')'" 
      :disable="nbdel === 0" @ok="valcf"/>
    <div v-if="diag !== ''" class="col q-ml-md msg2">{{diag}}</div>
  </div>
</template>

<template #default>
<div class="column items-center">
<div class="wmd full-width">
  <q-tabs v-model="tab" class="bg-grey-9 q-mb-md" dense>
    <q-tab name="user" icon="person" :label="$t('HPmanuser')" />
    <q-tab class="text-warning bg-yellow-3" name="safe" icon="warning" :label="$t('HPdanger')" />
  </q-tabs>

  <div v-if="tab === 'user'">
    <bar-open1 :title="$t('HPmanu_1')" :bubble="$t('HPunpin_1')"/>

    <q-separator class="q-mt-xs q-mb-sm"/>

    <div class="colum wsm justify-center">
      <div class="row titre-md text-italic q-my-sm">
        <div class="col-6 text-center">{{$t('HPsize_1')}}</div>
        <div class="col-6 text-center">{{$t('HPsize_2')}}</div>
      </div>
      <div v-for="i in nbc" :key="i" class="row font-mono">
        <div class="col-6 text-center">{{edvol(size[i-1])}}</div>
        <div class="col-6 text-center">{{edvol(delSize[i-1])}}</div>
      </div>
    </div>

    <q-separator class="q-mt-xs q-mb-sm"/>

    <div v-for="[id, u] of synthU" :key="u.id">
      <div class="row font-mono fs-md items-start bg-primary q-mt-md">
        <div class="col-9 q-pr-xs">{{u.pseudo}}</div>
        <div class="col-2 column justify-center">
          <div v-for="i in nbc">{{edvol(u.size[i-1])}}</div>
        </div>
        <q-checkbox class="col-1" dense size="md" v-model="u.ck"
          @click="cku(u)"/>
      </div>
      <div v-for="[id, a] of u.ma" :key="a.app">
        <div class="row font-mono fs-md items-start bg-secondary q-mt-sm">
          <div class="col-1"></div>
          <div class="col-8 q-pr-xs">{{a.app}}</div>
          <div class="col-2 column justify-center">
            <div v-for="i in nbc">{{edvol(a.size[i-1])}}</div>
          </div>
          <q-checkbox class="col-1" dense size="md" v-model="a.ck"
            @click="cka(a)"/>
        </div>
        <div v-for="[id, s] of a.ms" :key="s.id">
          <div class="row font-mono fs-md items-start q-my-xs">
            <div class="col-2"></div>
            <div class="col-7 q-pr-xs column">
              <div>{{s.about}}</div>
              <div class="q-ml-lg text-italic">{{dhcool(s.time)}}</div>
            </div>
            <div class="col-2 column justify-center">
              <div v-for="i in nbc">{{edvol(a.size[i-1])}}</div>
            </div>
            <q-checkbox class="col-1" dense size="md" v-model="s.ck"
              @click="cks(s)"/>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'safe'" class="full-width">
    <bar-open1 :title="$t('HPimpsafe_1')" :bubble="$t('HPimpsafe_2')"/>
    <div class="titre-md text-italic q-mt-sm">{{$t('HPimport_p')}}</div>
    <input-ps v-model="cryptK" iconcheck
      :sz="[4, 32]" :label="$t('HPimport_p')" :ph="$t('HPimport_ph')" 
      :validate="valK"/>

    <q-file v-if="cryptK.key !== null"
      class="q-my-md full-width" dense filled v-model="fileList"
      :label="$t('pickfile')" max-file-size="50000000" max-file="1"/>

    <div v-if="safe !== null" class="full-width">
      <div class="titre-md text-italic">{{$t('HPimpsafe_3')}}</div>
      <p0-p1 @ok="authPS"/>
    </div>

    <div v-if="statusSafe" class="q-my-sm bord q-pa-sm">
      <div v-if="statusSafe.lm !== -1">
        <div class='titre-lg q-mb-sm'>{{$t('HPsafest_1')}}</div>
        <bar-open1 class="q-my-sm" :title="$t('HPsafest_6')" :bubble="$t('HPsafest_7')"
          icon="open_in_new" :fnopen="openChgCodes"/>
        <div v-if="safe.lm < statusSafe.lm" class='q-ml-sm titre-md'>
          {{$t('HPsafest_2gt', [dhcool(statusSafe.lm*1000), dhcool(safe.lm*1000)])}}
        </div>
        <div v-if="safe.lm > statusSafe.lm" class='q-ml-sm titre-md'>
          {{$t('HPsafest_2lt', [dhcool(statusSafe.lm*1000), dhcool(safe.lm*1000)])}}
        </div>
        <div v-if="safe.lm === statusSafe.lm" class='q-ml-sm titre-md'>
          {{$t('HPsafest_2eq', [dhcool(statusSafe.lm*1000)])}}
        </div>
        <div v-if="!statusSafe.xp" class='q-ml-sm titre-md msg2'>
          {{$t('HPsafest_5p')}}
        </div>
        <div v-if="!statusSafe.xr" class='q-ml-sm titre-md msg2'>
          {{$t('HPsafest_5r')}}
        </div>
        <div v-if="!statusSafe.xr || !statusSafe.xp">
          <div class='q-ml-sm titre-lg msg2'>{{$t('HPsafest_5a')}}</div>
        </div>
        <div v-else>
          <div class="column items-center q-gutter-sm q-my-sm">
            <btn-cond :label="$t('HPsafest_r')" @ok="cfImp = true"/>
            <btn-confirm :actif="cfImp" :confirm="importBackup"/>
          </div>
        </div>
      </div>
      <div v-else>
        <div class='titre-lg q-mb-sm'>{{$t('HPsafest_3')}}</div>
        <bar-open1 class="q-my-sm" :title="$t('HPsafest_6')" :bubble="$t('HPsafest_7')"
          icon="open_in_new" :fnopen="openChgCodes"/>
        <div v-if="!statusSafe.xp" class='q-ml-sm titre-md msg2'>
          {{$t('HPsafest_5p')}}
        </div>
        <div v-if="!statusSafe.xr" class='q-ml-sm titre-md msg2'>
          {{$t('HPsafest_5r')}}
        </div>
        <div v-if="!statusSafe.xr || !statusSafe.xp">
          <div class='q-ml-sm titre-lg msg2'>{{$t('HPsafest_5b')}}</div>
        </div>
        <div v-else>
          <div class="column items-center q-gutter-sm q-my-sm">
            <btn-cond :label="$t('HPsafest_i')" @ok="cfImp = true"/>
            <btn-confirm :actif="cfImp" :confirm="importBackup"/>
          </div>
        </div>
      </div>
    </div>
    <btn-cond class="q-my-md" :label="$t('reset')" 
      icon="undo" @ok="reset"/>
  </div>

  <!-- Confirmation de validation -->
  <q-dialog v-model="ui.dModels[idc].valcf" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_0', [sDel.size, tDel.size])}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_1')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm :actif="nbdel !== 0" :confirm="close"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Confirmation du resetAll -->
  <q-dialog v-model="ui.dModels[idc].resetAll" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
      <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
      <div class="q-my-md titre-lg text-bold text-italic text-center">{{$t('HPskull')}}</div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm actif :confirm="resetAllLocal"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Changement des codes du backup-->
  <safe-cr v-if="sc" :idc="idc" :onValidate="chgCodes" :mode="2"/>

</div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, Ref, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
import { decode } from '@msgpack/msgpack'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'
import InputPs from '../components-fw/InputPs.vue'
import P0P1 from '../components-fw/P0P1.vue'
import SafeCr from '../components-fw/SafeCr.vue'

import stores from '../stores/all'
import type { TSession } from '../stores/safe-store'
import { Crypt } from '../src-fw/crypt'
import { SafeOperation } from '../src-fw/operation'
import { $t, sty, edvol, dhcool, u8ToB64, readFile, fileDescr, coolBye } from '../src-fw/util'

const ui = stores.ui
const sf = stores.safe

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const sc = computed(() => ui.dModels[idc].createsafe)

const props = defineProps({
  idc: String
})

const mu = computed(() => ui.dModels[props.idc].manusers)

const emit = defineEmits(['close'])

const tab = ref('user')

watch(tab, (v) => {
  if (v === 'safe') reset()
})

const opCfReset = () => {
  ui.oD(idc, 'resetAll')
}

const resetAllLocal = async () => {
  await sf.resetAllLocal()
  coolBye()
}

const valcf = () => {
  ui.oD(idc, 'valcf')
}

const [sy, sz] = sf.synthUsers()
const size: Ref<number[]> = ref(sz)
const nbc = computed(() => size.value.length )
const synthU = ref(sy)

const delSize: Ref<number[]> = ref(new Array(nbc.value).fill(0))

const nbdel = ref(0)
const sDel = ref()
const tDel = ref()

const cku = (u) => {
  for(const [,a] of u.ma) {
    a.ck = u.ck
    for(const [,s] of a.ms) s.ck = u.ck
  }
  recalc()
}

const cka = (a) => {
  for(const [,s] of a.ms) s.ck = a.ck
  recalc()
}

const cks = (s) => {
  recalc()
}

const recalc = () => {
  let nx = 0
  const setS = new Set()
  const setT = new Set()
  delSize.value.fill(0)
  for(const [,u] of synthU.value) {
    if (u.ck) { nx++; setS.add(u.userId) }
    for(const [,a] of u.ma) {
      if (a.ck) nx++
      for(const [,s] of a.ms) {
        if (s.ck) {
          nx++
          setS.add(s.id)
          for(let i = 0; i < nbc.value; i++) delSize.value[i] += s.size[i]
        }
      }
    }
  }
  nbdel.value = nx
  sDel.value = setS
  tDel.value = setT
}

const close = async () => {
  const l = []
  for(const id of sDel.value) {
    const s = sf.tsessions.get(id)
    if (s && s.hasCache) l.push(id)
  }
  if (l.length) await sf.purgeIDBS(l)
  for(const id of sDel.value) await sf.delTSession(null, id)
  for(const id of tDel.value) await sf.delTrusting(id)
  ui.fD()
  emit('close', null)
}

const fileList = ref(null)
const fd = ref({ name: '', size: 0 })
const cryptK = reactive( { inp: '', err: '', key: null } )
const diag = ref('')
const bin = ref(null)
const safe = ref(null)
const statusSafe = ref(null)
const cfImp = ref(false)
const keyK = ref(null)

const reset = () => {
  fileList.value = null
  fd.value = { name: '', size: 0 }
  cryptK.inp = ''; cryptK.err = ''; cryptK.key = null
  diag.value = ''
  bin.value = null
  safe.value = null
  cfImp.value = false
  keyK.value = null
  statusSafe.value = null
}

const valK = async () => {
  if (cryptK.err === '') cryptK.key = await Crypt.strongHash(cryptK.inp, true, true)
  else cryptK.key = null
}

watch(fileList, async (file: any) : Promise<void> => {
  if (file) await downloadFile(await readFile(file, true))
})

const downloadFile = async (f) => {
  try {
    bin.value = await Crypt.decrypt(cryptK.key, f.u8)
    safe.value = decode(bin.value)
  } catch (e) {
    bin.value = null
    safe.value = null
    diag.value = $t('HPimport_bf2')
  }
  fileList.value = null
}

const authPS = async (args) => {
  const _id = safe.value.id
  const _hp0 = safe.value.hp0
  const _Ka = safe.value.Ka
  const _hr0 = safe.value.hr0
  const sh = args.sh
  const sh0 = args.sh0
  const hp0 = u8ToB64(sh0, true)
  const _hhp1 = safe.value.hhp1
  const sh1 = args.sh1
  const hhp1 = Crypt.shaS(sh1)
  diag.value = (_hp0 !== hp0 || _hhp1 !== hhp1)  ? $t('HPimpsafe_4') : ''
  if (!diag.value) {
    keyK.value = await Crypt.decrypt(sh, _Ka)
    await getStatus(_id, _hp0, _hr0)
  }
}

const getStatus = async (id, hp0, hr0) => {
  cfImp.value = false
  const op = new SafeOperation('$StatusSafe')
  try {
    const ret = await op.post({ id, hp0, hr0 })
    statusSafe.value = ret.statusSafe
    // statusSafe.value = { lm: -1, xp: false, xr: false }
  } catch (e) {
    op.ko(e)
  }
  console.log('status : ' + JSON.stringify(statusSafe.value))
}

const importBackup = async () => {
  console.log('importBackup')
  const op = new SafeOperation('$RestoreSafe')
  let ret
  try {
    ret = await op.post({ safe: safe.value })
    await ui.diagDisplay($t('HPcsret_2' + ret.status))
    reset()
  } catch (e) {
    op.ko(e)
    return -1
  }
}

const openChgCodes = () => {
  ui.oD(idc, 'createsafe')
}

const chgCodes = async (arg) => {
  console.log('chgCodes')
  // const arg = cash0: ca.sh0, cash1: ca.sh1, cash: ca.sh, crsh0: cr.sh0, crsh1: cr.sh1, crsh: cr.sh
  /*
    hp0: u8ToB64(psh0, true),
    hr0: u8ToB64(rsh0, true),
    hhp1: Crypt.shaS(psh1),
    hhr1: Crypt.shaS(rsh1),
    Ka: await Crypt.crypt(psh, keyK.value),
    Kr: await Crypt.crypt(rsh, keyK.value)
  */
  const s = safe.value
  s.hp0 = u8ToB64(arg.cash0, true)
  s.hr0 = u8ToB64(arg.crsh0, true)
  s.hhp1 = Crypt.shaS(arg.cash1)
  s.hhr1 = Crypt.shaS(arg.crsh1)
  s.Ka = await Crypt.crypt(arg.cash, keyK.value)
  s.Kr = await Crypt.crypt(arg.crsh, keyK.value)
  await getStatus(s.id, s.hp0, s.hr0)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.blanc { height:100%; width:100%; background: white !important }
.select:hover { background-color: $yellow-2; color: black; }
.bord { border: 1px solid $warning; border-radius: 7px; }
</style>
