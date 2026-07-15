<template>
<div>
  <bar-title prefix="PAGEauteur" large/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'
// import { keyToB64 } from '../src-fw/b64'
// import { Operation } from '../src-fw/operation'
// import { Crypt } from '../src-fw/crypt'
// import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'

// const decoder = new TextDecoder()
// const encoder = new TextEncoder()

// const ui = stores.ui
// const session = stores.session

const dialogs = reactive({
  selCode: false
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
