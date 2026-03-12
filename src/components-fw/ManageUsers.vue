<template>
<dialog-std2 v-model="me" 
  :title="$t('HPmanusers')" @close="emit('close', idc)">
<template #hdr>
  <div>
    <div class="row items-center q-mx-md full-size">
      <btn-cond flat size="lg" class="col-auto q-mr-md"
        :label="$t('validate') + ' (' + nbdel2 + ')'"
        :disable="nbdel2 === 0 || tab !== 'user'" @ok="valcf"/>
      <q-tabs v-model="tab" class="col bg-grey-9 q-mb-md" dense>
        <q-tab name="user" icon="person" :label="$t('HPmanuser')" />
        <q-tab class="text-warning bg-yellow-3" name="safe" icon="warning" :label="$t('HPdanger')" />
      </q-tabs>
    </div>
    <div v-if="diag !== ''" class="col q-ml-md msg2">{{diag}}</div>
  </div>
</template>

<template #default>
<div class="q-mt-sm column items-center">
<div class="wmd full-width">

  <div v-if="tab === 'user'">
    <bar-open passive :title="$t('HPmanu_1')" :bubbleleft="$t('HPunpin_1')"/>

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

    <div v-if="usersNo && usersNo.size">
      <div class="titre-md text-italic q-mb-xs">{{$t('HPusersN')}}</div>
      <div class="row q-gutter-sm">
        <btn-cond v-for="[u, p] in usersNo" :key="u" no-caps
          :icon="tDel2.has(u) ? 'undo' : 'delete'"
          :color="tDel2.has(u) ? 'warning' : 'primary'"
          :label="p + ' ['+ u.substring(0, 5) + ']'"
          padding="none xs" @ok="delUserNo(u)"/>
      </div>
      <q-separator class="q-mt-xs q-mb-sm"/>
    </div>

    <div class="titre-md text-italic q-mt-md q-mb-xs">{{$t('HPusersY')}}</div>
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
    <bar-open passive :title="$t('HPimpsafe_1')" :bubbleleft="$t('HPimpsafe_2')"/>
    <div class="titre-md text-italic q-mt-sm">{{$t('HPimport_label')}}</div>
    <input-ps v-model="cryptK" prefix="HPimport" size="ps"
      :validatefn="valK"/>

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
            <btn-confirm :actif="cfImp" @confirm="importBackup"/>
          </div>
        </div>
      </div>
      <div v-else>
        <div class='titre-lg q-mb-sm'>{{$t('HPsafest_3')}}</div>
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
            <btn-confirm :actif="cfImp" @confirm="importBackup"/>
          </div>
        </div>
      </div>
    </div>
    <btn-cond class="q-my-md" :label="$t('reset')"
      icon="undo" @ok="reset"/>
  </div>

  <!-- Confirmation de validation -->
  <q-dialog v-model="ui.dModels[myidc].valcf" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_0', [sDel ? sDel.size : 0, nbdel2])}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_1')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm :actif="nbdel2 !== 0 || (sDel && sDel.size)"
          @confirm="close"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Confirmation du resetAll -->
  <q-dialog v-model="ui.dModels[myidc].resetAll" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
      <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
      <div class="q-my-md titre-lg text-bold text-italic text-center">{{$t('HPskull')}}</div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="ui.fD()"/>
        <btn-confirm actif @confirm="resetAllLocal"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Changement des codes du backup-->
  <safe-cr :idc="myidc" @done="chgCodes" :mode="2"/>

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
// import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import InputPs from '../components-fw/InputPs.vue'
import P0P1 from '../components-fw/P0P1.vue'
import SafeCr from '../components-fw/SafeCr.vue'

import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { SafeOperation } from '../src-fw/operation'
import { $t, sty, edvol, dhcool, u8ToB64, readFile, fileDescr, coolBye } from '../src-fw/util'

const ui = stores.ui
const sf = stores.safe

const props = defineProps({
  idc: String
})
const myidc = ui.getIdc('ManagedUsers', props.idc)
onUnmounted(() => ui.closeVue(myidc))
const emit = defineEmits(['close', 'done'])
const me = computed(() => ui.dModels[props.idc].manusers)
watch(() => me.value, async (v: boolean) => { 
  if (v) await init(); else { cleanup(); emit('close', myidc) } })

const init = async () => {
  const [sy, sz, sn] = await sf.synthUsers()
  synthU.value = sy
  size.value = sz
  usersNo.value = sn
  tDel2.value.clear()
}
const cleanup = () => {}

const tab = ref('user')

const resetAllLocal = async () => {
  await sf.resetAllLocal()
  coolBye()
}

const valcf = () => {
  ui.oD(myidc, 'valcf')
}

const size: Ref<number[]> = ref(0)
const nbc = computed(() => size.value ? size.value.length : 0 )
const synthU = ref(0)
const usersNo: Ref<Map<string, string>> = ref()

const delSize: Ref<number[]> = ref(new Array(nbc.value).fill(0))

const nbdel = ref(0)
const sDel = ref()
const tDel = ref()
const tDel2 = ref(new Set())

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

const nbdel2 = computed(() => nbdel.value + tDel2.value.size )

const delUserNo = (u) => {
  if (tDel2.value.has(u)) tDel2.value.delete(u)
  else tDel2.value.add(u)
}

const close = async () => {
  const l = []
  const allSessions = await sf.getAllSessions()
  if (sDel.value && sDel.value.size)
    for(const id of sDel.value) {
      const s = allSessions.get(id)
      if (s) l.push(s)
    }
  if (l.length) await sf.delTSession(l)
  if (tDel.value && tDel.value.size)
    for(const id of tDel.value) await sf.delTrusting(id)
  if (tDel2.value && tDel2.value.size)
    for(const id of tDel2.value) await sf.delTrusting(id)
  ui.fD()
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.q-toolbar__title { font-size: medium !important;}
.blanc { height:100%; width:100%; background: white !important }
.select:hover { background-color: $yellow-2; color: black; }
.bord { border: 1px solid $warning; border-radius: 7px; }
</style>
