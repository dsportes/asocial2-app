<!-- Panel d'authentification par code PIN
Event émis: logged
-->
<template>
<div class="q-ma-xs q-pa-xs">
  <div v-if="sf.users.length">
    <div class="row full-width items-center q-my-sm">
      <btn-bubble :text="$t('LOGauthbypin_bub')"/>
      <div class="text-italic titre-md q-ml-sm">{{$t('LOGauthbypin_label')}}</div>
      <div v-for="u in sf.users" :key="u.userId"
        :class="'q-ml-sm cursor-pointer select font-mono q-px-xs text-white fs-md ' + (u === selectedUser ? 'bg-warning' : 'bg-primary')"
        @click="selectUser(u)">{{u.pseudo}}</div>
    </div>
    <div v-if="selectedUser" class="wsm">
      <div class="q-pa-sm">
        <input-b v-model="pin" prefix="PSpin" size="pin" @validate="authPIN"/>
      </div>
    </div>
  </div>

  <!-- Authentification "forte" -->
  <div class="full-width">
    <bar-title prefix="LOGauthstrong" class="q-my-sm text-italic"/>
    <p0-p1 @ok="authPS" class="full-width q-pl-lg"/>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputB from '../components-fw/InputB.vue'
import P0P1 from '../components-fw/P0P1.vue'
import BarTitle from '../components-fw/BarTitle.vue'

const sf = stores.safe
const ui = stores.ui

const emit = defineEmits(['logged'])

const pin = reactive({ inp: '', err: '' })
const users = ref(sf.users)
const selectedUser = ref(users.value.length === 1 ? users.value[0] : null)

watch(() => sf.users, () => {
  users.value = sf.users
  selectedUser.value = users.value.length === 1 ? users.value[0] : null
})

const selectUser = (u) => {
  pin.value = { inp: '', err: '' }
  selectedUser.value = selectedUser.value === u ? null : u
}

const authPS = async (args) => { // TODO
  const status = await sf.openSafeByAP(args.sh0, args.sh1, args.sh)
  if (status === 0) emit('logged', null)
  else if (status > 0) await ui.diagDisplay($t('HPopsret_' + status))
}

const authPIN = async () => {
  const status = await sf.openSafeByPin(pin.inp, selectedUser.value.userId)
  if (status === 0) emit('logged', null)
  else if (status > 0) await ui.diagDisplay($t('HPbypin_' + status))
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background: $grey-7 !important }
</style>
