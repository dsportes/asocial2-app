<template>
  <div class="column full-width">
    <q-toolbar class="full-width tbs" dense>
      <q-toolbar-title class="titre-md text-italic">{{title}}</q-toolbar-title>
      <btn-cond size="sm" class="q-mx-xs" :icon="isPwd ? 'visibility_off' : 'visibility'" round 
        color="none" @ok="isPwd = !isPwd"/>
      <btn-cond size="sm" icon="check" round :disable="err" @ok="validate"/>
    </q-toolbar>
    <q-input class="q-mx-sm q-mb-sm" v-model="p0" counter dense
      input-class="font-mono"
      :type="type" 
      :label="$t('PSpseudo')" 
      :placeholder="$t('PSpseudoh')"
      bottom-slots
      :error="p0err !== ''"
      :hint="$t('PSminmax', [minp0, maxp0]) + (!err ? $t('pressret') : '')"
      @keydown.enter.prevent="validate">
      <template v-slot:append>
        <q-icon size="sm" name="close" @click="p0 = ''" class="cursor-pointer" />
      </template>
      <template v-slot:error>{{$t(p0err)}}</template>
    </q-input>
    <q-input class="q-mx-sm q-mb-sm" v-model="p1" counter dense
      input-class="font-mono"
      :type="type" 
      :label="$t('PSphrase')" 
      :placeholder="$t('PSphraseh')"
      bottom-slots
      :error="p1err !== ''"
      :hint="$t('PSminmax', [minp1, maxp1]) + (!err ? $t('pressret') : '')"
      @keydown.enter.prevent="validate">
      <template v-slot:append>
        <q-icon size="sm" name="close" @click="p1 = ''" class="cursor-pointer" />
      </template>
      <template v-slot:error>{{$t(p1err)}}</template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { Crypt } from '../src-fw/crypt'

const minp0 = 12
const maxp0 = 30
const minp1 = 24
const maxp1 = 40

const props = defineProps({
  title: String
})

const emit = defineEmits(['ok'])

const isPwd = ref(false)
const type = computed(() => isPwd.value ? 'password' : 'text')
const p0 = ref('')
const p1 = ref('')
const p0err = computed(() => p0.value.length < minp0 ? 'PScourt' : (p0.value.length > maxp0 ? 'PSlong' : ''))
const p1err = computed(() => p1.value.length < minp1 ? 'PScourt' : (p1.value.length > maxp1 ? 'PSlong' : ''))
const err = computed(() => p0err.value !== '' || p1err.value !== '')

const validate = async () => {
  if (err.value) return
  // static async strongHash (s1: string, s2: string, sep?: string) : Promise<string> {
  const p0h = await Crypt.strongHash(p0.value, '', '$&')
  const p1h = await Crypt.strongHash(p1.value, '', '$&')
  emit('ok', { p0: p0.value, p1: p1.value, p0h, p1h })
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>