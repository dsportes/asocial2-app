<template>
<div>
  <!-- Authentification par code PIN -->
  <div v-if="sf.users.length" class="q-my-md">
    <bar-open v-if="sf.users.length === 1" :bubble="$t('LOGauthbypin_2')" center
      :title="$t('LOGauthbypin_1a', [sf.users[0].pseudo])"/>
    <bar-open v-else :bubble="$t('LOGauthbypin_2')" center
      :title="$t('LOGauthbypin_1b', [sf.users.length])"/>
    <div v-if="sf.users.length > 1"
      class="row full-width justify-center items-center q-gutter-sm">
      <btn-cond v-for="u in sf.users" :key="u.userId" padding="none xs"
        :label="u.pseudo" no-caps
        :size="u === selectedUser ? 'lg' : 'md'"
        :color="u === selectedUser ? 'warning' : 'primary'"
        @ok="selectUser(u)"/>
    </div>
    <div v-if="selectedUser" :class="sty('sm')">
      <div class="full-width q-pa-sm">
        <input-ps v-model="pin" prefix="PSpin" size="pin" :validatefn="authPIN"/>
      </div>
    </div>
    <q-separator color="orange" class="q-mt-lg"/>
  </div>

  <!-- Authentification "forte" -->
  <div class="full-width">
    <bar-open :bubble="$t('LOGauthstrong_2')" center 
      :title="$t('LOGauthstrong_1')" class="q-mb-sm"/>
    <p0-p1 @ok="authPS" class="full-width"/>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, watch } from 'vue'
import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import InputPs from '../components-fw/InputPs.vue'
import P0P1 from '../components-fw/P0P1.vue'
import BarOpen from '../components-fw/BarOpen.vue'

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

const authPS = async (args) => {
  const status = await sf.openSafeByPR(args.sh0, args.sh1, args.sh)
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
</style>