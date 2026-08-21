<!-- Panel d'authentification par alias / phrase ou code PIN
Event émis: logged
-->
<template>
<div class="q-ma-xs q-pa-xs">

  <div v-if="session.noNet && session.noLocal"
    class="row full-width items-center q-my-sm q-gutter-sm">
    <btn-bubble :text="$t('LOGcalc_bub')"/>
    <btn-cond :label="$t('LOGcalc_label')" no-caps icon="calculate"
      @ok="authCalc"/>
  </div>

  <div v-if="session.noNet && session.hasLocal && sf.trustings.size && trustingsCached().length" 
    class="titre-md msg2 text-center q-ma-sm">{{ $t('LOGplaneimp2') }}</div>

  <div v-if="mayPlane"
    class="row full-width items-center q-my-sm q-gutter-sm">
    <btn-bubble :text="$t('LOGauthplane_bub')"/>
    <div class="text-italic titre-md q-ml-sm"> {{$t('LOGauthplane_label')}}</div>
    <div v-for="u in trustingsCached()" :key="u.userId"
      :class="'q-ml-sm cursor-pointer select font-mono q-px-xs text-white fs-md ' + (u === selectedUser ? 'bg-warning' : 'bg-primary')"
      @click="selectUser(u)">{{u.pseudo}}
    </div>
  </div>

  <div v-if="mayPin" 
    class="row full-width items-center q-my-sm q-gutter-sm">
    <btn-bubble :text="$t('LOGauthbypin_bub')"/>
    <div class="text-italic titre-md q-ml-sm">{{$t('LOGauthbypin_label')}}</div>
    <div v-for="[,u] in sf.trustings" :key="u.userId"
      :class="'q-ml-sm cursor-pointer select font-mono q-px-xs text-white fs-md ' + (u === selectedUser ? 'bg-warning' : 'bg-primary')"
      @click="selectUser(u)">{{u.pseudo}}</div>
  </div>

  <div v-if="selectedUser" class="wsm">
    <div v-if="session.hasNet" class="q-pa-sm">
      <input-b v-model="pin" prefix="PSpin" size="pin" @validate="authPIN"/>
    </div>
    <div v-else class="q-pa-sm">
      <input-b class="q-pa-sm"
        v-model="entryPP" size="p1" prefix="Phrase"
        @validate="authPlane"/>
    </div>
  </div>

  <q-separator v-if="mayPlane || mayPin" 
    class="q-my-md q-mx-md" color="orange"/>

  <!-- Authentification par alias / phrase -->
  <div v-if="session.hasNet" class="full-width column">
    <bar-title prefix="LOGap" class="q-mt-sm q-mb-xs text-italic"/>
    <div v-if="diagAP" class="q-my-xs msg q-ml-lg">
      {{ $t('LOGapdiag_' + diagAP)}}</div>
    <input-b v-if="stepAP===0" class="q-ml-lg"
      v-model="entryA" size="alias" prefix="Alias"
      @validate="valA"/>
    <input-b v-if="stepAP===1" class="q-ml-lg"
      v-model="entryP" size="p1" prefix="Phrase"
      @validate="valP"/>
    <btn-cond v-if="stepAP===1" class="q-ml-lg self-end"
      flat color="warning" :label="$t('UAPt_p')" @ok="resetAP"/>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch, onMounted } from 'vue'
import stores from '../stores/all'
import { IDBsafe } from '../src-fw/idbsafe'
import { $t } from '../src-fw/util'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputB from '../components-fw/InputB.vue'
import { Crypt } from '../src-fw/crypt'
import BarTitle from '../components-fw/BarTitle.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

/* Si IDB safe existe, on peut a minima la lire pour lister
les users qui y ont un trusting et leur proposer
un login par PIN ou AVION.
Si IDB safe n'existe pas, sf.trustings / sf.trustingHavingCache sont vides
*/
onMounted(async () => {
  await IDBsafe.openOnlyIfExists()
})

const emit = defineEmits(['logged'])

const pin = reactive({ inp: '', err: '' })
const entryPP = reactive({inp:'', err:''})
const selectedUser = ref(null)

const trustingsCached = () => {
  const l = []
  for(const [,u] of sf.trustings) 
    if (u.hasAppDb()) l.push(u)
  return l
}

const mayPlane = computed(() => 
  session.hasLocal && trustingsCached().length)
const mayPin = computed(() => 
  session.hasNet && session.hasLocal && sf.trustings.size)

const preselect = () => {
  const x = trustingsCached()
  if (mayPlane.value && x.length === 1)
    selectedUser.value = x[0]
  else if (mayPin.value && sf.trustings.size === 1)
    selectedUser.value = sf.trustings.size[0]
  else selectedUser.value = null
}

preselect()

watch(() => session.hasNet, () => {
  preselect()
})

const selectUser = (u) => { // u est un Trusting
  pin.inp = ''; pin.err = '' 
  entryPP.inp = ''; entryPP.err = '' 
  selectedUser.value = u
}

const authCalc = async () => {
  emit('logged', 'calc')
}

const authPIN = async () => {
  const status = await sf.openSafeByPin(pin.inp, selectedUser.value)
  if (status === 0) emit('logged', 'pin')
  else if (status > 0) await ui.diagDisplay($t('STSF_' + status), true)
}

const authPlane = async () => {
  const shp = await Crypt.strongHash(entryPP.inp, true, true)
  const status = await sf.openSafeByPlane(shp, selectedUser.value)
  if (status === 0) emit('logged', 'plane')
  else if (status > 0) await ui.diagDisplay($t('STSF_' + status))
}

const entryA = reactive({inp:'', err:''})
const entryP = reactive({inp:'', err:''})
const stepAP = ref(0)
const diagAP = ref(1)
const safeIS = ref(null)

const resetAP = () => {
  entryA.inp = ''; entryA.err = ''
  entryP.inp = ''; entryP.err = ''
  stepAP.value = 0
  diagAP.value = 1
  safeIS.value = null
}

const valA = async () => {
  const hsha = Crypt.shaS(await Crypt.strongHash(entryA.inp, false, true))
  safeIS.value = await sf.mdUserGetICVS(hsha, true)
  if (!safeIS.value)
    safeIS.value = await sf.mdUserGetICVS(entryA.inp, false)
  if (!safeIS.value) diagAP.value = 3
  else {
    diagAP.value = 2
    stepAP.value = 1
  }
}

const valP = async () => {
  // Si IDBsafe n'était pas ouvert (voire n'existait pas), ouverture et initialisation
  await IDBsafe.openInAnyCase()
  const shp = await Crypt.strongHash(entryP.inp, true, false)
  const status = await sf.openSafeByAP(safeIS.value.i, safeIS.value.s, shp)
  if (status === 0) emit('logged', 'alias')
  else if (status > 0) await ui.diagDisplay($t('STSF_' + status))
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background: $grey-7 !important }
</style>
