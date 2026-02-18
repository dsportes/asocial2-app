<template>
<div class="column items-center">
  <div class="row items-center q-gutter-sm">
    <div class="titre-md text-italic">{{ $t('APservices') }}</div>
    <div v-for="svc in servicesAdmin" :key="svc" 
      class="font-mono text-bold">{{svc}}</div>
  </div>
</div>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'
/*
// @ts-ignore
import { saveAs } from 'file-saver'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnConfirm from '../components-fw/BtnConfirm.vue'
import InputPs from '../components-fw/InputPs.vue'
import InputA from '../components-fw/InputA.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
// import BtnConfirm from '../components-fw/BtnConfirm.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
// import ChooseIt from '../components-fw/ChooseIt.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import BarOpen1 from '../components-fw/BarOpen1.vue'
import { $t, sty, dkli, dhcool } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
*/
// import anonymousW from '../assets/anonymous_white.png'
// import anonymousB from '../assets/anonymous_black.png'
// import databaseW from '../assets/database_white.png'
// import databaseB from '../assets/database_black.png'
// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
// const sf = stores.safe
const session = stores.session
// const cfg = stores.config

const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

const servicesAdmin = computed(() => session.servicesAdmin() || [] )

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>