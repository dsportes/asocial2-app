<template> <!-- Gérer les credentials -->
<div>
<dialog-std2 v-model="pm" :title="$t('HPprefs_1')">
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-sm">
      <btn-cond flat size="lg" icon="check" color="warning" 
        :label="$t('validate')" @ok="validate"
        :disable="deletedCodes.size === 0 && updatedPrefs.size === 0"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs">
    <div class="q-my-md text-center titre-md">{{$t('HPprefslist')}}</div>
    <q-scroll-area style="height: 150px;" :barStyle="barStyle" :thumbStyle="thumbStyle"
      class='bord1 q-pa-xs pwsm'>
      <div :class="dkli(idx)" v-for="([code, [time, obj]], idx) of myPrefs" :key="code">
        <div :class="pSel(code) + 'row q-my-xs cursor-pointer select'" 
          @click="selPref({ code, time, obj })">
          <div class="col-6 font-mono q-pr-sm">{{code}}</div>
          <div class="col-6">{{dhcool(time)}}</div>
        </div>
      </div>
    </q-scroll-area>

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

    <q-input v-if="edName !== 0" class="q-my-md full-width"
      filled v-model="namep" 
      :label="$t('HPprefcode')"
      input-class="font-mono"
      counter
      :hint="hintnamep"
      bottom-slots
      :error="nameperr !== ''"
      @keydown.enter.prevent="valNamep">
      <template v-slot:append>
        <q-icon size="sm" name="undo" @click="edName = 0" 
          class="cursor-pointer"/>
        <q-icon size="sm" name="close" @click="namep = ''" 
          class="cursor-pointer" :disable="namep.length === 0"/>
        <q-btn size="sm" icon="check" :disable="nameperr !== ''" 
          color="primary" round @click="valNamep" />
      </template>
      <template v-slot:error>{{$t(nameperr)}}</template>
    </q-input>
  </div>
  </div>
</template>
</dialog-std2>

<dialog-std1 v-model="ui.dModels[idc2].edprf" 
  :title="$t('HPprefs_ed')" hdrclass='wmd'>
  <template #hdr>
    <div class="titre-md text-center text-bold">{{session.edPref.code}}</div>
  </template>
  <template #default>
    <pref-editor class="q-my-md q-pa-xs" @ok="doValPref"/>
  </template>
</dialog-std1>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, onUnmounted, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import PrefEditor from '../components/PrefEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, dkli, dhcool, b64ToU8, u8ToB64 } from '../src-fw/util'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'

const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }
const namepSize = [4, 32]

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const idc2 = ui.getIdc()
onUnmounted(() => ui.closeVue(idc2))

const emit = defineEmits(['updated'])

const pm = computed(() => ui.dModels[props.idc].prefsmgr)

const props = defineProps ({
  idc: String
})

// const myPrefs: RefMap<string, [number, Uint8Array]> = ref(sf.mySafePrefs)
const myPrefs: RefMap<string, [number, Uint8Array]> = ref(new Map())
const myPrefsOrig: RefMap<string, [number, Uint8Array]> = ref(new Map())
watch(() => sf.mySafePrefs, (p) => { myPrefs.value = p })

const test = {
  'mobile': [ Date.now() - 3600000, encode({ lg: 'FR' })],
  'ecran large': [ Date.now() - 7200000, encode({ btn1: false, btn2: true })],
  'mode expert': [ Date.now() - 7200000, encode({ btn1: false, title: 'bla bla' })]
}
for (const code in test) {
  const [time, obj] = test[code]
  myPrefs.value.set(code, [time, obj])
}

for(const [code, x] of myPrefs.value) myPrefsOrig.value.set(code, x)

type LocPref = {
  code: string
  time: number
  obj: Uint8Array
}

const updatedPrefs: Ref<Map<string, LocPref>> = ref(new Map())
const deletedCodes = ref(new Set<string>())
const selP: Ref<LocPref> = ref(null)
const pSel = (code: string) => {
  const x = !code ? '' : (selP.value && selP.value.code === code ? 'bord2w ' : 'bord2c ')
  const y = deletedCodes.value.has(code) ? 'text-strike ' : ''
  const z = updatedPrefs.value.has(code) ? 'text-warning text-bold ' : ''
  return x + y + z
}

const selPref = (p) => { 
  selP.value = p
  edName.value = 0 
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
const nameperr = computed(() => namep.value.length < namepSize[0] ? 'PScourt' : 
  (namep.value.length > namepSize[1] ? 'PSlong' : ''))
const hintnamep = computed(() => $t('PSminmax', namepSize) + (!nameperr.value ? $t('pressret') : ''))

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
  edName.value = 2
  namep.value = ''
}

const valNamep = async (edit) => {
  const n = namep.value
  if (!edit && (myPrefs.value.has(n) || updatedPrefs.value.has(n))) {
    await ui.diagDisplay($t('HPprefdup'))
    return
  }
  session.setEdPref(namep.value, 
    edName.value === 1 ? selP.value.time : 0, 
    edName.value === 1 ? decode(selP.value.obj) : {})
  ui.oD(idc2, 'edprf')
}

const doValPref = (pref, hasChg) => {
  ui.fD()
  const chgn = edName.value === 2 || namep.value !== selP.value.code
  edName.value = 0
  if (!chgn && !hasChg) return
  const p: LocPref  = {
    code: namep.value,
    time: Date.now(),
    obj: encode(pref)
  }
  updatedPrefs.value.set(p.code, p)
  myPrefs.value.set(p.code, [p.time, p.obj])
  selP.value = p
}

const validate = async () => {
  // TODO
  console.log('validate')
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