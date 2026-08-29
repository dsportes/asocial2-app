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
      <q-badge color="red" floating>{{ deletedCodes.size + updatedPrefs.size }}</q-badge>
    </btn-cond>
  </template>

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs">
    <div class="q-my-md text-center titre-md">{{$t('HPprefslist')}}</div>
    <scroll-area class='pwsm'><template #default>
      <div :class="dkli(idx)" v-for="([code, obj], idx) of myPrefs" :key="code">
        <div :class="pSel(code) + 'row q-my-xs cursor-pointer select'"
          @click="selPref(code, obj)">
          <div class="col-6 font-mono q-pr-sm">{{code}}</div>
          <div class="col-6">{{dhcool(obj.time)}}</div>
        </div>
      </div>
    </template></scroll-area>

    <div v-if="selP === null" class="row justify-between items-center q-gutter-sm">
      <div class="q-my-md text-warning text-italic text-bold titre-md">{{$t('HPprefsnosel')}}</div>
      <btn-cond icon="add" :label="$t('create')" @ok="newPref"/>
    </div>
    <div v-else>
      <div class="q-my-md text-bold titre-md">
        {{$t('HPprefssel', [selP.code, dhcool(selP.time), $t('st_' + [st])])}}</div>
      <text-zoom :label="$t('HPprefraw')" :text="rawText"/>
      <div class="row q-gutter-sm">
        <btn-cond v-if="st !== 3" icon="delete" :label="$t('delete')" @ok="delPref"/>
        <btn-cond v-if="st > 1" icon="undo" :label="$t('undo')" @ok="undoPref"/>
        <btn-cond v-if="st !== 3" icon="edit" :label="$t('edit')" @ok="editPref"/>
        <btn-cond v-if="st !== 3" icon="content_copy" :label="$t('duplicate')" @ok="dupPref"/>
        <btn-cond icon="add" :label="$t('create')" @ok="newPref"/>
      </div>
    </div>

    <input-a v-if="edName !== 0" class="q-my-md full-width"
      size="pref" prefix="HPprefcode" :initval="selP ? selP.code : ''"
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

const myPrefs: Ref<Map<string, Object>> = ref(new Map())
const myPrefsOrig: Ref<Map<string, Object>> = ref(sf.mySafePrefs)
const updatedPrefs = ref(new Set<string>())
const deletedPrefs = ref(new Set<string>())
const createdPrefs = ref(new Set<string>())

watch(() => sf.mySafePrefs, () => { 
  init()
})

const init = () => {
  for(const [code, obj] of session.prefs) {
    const clone = decode(encode(obj))
    myPrefs.set(code, clone)
  }
  deletedPrefs.value.clear()
  updatedPrefs.value.clear()
  createdPrefs.value.clear()
}

watch(() => [createdPrefs.value.size, deletedPrefs.value.size, updatedPrefs.value.size], () => {
  if (createdPrefs.value.size + deletedPrefs.value.size + updatedPrefs.value.size) ui.setEditing()
  else ui.resetEditing()
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

const pSel = (code: string) => {
  const x = !code ? '' : (selP.value === code ? 'bord2w ' : 'bord2c ')
  const y = deletedPrefs.value.has(code) ? 'text-strike ' : ''
  const z = updatedPrefs.value.has(code) ? 'text-warning text-bold ' : ''
  const t = createdPrefs.value.has(code) ? 'text-italic text-warning text-bold ' : ''
  return x + y + z + t
}

const selPref = (code: string) => {
  if (selP.value === code) selP.value = null
  else selP.value = code
}
const rawText = computed(() => !selP.value ? '???' : JSON.stringify(myPrefs.value.get(selP.value), null, '\t'))

const st = computed(() => { // 0: inchangé 1: ajouté 2: modifié 3: supprimé
  const code = selP.value
  if (createdPrefs.value.has(code)) return 1
  if (deletedPrefs.value.has(code)) return 3
  if (updatedPrefs.value.has(code)) return 2
  return 0
})

const delPref = () => {
  if (st.value === 1) createdPrefs.value.delete(selP.value)
  else if (st.value === 2) deletedPrefs.value.add(selP.value)
  else if (st.value === 0) deletedPrefs.value.add(selP.value)
  selP.value = null
}

const undoPref = () => {
  const code = selP.value
  switch (st.value) {
    case 0: return // inchangé
    case 1: { createdPrefs.value.delete(code); break }
    case 2: { // updated
      const x = myPrefsOrig.value.get(code)
      updatedPrefs.value.delete(code)
      if (x) {
        const clone = decode(encode(x))
        myPrefs.value.set(code, clone)
      } else myPrefs.value.delete(code)
      break
    }
    case 3: { // supprimé
      const x = myPrefsOrig.value.get(code)
      deletedPrefs.value.delete(code)
      if (x) {
        const clone = decode(encode(x))
        myPrefs.value.set(code, clone)
      } else myPrefs.value.delete(code)
      break
    }
  }
}

const namep = ref('')
const origName = ref()

const editPref = () => {
  const obj = myPrefs.value.get(selP.value) || { time: 0 }
  const orig = myPrefsOrig.value.get(selP.value) || { time: 0 }
  session.setEdPref(selP.value, obj, orig)
  dialogs.edprf = true
}

const dupPref = () => {
  origName.value = selP.value
  namep.value = selP.value
}

const newPref = () => {
  origName.value = null
  namep.value = ''
}

const valNamep = async () => { // nouveau, soit vide, soit par duplication
  const n = namep.value
  if (createdPrefs.value.has(n) || updatedPrefs.value.has(n) || deletedPrefs.value.has(n)) {
    await ui.diagDisplay($t('HPprefdup'))
    return
  }
  const objx = myPrefs.value.get(origName.value)
  const obj = origName.value && objx ? decode(encode(objx)) : { time: 0 }
  const objy = myPrefsOrig.value.get(origName.value)
  const orig = origName.value && objy ? objy : { time: 0 }
  myPrefs.value.set(n, obj)
  createdPrefs.value.add(n)
  session.setEdPref(n, obj, orig)
  dialogs.edprf = true
}

const edValid = () => {
  const edP = session.edPref
  if (edP.diag) return
  if (edP.chg && !createdPrefs.has(edP.code))
    updatedPrefs.value.add(edP.code)
  selP.value = edP.code
  session.resetPref()
  dialogs.edprf = false
}

const validate = async () => {
  const m = new Map<string, Object>()
  for(const code of updatedPrefs.value)
    m.set(code, myPrefs.value.get(code))
  await sf.updatePrefs(m, Array.from(deletedPrefs.value))
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
