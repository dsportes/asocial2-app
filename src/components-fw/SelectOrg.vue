<!-- Saisie du couple Service / Organisation
-->
<template>
  <div class="row items-center justify-between w1 cursor-pointer q-pl-xs"
    style="width:150px; height:40px">
    <div v-if="model" class="font-mono">{{ model }}</div>
    <div v-else class="text-italic text-grey-5">{{ $t('org') }}</div>
    <q-icon name="arrow_drop_down" size="24px"/>
    <q-menu v-model="menu" anchor="top left" self="top left"
      transition-show="flip-up" transition-hide="flip-down">
      <input-A size="org" v-model="m" :initval="initval"
        :list="lst" prefix="ORG"
        style="width:260px"
        @validate="val"/>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'

const session = stores.session
const lst = computed(() => session.orgs.lst)

const model = defineModel()
const props = defineProps({
  initval: String
})
const emit = defineEmits(['change'])

const menu = ref(false)
const m = ref()

const val = () => {
  if (m.value !== model.value) {
    model.value = m.value
    session.addOrg(m.value)
    emit('change', m.value)
  }
  menu.value = false
}

const init = () => {
  m.value = props.initval || ''
  model.value = props.initval || ''
}

watch(() => props.initval, () => init() )

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
