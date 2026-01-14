<template>
<dialog-std2 v-model="mu" :title="$t('HPmanusers')">
<template #hdr>
  <div class="row justify-end q-px-xs q-mb-md">
    <btn-cond flat size="lg" :label="$t('validate') + ' (' + nbdel + ')'" 
      :disable="nbdel === 0" @ok="valcf"/>
  </div>
</template>

<template #default>
<div class="column items-center">
<div class="wmd">
  <div class="titre-md">{{ $t('HPmanu_1') }}</div>
  <div class="titre-md">{{ $t('HPunpin_2') }}</div>
  <div class="titre-md q-ml-md">{{ $t('HPunpin_3') }}</div>
  <div class="titre-md q-ml-md">{{ $t('HPunpin_4') }}</div>

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

</div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import HelpButton from '../components-fw/HelpButton.vue'

import stores from '../stores/all'
import type { TSession } from '../stores/safe-store'
import { $t, $q, sty, dkli, edvol, dhcool } from '../src-fw/util'

const ui = stores.ui
const sf = stores.safe

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const props = defineProps({
  idc: String
})

const mu = computed(() => ui.dModels[props.idc].manusers)

const emit = defineEmits(['close'])

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
    if (u.ck) { nx++; setS.add(s.userId) }
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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.blanc { height:100%; width:100%; background: white !important }
.select:hover { background-color: $yellow-2; color: black; }
</style>
