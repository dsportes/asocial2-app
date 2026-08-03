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
      <div :class="dkli(idx)" v-for="([code, [time, obj]], idx) of myPrefs" :key="code">
        <div :class="pSel(code) + 'row q-my-xs cursor-pointer select'"
          @click="selPref({ code, time, obj })">
          <div class="col-6 font-mono q-pr-sm">{{code}}</div>
          <div class="col-6">{{dhcool(time)}}</div>
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
        <div class="font-mono fs-sm text-italic">[{{dhcool(session.edPref.time)}}]</div>
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

import { LocPref } from '../stores/safe-store'
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

const myPrefs: Ref<Map<string, [number, Uint8Array]>> = ref(sf.mySafePrefs)
const myPrefsOrig: Ref<Map<string, [number, Uint8Array]>> = ref(new Map())
watch(() => sf.mySafePrefs, () => { 
  init()
})

const init = () => {
  myPrefs.value = sf.mySafePrefs
  for(const [code, x] of myPrefs.value) myPrefsOrig.value.set(code, x)
  deletedCodes.value.clear()
  updatedPrefs.value.clear()
}

const updatedPrefs: Ref<Map<string, LocPref>> = ref(new Map())
const deletedCodes = ref(new Set<string>())

watch(() => [deletedCodes.value.size, updatedPrefs.value.size], () => {
  if (deletedCodes.value.size + updatedPrefs.value.size) ui.setEditing()
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

const selP: Ref<LocPref> = ref(null)
const pSel = (code: string) => {
  const x = !code ? '' : (selP.value && selP.value.code === code ? 'bord2w ' : 'bord2c ')
  const y = deletedCodes.value.has(code) ? 'text-strike ' : ''
  const z = updatedPrefs.value.has(code) ? 'text-warning text-bold ' : ''
  return x + y + z
}

const selPref = (p) => {
  if (selP.value && selP.value.code === p.code) {
    selP.value = null
  } else {
    selP.value = p
    edName.value = 0
  }
}
const rawText = computed(() => !selP.value ? '???' : JSON.stringify(decode(selP.value.obj), null, '\t'))

const st = computed(() => { // 0: inchangé 1: ajouté 2: modifié 3: supprimé
  const code = selP.value.code
  if (deletedCodes.value.has(code)) return 3
  if (updatedPrefs.value.has(code))
    return myPrefsOrig.value.has(code) ? 2 : 1
  return 0
})

const delPref = () => {
  if (st.value !== 1) deletedCodes.value.add(selP.value.code)
  else {
    myPrefs.value.delete(selP.value.code)
    selP.value = null
  }
}

const undoPref = () => {
  const code = selP.value.code
  switch (st.value) {
    case 0: return // inchangé
    case 1: { updatedPrefs.value.delete(code); break } // ajouté
    case 2: { // modifié
      updatedPrefs.value.delete(code)
      myPrefs.value.set(code, myPrefsOrig.value.get(code))
      break
    }
    case 3: { // supprimé
      deletedCodes.value.delete(code)
      const x = myPrefsOrig.value.get(code)
      if (x) myPrefs.value.set(code, x)
      else myPrefs.value.delete(code)
      break
    }
  }
}

const namep = ref('')
const edName = ref(0)

const editPref = async () => {
  edName.value = 0
  namep.value = selP.value.code
  await valNamep(true)
}

const dupPref = () => {
  edName.value = 1
  namep.value = selP.value.code
}

const newPref = () => {
  selP.value = null
  edName.value = 2
  namep.value = ''
}

const valNamep = async (edit) => {
  const n = namep.value
  if (!edit && (myPrefs.value.has(n) || updatedPrefs.value.has(n))) {
    await ui.diagDisplay($t('HPprefdup'))
    return
  }
  const obj = selP.value && selP.value.obj ? decode(selP.value.obj) : {}
  session.setEdPref(namep.value,
    edName.value === 2 ? 0 : selP.value.time,
    edName.value === 2 ? {} : obj)
  dialogs.edprf = true
}

const edValid = () => {
  const edP = session.edPref
  const chgn = edName.value === 2 || namep.value !== selP.value.code
  edName.value = 0
  if (edP.diag || (!chgn && !edP.chg)) return
  const p: LocPref  = {
    code: namep.value,
    time: Date.now(),
    obj: encode(edP.obj)
  }
  updatedPrefs.value.set(p.code, p)
  myPrefs.value.set(p.code, [p.time, p.obj])
  selP.value = p
  dialogs.edprf = false
}

const validate = async () => {
  await sf.updatePrefs(updatedPrefs.value, Array.from(deletedCodes.value))
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
