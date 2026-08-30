<!-- Dialogue de gestion des préférences.
Events: close done
-->
<template>
<div>
<dialog-std2 v-model="model" :title="$t('HPprefs_1')" vue="PrefsMgr"
  hdrclass="tbs" noclose @close="checkClose" width="md">
  <template #btn>
    <btn-cond icon="check" :label="$t('validate')" @ok="validate"
      :disable="!ui.editingInCourse">
      <q-badge color="red" floating>{{ nbc }}</q-badge>
    </btn-cond>
  </template>

  <template #hdr>
    <div class="q-pa-xs">
      <q-checkbox dense v-model="toSave" :label="$t('HPprefssave')" />
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs">
    <div class="q-my-md text-center titre-md">{{$t('HPprefslist')}}</div>
    <scroll-area class='pwsm'><template #default>
      <div :class="dkli(idx)" v-for="(code, idx) of st" :key="code">
        <div :class="pSel(code) + 'row q-my-xs cursor-pointer select'"
          @click="selPref(code)">
          <div class="col-6 font-mono q-pr-sm">{{code}}</div>
          <div class="col-6">{{coolTime(code)}}</div>
        </div>
      </div>
    </template></scroll-area>

    <div v-if="selP === null" class="row justify-between items-center q-gutter-sm">
      <div class="q-my-md text-warning text-italic text-bold titre-md">{{$t('HPprefsnosel')}}</div>
      <btn-cond icon="add" :label="$t('HPprefscr')" @ok="newPref"/>
    </div>
    <div v-else>
      <div class="q-my-md text-bold titre-md">
        {{$t('HPprefssel', [selP, coolTime(selP), $t('HPprefsst_' + stc)])}}</div>
      <text-zoom :label="$t('HPprefraw')" :text="rawText"/>
      <div class="row q-gutter-sm">
        <btn-cond v-if="stc !== 3" icon="delete" :label="$t('delete')" @ok="delPref"/>
        <btn-cond v-if="stc > 1" icon="undo" :label="$t('undo')" @ok="undoPref"/>
        <btn-cond v-if="stc !== 3" icon="edit" :label="$t('edit')" @ok="editPref"/>
        <btn-cond v-if="stc !== 3" icon="content_copy" :label="$t('duplicate')" @ok="dupPref"/>
        <btn-cond icon="add" :label="$t('create')" @ok="newPref"/>
      </div>
    </div>

    <input-a v-if="edName" class="q-my-md full-width"
      size="pref" prefix="HPprefcode" :initval="selP || ''"
      v-model="namep" @validate="valNamep"/>

  </div>
  </div>
</template>
</dialog-std2>

<dialog-std1 v-model="dialogs.edprf" @close="dialogs.edprf = false"
  :title="$t('HPprefs_ed')" hdrclass='wmd' vue="PrefsMgr">
  <template #hdr>
    <div class="row q-ma-xs items-center justify-between">
      <div class="row col">
        <div class="titre-md text-bold q-mr-md">{{session.edPref.code}}</div>
        <div v-if="session.edPref.obj.time" class="font-mono fs-sm text-italic">
          [{{dhcool(session.edPref.obj.time)}}]</div>
        <div v-else class="text-italic">{{ $t('HPprefs_new') }}</div>
      </div>
      <btn-cond class="q-ml-xs" icon="check" :label="$t('ok')" @ok="edValid"
        :color="session.edPref.chg ? 'warning' : 'primary'"
        :disable="diag !== ''"/>
    </div>
    <div v-if="diag" class="msg">{{diag}}</div>
  </template>
  <template #default>
    <q-separator class="q-my-xs"/>
    <pref-editor class="q-pa-xs"/>
  </template>
</dialog-std1>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { $t, dkli, dhcool } from '../src-fw/util'
import stores from '../stores/all'

import InputA from '../components-fw/InputA.vue'
import PrefEditor from '../components/PrefEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import TextZoom from '../components-fw/TextZoom.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import DialogStd1 from '../dialogs-fw/DialogStd1.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const dialogs = reactive({
  edprf: false
})

watch(model, (v) => {
  if(v) init()
  else  { emit('close', true) }
})

const diag = computed(() => session.edPref ? session.edPref.diag : '' )
const toSave = ref(true)

const myPrefs: Ref<Map<string, Object>> = ref(new Map())
const myPrefsOrig: Ref<Map<string, Object>> = ref(sf.mySafePrefs)
const st = reactive({}) // 0: inchangé 1: ajouté 2: modifié 3: supprimé
const nbc = computed(() => {
  let n = 0
  for(const c in st) if (st[c] !== 0) n++
  return n
})
const coolTime = (code: string) : string => {
  return st[code] === 1 ? $t('HPprefs_new') : dhcool(myPrefs.value.get(code).time)
}

watch(() => sf.mySafePrefs, () => { 
  init()
})

const init = () => {
  for(const [code, obj] of session.prefs) {
    const clone = decode(encode(obj))
    myPrefs.value.set(code, clone)
    st[code] = 0
  }
}

watch(st, (v) => { 
  for(const code in v) if (v[code]) { ui.setEditing(); return }
  ui.resetEditing()
})

const checkClose = async () => {
  const b = await ui.mayClose()
  if (b) {
    model.value = false
    emit('close', true)
  } else 
    model.value = true
}

const selP = ref(null)
const stc = computed(() => selP.value ? st[selP.value] : 0)

const styl = ['', 'text-italic text-warning text-bold', 'text-warning text-bold', 'text-strike']
const pSel = (code: string) => 
  (selP.value === code ? 'bord2w ' : 'bord2c ') + styl[st[code]] + ' '

const selPref = (code: string) => {
  if (selP.value === code) selP.value = null
  else selP.value = code
}
const rawText = computed(() => !selP.value ? '???' : JSON.stringify(myPrefs.value.get(selP.value), null, '\t'))

const delPref = () => { // 0: inchangé 1: ajouté 2: modifié 3: supprimé
  if (selP.value !== null) {
    if (stc.value === 1) delete st[selP.value]
    else st[selP.value] = 3
  }
  selP.value = null
}

const undoPref = () => {
  const code = selP.value
  switch (st[selP.value]) {
    case 0: return // inchangé
    case 1: delete st[selP.value]; return // ajouté
    case 2: // modifié
    case 3: // supprimé
      const clone = decode(encode(myPrefsOrig.value.get(code)))
      myPrefs.value.set(code, clone)
      st[selP.value] = 0
  }
}

const namep = ref('')
const origName = ref()

const editPref = () => {
  const obj = myPrefs.value.get(selP.value)
  const orig = myPrefsOrig.value.get(selP.value) || null
  session.setEdPref(selP.value, obj, orig)
  dialogs.edprf = true
}

const edName = ref(false)

const dupPref = () => {
  edName.value = true
  origName.value = selP.value
  namep.value = selP.value
}

const newPref = () => {
  edName.value = true
  origName.value = null
  namep.value = ''
}

const valNamep = async () => { // nouveau, soit vide, soit par duplication
  const n = namep.value
  if (st[n] !== undefined) {
    await ui.diagDisplay($t('HPprefdup'))
    return
  }
  edName.value = false
  const obj = origName.value ? decode(encode(myPrefs.value.get(origName.value))) : { time: 0 }
  const orig = origName.value ? myPrefsOrig.value.get(origName.value) : { time: 0 }
  myPrefs.value.set(n, obj)
  st[n] = 1
  session.setEdPref(n, obj, orig)
  dialogs.edprf = true
}

const edValid = () => { // était 0, 1 ou 2
  const edP = session.edPref
  if (edP.diag) return
  if (edP.chg && st[edP.code] === 0) st[edP.code] = 1
  selP.value = edP.code
  session.resetEdPref()
  dialogs.edprf = false
}

const validate = async () => {
  const m = new Map<string, Object>()
  for(const code in st) {
    const s = st[code]
    if (s !== 3) m.set(code, myPrefs.value.get(code))
  }
  await session.updatePrefs(m, toSave.value)
  emit('done', true)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-top { border-top: 1px solid $grey-5; }
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.bord2g { border: 1px solid $green-5; }
.select:hover { background-color: $yellow-2; color: black; }
</style>
