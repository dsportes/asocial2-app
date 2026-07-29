<!-- Dialogue de création d'un safe / changement des alias et phrases
Events: close done
-->
<template>
<dialog-std2 v-model="model" :title="$t('UAPtit_' + mode)" vue="SafeCr"
  @close="close2">
<template #hdr>
<div :class="sty()">
  <div class="row justify-between q-px-xs q-mb-md items-center">
    <div :class="'col titre-md ' + (diag === 0 || diag === 5 ? 'text-italic' : 'msg')">
      {{ $t('UAPdiag_' + diag) }}</div>
    <btn-cond flat size="lg" icon="check" class="col-auto self-end"
      :label="$t('validate')"
      :disable="!enabled" @ok="validate"/>
  </div>

  <div v-if="mode === 'a' || mode === 'u'" class="column">
    <div class="q-mt-sm titre-md text-italic">{{ $t('UAPl_a', aliases.length) }}</div>
    <div v-for="a in aliases" class="row q-ml-lg items-center">
      <btn-cond v-if="!a.del" size="sm" icon="delete" color="warning" @ok="a.del = true"/>
      <btn-cond v-if="a.del" size="sm" icon="undo" color="primary" @ok="a.del = false"/>
      <div :class="'font-mono q-ml-md ' + (a.del ? 'text-strike ' : '') + (a.ac ? '' : 'text-bold text-warning')">
        {{ a.txt }}</div>
    </div>
  </div>

  <div v-if="mode === 'p' || mode === 'u'" class="column">
    <div class="q-mt-sm titre-md text-italic">{{ $t('UAPl_p', phrases.length) }}</div>
    <div v-for="p in phrases" class="row q-ml-lg items-center">
      <btn-cond v-if="!p.del" size="sm" icon="delete" color="warning" @ok="p.del = true"/>
      <btn-cond v-if="p.del" size="sm" icon="undo" color="primary" @ok="p.del = false"/>
      <div :class="'font-mono q-ml-md ' + (p.del ? 'text-strike ' : '') + (p.ac ? '' : 'text-bold text-warning')">
        {{ p.txt || p.hsh}}</div>
    </div>
  </div>

  <q-separator color="grey-6" class="q-mt-md"/>
</div>
</template>

<template #default>
<div class="column items-center q-mt-md">
  <q-list style="max-width:40rem;width:95vw" bordered class="rounded-borders">
    <safestore-select v-if="mode === 'u'" v-model="store"/>

    <q-expansion-item v-if="mode === 'a' || mode === 'u'"
      expand-separator v-model="expandA"
      :label="$t(initA ? 'UAPv_a' : 'UAPs_a')"
      header-class="titre-lg text-italic">
        <div class="column" >
          <input-b v-model="entryA" size="alias" prefix="Alias"
            @validate="valA"/>
          <div v-if="!initA && !freeA" class="msg">{{ $t('UAPm1_a') }}</div>
          <div v-if="initA && errVA">
            <div class="msg">{{ $t('UAPm3_a') }}</div>
            <btn-cond flat color="primary" :label="$t('UAPc_a')"
              @ok="correcA"/>
          </div>
          <btn-cond class="self-end" flat color="warning" :label="$t('UAPt_a')"
            @ok="termA"/>
        </div>
    </q-expansion-item>

    <q-expansion-item v-if="mode === 'p' || mode === 'u'"
      expand-separator v-model="expandP"
      :label="$t(initP ? 'UAPv_p' : 'UAPs_p')"
      header-class="titre-lg text-italic">
        <div class="column">
          <input-b v-model="entryP" size="p1" prefix="Phrase"
            @validate="valP"/>
          <div v-if="initP && errVP">
            <div class="msg">{{ $t('UAPm3_a') }}</div>
            <btn-cond flat color="primary" :label="$t('UAPc_a')"
              @ok="correcP"/>
          </div>
          <btn-cond flat class="self-end" color="warning" :label="$t('UAPt_p')"
            @ok="termP"/>
        </div>
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
import { $t, sty } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

import SafestoreSelect from '../components-fw/SafestoreSelect.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InputB from '../components-fw/InputB.vue'

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

const close2 = () => {
  if (alChg.value || psChg.value) dialogs.close = true
  else { model.value = false; emit('close', true) }
}

const chooseBack = (n) => {
  dialogs.close = false
  if (n) { model.value = false; emit('close', true) }
}

const store = ref()

type al = {
  txt: string
  ac: boolean // si actuel
  del: boolean // si deleted
  hsh?: string
  sh?: Uint8Array
}

const entryA = reactive({ inp: '', err: '' })
const entryP = reactive({ inp: '', err: '' })

const aliases: Ref<al[]> = reactive([])
const expandA = ref(false)
const freeA = ref(true)
const errVA = ref(false)
const initA = ref('')

const resetA = () => {
  entryA.inp = ''
  entryA.err = ''
  initA.value = ''
  freeA.value = true
  errVA.value = false
  setDiag()
}
watch(expandA, (v) => { resetA() })

const phrases : Ref<al[]> = reactive([])
const expandP = ref(false)
const errVP = ref(false)
const initP = ref('')
const listPAC = ref(new Set<string>())

const resetP = () => {
  entryP.inp = ''
  entryP.err = ''
  initP.value = ''
  errVP.value = false
  setDiag()
}
watch(expandP, (v) => { resetP() })

const init = () => {
  if (props.mode === 'a' || props.mode === 'u') {
    aliases.lenth = 0
    resetA()
  }
  if (props.mode === 'p' || props.mode === 'u') {
    listPAC.value.clear()
    phrases.length = 0
    resetP()
  }
  setDiag()
}

const valA = async () => {
  if (!initA.value) {
    let a: al | null = null
    for(const x of aliases) if (x['txt'] === entryA.inp) a = x
    if (a) {
      a.del = false
      resetA()
      expandA.value = false
      await ui.diagDisplay($t('UAPdup_a'))
      setDiag()
      return
    }
    freeA.value = await sf.mdAliasFree(entryA.inp)
    if (freeA.value === -1) {
      resetA()
      expandA.value = false
      setDiag()
      return
    }
    if (freeA.value) {
      initA.value = entryA.inp
      errVA.value = false
      entryA.inp = ''
      setDiag()
    }
  } else { // vérification
    if (initA.value === entryA.inp) { // OK
      aliases.push({ txt: initA.value, ac: false, del: false })
      resetA()
      expandA.value = false
      setDiag()
      return
    }
    errVA.value = true
    setDiag()
  }
}

const termA = () => {
  resetA()
  expandA.value = false
  setDiag()
}

const correcA = () => {
  entryA.inp = initA.value
  entryA.err = ''
  initA.value = ''
  freeA.value = true
  errVA.value = false
  setDiag()
}

const valP = async () => {
  const sh = await Crypt.strongHash(entryP.inp, true, true) as Uint8Array
  const hsh = Crypt.shaS(sh)
  const ac = listPAC.value.has(hsh)
  if (!initP.value) {
    let p: al | null = null
    if (ac) {
      await ui.diagDisplay($t('UAPdup_p1'))
      p = { txt: entryP.inp, hsh: hsh, sh: sh, ac: true, del: false }
      phrases.push(p)
      resetP()
      expandP.value = false
      setDiag()
      return
    }
    for(const x of phrases) if (x['hsh'] === hsh) p = x
    if (p) {
      await ui.diagDisplay($t('UAPdup_p'))
      p.del = false
      resetP()
      expandP.value = false
      setDiag()
      return
    }
    initP.value = entryP.inp
    errVP.value = false
    entryP.inp = ''
    setDiag()
  } else { // vérification
    if (initP.value === entryP.inp) { // OK
      phrases.push({ txt: initP.value, ac: false, del: false, hsh: hsh, sh: sh })
      resetP()
      expandP.value = false
      setDiag()
      return
    }
    errVP.value = true
    setDiag()
  }
}

const correcP = () => {
  entryP.inp = initP.value
  entryP.err = ''
  initP.value = ''
  errVP.value = false
  setDiag()
}

const termP = () => {
  resetP()
  expandP.value = false
  setDiag()
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

const diag = ref(0)

const setDiag = () => {
  diag.value = 0
  let na = 0; aliases.forEach((a) => { if (!a.del) na++ })
  let np = 0; phrases.forEach((p) => { if (!p.del) np++ })
  if (props.mode === 'a' || props.mode === 'u') {
    if (na === 0) { diag.value = 1; return }
    if (na > 2) { diag.value = 2; return }
  }
  if (props.mode === 'p' || props.mode === 'u') {
    if (np === 0) { diag.value = 3; return }
    if (np > 2) { diag.value = 4; return }
  }
  diag.value = !alChg.value && !psChg.value ? 5 : 0
}

const enabled = computed(() => {
  if (diag.value > 0 && diag.value < 5) return false
  if (props.mode === 'a') return alChg.value
  else if (props.mode === 'p') return psChg.value
  else return true
})

const validate = async () => {
  if (props.mode === 'u') await validateU()
  else if (props.mode === 'a') await validateA()
  else await validateP()
}

const validateA = async () => {
  let a1 = '', a2 = ''
  for(const al of aliases) {
    if (al.del) continue
    if (!a1) a1 = al.txt
    else if (!a2) a2 = al.txt
    else break
  }
  const ok = await sf.setAlias(a1, a2)
  await ui.diagDisplay($t(ok ? 'UAPok_a' : 'UAPko_a'))
  if (ok) {
    emit('done', true)
    model.value = false
    emit('close', true)
  }
}

const validateP = async () => {
  let shp1 = null, shp2 = null
  for(const al of phrases) {
    if (al.del) continue
    if (!shp1) shp1 = al.sh
    else if (!shp2) shp2 = al.sh
    else break
  }
  const status = await sf.setPhraseSafe(shp1, shp2)
  if (status > 0) await ui.diagDisplay($t('STSF_status'))
  else if (status === 0) {
    await ui.diagDisplay($t('UAPok_p'))
    emit('done', true)
    model.value = false
    emit('close', true)
  }
}

const validateU = async () => {
  let a1 = '', a2 = ''
  for(const al of aliases) {
    if (al.del) continue
    if (!a1) a1 = al.txt
    else if (!a2) a2 = al.txt
    else break
  }
  let shp1 = null, shp2 = null
  for(const al of phrases) {
    if (al.del) continue
    if (!shp1) shp1 = al.sh
    else if (!shp2) shp2 = al.sh
    else break
  }
  let status = await sf.createSafe(store.value, a1, a2, shp1, shp2)
  if (status > 0) await ui.diagDisplay($t('STSF_' + status))
  else if (status === 0) {
    await ui.diagDisplay($t('UAPok_u'))
    emit('done', true)
    model.value = false
    emit('close', true)
  }
}
init()
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.diag { background: $yellow-3; font-weight: bold; color: black;
  padding: 2px;width:100%; }
</style>
