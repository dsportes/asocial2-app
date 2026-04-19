<!-- Dialogue de création d'un safe / changement des alias et phrases
Events: close done
-->
<template>
<dialog-std2 v-model="model" :title="$t('UAPtit_' + mode)" vue="SafeCr"
  @close="dialogs.close = true">
<template #hdr>
  <div class="row justify-between q-px-xs q-mb-md items-center">
    <div :class="'col titre-md ' + (diag === 0 || diag === 5 ? 'text-italic' : 'msg')">
      {{ $t('UAPdiag_' + diag) }}</div>
    <btn-cond flat size="lg" icon="check" class="col-auto self-end"
      :label="$t('validate')"
      :disable="enabled" @ok="validate"/>
  </div>

  <div v-if="mode === 'a' || mode === 'u'" class="column">
    <div class="q-mb-sm titre-md text-italic">{{ $t('UAPl_a', aliases.length) }}</div>
    <div v-for="a in aliases" class="row q-ml-lg">
      <btn-cond v-if="!a.del" icon="delete" color="warning" @ok="a.del = true"/>
      <btn-cond v-if="a.del" icon="undo" color="primary" @ok="a.del = false"/>
      <div :class="'q-mr-md ' + (a.del ? 'text-strike ' : '') + (a.ac ? '' : 'text-bold text-warning')">
        {{ a.txt }}</div>
    </div>
  </div>

  <div v-if="mode === 'p' || mode === 'u'" class="column">
    <div class="q-mb-sm titre-md text-italic">{{ $t('UAPl_p', phrases.length) }}</div>
    <div v-for="p in phrases" class="row q-ml-lg">
      <btn-cond v-if="!p.del" icon="delete" color="warning" @ok="p.del = true"/>
      <btn-cond v-if="p.del" icon="undo" color="primary" @ok="p.del = false"/>
      <div :class="'q-mr-md ' + (p.del ? 'text-strike ' : '') + (p.ac ? '' : 'text-bold text-warning')">
        {{ p.txt || p.hsh}}</div>
    </div>
  </div>
</template>

<template #default>
<div class="column items-center">
  <q-list style="width:30rem !important" bordered class="rounded-borders">
    <q-expansion-item expand-separator v-model="expandA"
      :label="$t('UAPa_a')">
      <q-card>
        <q-card-section>
          <div class="titre-md text-bold text-italic">
            {{$t(initA ? 'UAPv_a' : 'UAPs_a')}}</div>
          <input-b v-model="entry" size="alias" prefix="Alias"
            @validate="valA"/>
          <div v-if="!initA && !freeA" class="msg">{{ $t('UAPm1_a') }}</div>
          <div v-if="initA && errVA">
            <div class="msg">{{ $t('UAPm3_a') }}</div>
            <btn-cond flat color="primary" :label="$t('UAPc_a')"
              @ok="correcA"/>
          </div>
          <btn-cond flat color="warning" :label="$t('UAPt_a')"
            @ok="termA"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item expand-separator v-model="expandP"
      :label="$t('UAPa_a')">
      <q-card>
        <q-card-section>
          <div class="titre-md text-bold text-italic">
            {{$t(initP ? 'UAPv_p' : 'UAPs_p')}}</div>
          <input-b v-model="entry" size="p1" prefix="Phrase"
            @validate="valP"/>
          <div v-if="initP && errVP">
            <div class="msg">{{ $t('UAPm3_a') }}</div>
            <btn-cond flat color="primary" :label="$t('UAPc_a')"
              @ok="correcP"/>
          </div>
          <btn-cond flat color="warning" :label="$t('UAPt_p')"
            @ok="termP"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>

  </q-list>
</div>
</template>
</dialog-std2>
  <choose-it v-model="dialogs.close"
    prefix="UAPquit" options="pw"
    @giveup="chooseBack(0)"
    @option="chooseBack"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, watch, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

import BtnCond from '../components-fw/BtnCond.vue'

import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const props = defineProps ({
  mode: String // u: nouvel user, a: chagt alias, p: chgt phrase
})

const dialogs = reactive({
  close: false
})

const chooseBack = (n) => {
  dialogs.close = false
  if (!n) { model.value = false; emit('close', true) }
}

type al = {
  txt: string
  ac: boolean // si actuel
  del: boolean // si deleted
  hsh?: string
}

const entry = reactive({ inp: '', err: '' })

const aliases : Ref<al[]> = reactive([])
const expandA = ref(false)
const freeA = ref(false)
const errVA = ref(false)
const initA = ref('')

const resetA = () => {
  entry.inp = ''
  entry.err = ''
  initA.value = ''
  freeA.value = false
  errVA.value = false
}
watch(expandA, (v) => { resetA() })

const phrases : Ref<al[]> = reactive([])
const expandP = ref(false)
const errVP = ref(false)
const initP = ref('')
const hshP = ref('')

const resetP = () => {
  entry.inp = ''
  entry.err = ''
  initP.value = ''
  hshP.value = ''
  errVP.value = false
}
watch(expandP, (v) => { resetP() })

const init = () => {
  if (props.mode === 'a' || props.mode === 'u') {
    aliases.lenth = 0
    aliases.push({txt: sf.auth.actual.a1K, ac: true, del: false })
    if (sf.auth.actual.a2K)
      aliases.push({txt: sf.auth.actual.a2K, ac: true, del: false })
    resetA()
  }
  if (props.mode === 'p' || props.mode === 'u') {
    phrases.lenth = 0
    phrases.push({txt: '', ac: true, del: false, hsh: sf.auth.hshp1 })
    if (sf.auth.hshp2)
      aliases.push({txt: '', ac: true, del: false, hsh: sf.auth.hshp2 })
    resetP()
  }
}

const valA = async () => {
  if (!initA.value) {
    let a = null
    for(const x in aliases) if (x['txt'] === entry.inp) a = x
    if (a) {
      a.del = false
      resetA()
      expandA.value = false
      await ui.diagDisplay($t('UAPdup_a'))
      return
    }
    freeA.value = await sf.mdUserFree(entry.inp)
    if (freeA.value === -1) {
      resetA()
      expandA.value = false
      return
    }
    if (freeA.value) {
      initA.value = entry.inp
      errVA.value = false
    }
  } else { // vérification
    if (initA.value === entry.inp) { // OK
      aliases.push({ txt: initA.value, ac: false, del: false })
      resetA()
      expandA.value = false
      return
    }
    errVA.value = true
  }
}

const termA = () => {
  resetA()
  expandA.value = false
}

const correcA = () => {
  entry.inp = initA.value
  entry.err = ''
  initA.value = ''
  freeA.value = false
  errVA.value = false
}

const valP = async () => {
  if (!initP.value) {
    hshP.value = Crypt.shaS(await Crypt.strongHash(entry.inp, true, true))
    let p = null
    for(const x in phrases) if (x['hsh'] === hshP.value) p = x
    if (p) {
      p.txt = entry.inp
      p.del = false
      resetP()
      expandP.value = false
      await ui.diagDisplay($t('UAPdup_p'))
      return
    }
    initP.value = entry.inp
    errVP.value = false
  } else { // vérification
    if (initP.value === entry.inp) { // OK
      phrases.push({ txt: initP.value, ac: false, del: false, hsh: hshP.value })
      resetP()
      expandP.value = false
      return
    }
    errVP.value = true
  }
}

const alChg = computed(() => {
  let c = false
  aliases.forEach((a) => {
    if ((a.ac && a.del) || (!a.ac && !a.del)) c = true
  })
  return c
})

const psChg = computed(() => {
  let c = false
  phrases.forEach((p) => {
    if ((p.ac && p.del) || (!p.ac && !p.del)) c = true
  })
  return c
})

const diag = computed(() => {
  let na = 0; aliases.forEach((a) => { if (!a.del) na++ })
  let np = 0; phrases.forEach((p) => { if (!p.del) np++ })
  if (props.mode === 'a' || props.mode === 'a') {
    if (na === 0) return 1
    if (na > 1) return 2
  }
  if (props.mode === 'p' || props.mode === 'a') {
    if (np === 0) return 3
    if (np > 1) return 4
  }
  return 0
})

const enabled = computed(() => {
  if (diag.value !== 0) return false
  if (props.mode === 'a') return alChg.value
  if (props.mode === 'p') return psChg.value
})

init()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.diag { background: $yellow-3; font-weight: bold; color: black;
  padding: 2px;width:100%; }
</style>
