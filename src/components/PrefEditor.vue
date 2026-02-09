<template>
  <div>
    <div class="q-mb-md column items-center">
      <btn-cond icon="check" :label="$t('ok')" @ok="ok"/>
    </div>
    <div class="bord1 q-pa-sm column full-width">
      <q-toggle v-model="pref.btn1" label="Bouton 1 visible"/>
      <q-toggle v-model="pref.btn2" label="Bouton 2 visible"/>
      <q-input v-model="pref.title" label="Titre" />
      <q-input v-model="pref.lg" label="Langue" />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import BtnCond from '../components-fw/BtnCond.vue'
import { $t, dkli, dhcool, b64ToU8, u8ToB64 } from '../src-fw/util'
import stores from '../stores/all'

const session = stores.session
const ui = stores.ui
const emit = defineEmits(['ok'])

const pref = ref(decode(encode(session.edPref.obj)))

if (!pref.value.btn1) pref.value.btn1 = false
if (!pref.value.btn2) pref.value.btn2 = false
if (!pref.value.lg) pref.value.lg = 'FR'
if (!pref.value.title) pref.value.title = '(aucun)'

const hasChg = ref(false)

for(const p in pref.value)
  watch(() => pref.value[p], () => { 
    hasChg.value = false
    for(const x in pref.value) 
      if (session.edPref.obj[x] !== pref.value[x]) hasChg.value = true
  })

const ok = () => {
  emit('ok', pref.value, hasChg.value)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>