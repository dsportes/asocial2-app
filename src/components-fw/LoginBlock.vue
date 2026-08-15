<!-- Panel d'authentification par ailias / phrase ou code PIN
Event émis: logged
-->
<template>
<div class="q-ma-xs q-pa-xs">

  <div v-if="sf.hasIDBS && session.noNet" class="titre-md msg2 text-center q-ma-sm">
    {{ $t('LOGplaneimp') }}
  </div>

  <div v-if="sf.hasIDBS && sf.users.length">
    <div class="row full-width items-center q-my-sm">
      <btn-bubble :text="$t(session.noNet ? 'LOGauthplane_bub' : 'LOGauthbypin_bub')"/>
      <div class="text-italic titre-md q-ml-sm">
        {{$t(session.noNet ? 'LOGauthplane_label' : 'LOGauthbypin_label')}}</div>
      <div v-for="u in sf.users" :key="u.userId"
        :class="'q-ml-sm cursor-pointer select font-mono q-px-xs text-white fs-md ' + (u === selectedUser ? 'bg-warning' : 'bg-primary')"
        @click="selectUser(u)">{{u.pseudo}}</div>
    </div>
    <div v-if="selectedUser" class="wsm">
      <div v-if="session.hasNet" class="q-pa-sm">
        <input-b v-model="pin" prefix="PSpin" size="pin" @validate="authPIN"/>
      </div>
      <div v-else>
        <div v-if="!selectedUser.hasAppDb()" class="titre-md msg2 text-center q-ma-sm">
          {{ $t('LOGplaneimp') }}
        </div>
        <input-b v-else class="q-pa-sm"
          v-model="entryPP" size="p1" prefix="Phrase"
          @validate="authPlane"/>
      </div>
    </div>
  </div>

  <!-- Authentification "forte" -->
  <div v-if="session.hasNet" class="full-width column">
    <bar-title prefix="LOGap" class="q-mt-sm q-mb-xs text-italic"/>
    <div v-if="diagAP" class="q-my-xs msg self-end"
      style="margin-left:55px">
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
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputB from '../components-fw/InputB.vue'
import { Crypt } from '../src-fw/crypt'
import BarTitle from '../components-fw/BarTitle.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const emit = defineEmits(['logged'])

const pin = reactive({ inp: '', err: '' })
const entryPP = reactive({inp:'', err:''})
const users = computed(() => session.noLocal ? [] : sf.users)
const selectedUser = ref(users.value.length === 1 ? users.value[0] : null)

/*
watch(() => sf.users, () => {
  users.value = sf.users
  selectedUser.value = users.value.length === 1 ? users.value[0] : null
})
*/

const selectUser = (u) => { // u est un Trusting
  pin.inp = ''; pin.err = '' 
  entryPP.inp = ''; entryPP.err = '' 
  selectedUser.value = u
}

const authPIN = async () => {
  const status = await sf.openSafeByPin(pin.inp, selectedUser.value)
  if (status === 0) emit('logged', null)
  else if (status > 0) await ui.diagDisplay($t('STSF_' + status), true)
}

const authPlane = async () => {
  const shp = await Crypt.strongHash(entryPP.inp, true, true)
  const status = await sf.openSafeByPlane(shp, selectedUser.value)
  if (status === 0) emit('logged', null)
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
  await sf.init1()
  const shp = await Crypt.strongHash(entryP.inp, true, false)
  const status = await sf.openSafeByAP(safeIS.value.i, safeIS.value.s, shp)
  if (status === 0) emit('logged', null)
  else if (status > 0) await ui.diagDisplay($t('STSF_' + status))
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background: $grey-7 !important }
</style>
