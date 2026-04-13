<!-- Dialogue de gestion des users locaux.
Event: close
-->
<template>
<dialog-std2 v-model="model" :title="$t('HPmanusers')"  vue="ManageUsers"
  @close="emit('close', true)">
<template #hdr>
  <div>
    <div class="row q-mx-md full-width justify-end">
      <btn-cond flat size="lg" class="col-auto q-mr-md"
        :label="$t('validate') + ' (' + nbdel2 + ')'"
        :disable="nbdel2 === 0" 
        @ok="dialogs.valcf = true"/>
    </div>
    <div v-if="diag !== ''" class="col q-ml-md msg2">{{diag}}</div>
  </div>
</template>

<template #default>
<div class="q-mt-sm column items-center">
<div class="wmd full-width">
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

  <!-- Confirmation de validation -->
  <q-dialog v-model="dialogs.valcf" persistent>
    <q-card :class="sty('md') + ' column items-center q-pa-sm'">
    <q-icon class="q-my-md" name="warning" size="60px" color="negative"/>
    <div class="q-my-sm titre-lg text-bold text-center">
        {{$t('HPskull_0', [sDel ? sDel.size : 0, nbdel2])}}
      </div>
      <div class="q-my-sm titre-md text-bold text-italic text-center">
        {{$t('HPskull_1')}}
      </div>
      <div class="row full-width justify-between items-center">
        <btn-cond :label="$t('giveup')" @ok="dialogs.valcf = false"/>
        <btn-confirm :actif="nbdel2 !== 0 || (sDel && sDel.size)"
          @confirm="close"/>
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
import { ref, computed, Ref, reactive, watch } from 'vue'
import stores from '../stores/all'
import { $t, sty, edvol, dhcool } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import BarOpen from '../components-fw/BarOpen.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe

const emit = defineEmits(['close'])
const model = defineModel()
const dialogs = reactive({
  valcf: false
})
watch(model, async (v) => {
  if(v) await init()
  else emit('close', true)
})

const diag = ref('')

const init = async () => {
  const [sy, sz, sn] = await sf.synthUsers()
  synthU.value = sy
  size.value = sz
  usersNo.value = sn
  tDel2.value.clear()
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
  const l : any[] = []
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
  model.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
