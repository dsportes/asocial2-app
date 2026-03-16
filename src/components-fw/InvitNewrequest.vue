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
import { CreateInvit } from '../src-fw/operations'

import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const ui = stores.ui
const sf = stores.safe

const model = defineModel()
const emit = defineEmits(['close', 'done'])
const props = defineProps({ p1: String })

const SVC = ref()
const org = ref()
const major = ref()
const minor = ref('')
const label = ref('')
const txtm = ref('')
const comment = ref('')

const reset = () => {
  org.value = ''; major.value = ''; minor.value = ''
  label.value = ''; txtm.value = ''; comment.value = ''
}

reset()

const create = async () => {
  let status = -1
  const op = new CreateInvit(SVC.value)
  const invit = await op.run(org.value, major.value, minor.value, 
    txtm.value, label.value, comment.value)
  if (invit)
    status = await sf.createInvit(invit)
  await ui.diagDisplay(status ? $t('INCRko') : $t('INVcrok'))
  if (!status) reset()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
