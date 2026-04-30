<!-- Saisie du couple Service / Organisation
-->
<template>
  <div class="row items-center justify-between w1 cursor-pointer q-pl-xs"
    style="width:150px; height:40px">
    <div class="font-mono">{{ session.orgs.c }}</div>
    <q-icon name="arrow_drop_down" size="24px"/>
    <q-menu v-model="menu" anchor="top left" self="top left"
      transition-show="flip-up" transition-hide="flip-down">
      <input-A size="org" v-model="m" :initval="session.orgs.c"
        :list="session.orgs.lst" prefix="ORG"
        style="width:260px"
        @validate="val"/>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'
const session = stores.session
const menu = ref(false)
const m = ref(session.orgs.c)

const emit = defineEmits(['change'])
const val = () => {
  if (m.value !== session.orgs.c) {
    session.setOrg(m.value)
    emit('change', m.value)
  }
  menu.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
