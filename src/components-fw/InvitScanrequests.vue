<!-- Mon component
-->
<template>
<div class="column full-width items-center">

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'

import stores from '../stores/all'
import { $t, sty, dkli, dhcool } from '../src-fw/util'

import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe


</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
