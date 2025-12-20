<template>
  <q-input style="min-width:11rem" v-model="pin" counter dense
    input-class="font-mono"
    :disable="disable"
    :type="type"
    :label="$t('PSpin')"
    :placeholder="$t('PSpinh')"
    bottom-slots
    :error="pinerr !== ''"
    :hint="$t('PSminmax', [minpin, maxpin]) + (!err ? $t('pressret') : '')"
    @keydown.enter.prevent="validate">
    <template v-slot:append>
      <btn-cond size="sm" class="q-mx-xs" :icon="isPwd ? 'visibility_off' : 'visibility'" round
        color="none" @ok="isPwd = !isPwd"/>
      <btn-cond size="sm" icon="check" :disable="pinerr !== ''"
        @click="validate" class="cursor-pointer" />
    </template>
    <template v-slot:error>{{$t(pinerr)}}</template>
  </q-input>
</template>

<script setup>
import { ref, computed } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'

const props = defineProps({
  disable: Boolean
})

const minpin = 8
const maxpin = 16

const emit = defineEmits(['ok'])

const isPwd = ref(false)
const type = computed(() => isPwd.value ? 'password' : 'text')
const pin = ref('')
const pinerr = computed(() => pin.value.length < minpin ? 'PScourt' : (pin.value.length > maxpin ? 'PSlong' : ''))
const err = computed(() => pinerr.value !== '')

const validate = async () => {
  if (err.value) return
  emit('ok', pin.value)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss'
</style>
