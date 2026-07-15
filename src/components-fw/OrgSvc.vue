<!-- Saisie du couple Service / Organisation
-->
<template>
  <div class="row items-center cursor-pointer bord1 q-mx-sm">
    <div class="col-auto row items-center" style="width:160px; height:28px;">
      <span class="col-4 font-mono text-bold">{{ cur.org }}</span>
      <span class="col-8 fs-md ellipsis">{{ $t('services_' + cur.svc) }}</span>
    </div>
    <q-icon class="col-auto q-ml-sm" name="arrow_drop_down" size="28px"/>
    <q-menu v-model="menu" anchor="top left" self="top left"
      transition-show="flip-up" transition-hide="flip-down">
      <div v-for="x in lst" 
        class="row select cursor-pointer" 
        style="width:300px; height:28px" @click="sel(x)">
        <div class="col-4 font-mono">{{ x[0] }}</div>
        <div class="col-8 fs-md ellipsis">{{ x[2] }}</div>
      </div>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, computed } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'

const session = stores.session
const cur =  computed(() => session.currentOrgSvc)
const lst = computed(() => session.lstOrgSvc )
const menu = ref(false)

watch(menu, (m) => {
  if (m) 
    lst.value.forEach(t => { t[2] = $t('services_' + t[1])})
})

const sel = (x) => {
  session.setOrg(x[0])
  session.setSvc(x[1])
  session.currentOrgSvc = { svc: x[1], org: x[0]}
  menu.value = false
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px }
</style>
