<template> <!-- Gérer les credentials -->
<dialog-std2 v-model="cm" :title="$t('HPcredsmgr_1')">
<template #hdr>
  <div class="row justify-end q-px-xs q-mb-md">
    <btn-cond flat size="lg" icon="check" :label="$t('validate')" />
  </div>
</template>

<template #default>
<div class="column items-center">
<div class="full-width q-pa-sm">

  <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
    class='bord1 q-pa-xs'>
    <div :class="dkli(idx)" 
      v-for="([id, c], idx) of creds" :key="id">
      <div :class="crSel(c) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
        @click="selCred(c)">
        <div class="col-2 ellipsis q-pr-xs">{{c.id}}</div>
        <div class="col-3 ellipsis q-pr-xs">{{c.app}}/{{c.org}}</div>
        <div class="col-1 ellipsis q-pr-xs">{{c.type}}</div>
        <div class="col-6">{{c.about}}</div>
      </div>
    </div>
  </q-scroll-area>

</div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive } from 'vue'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import InputPs from '../components-fw/InputPs.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import { $t, sty, equ8, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { Credential, testCred } from '../src-fw/credential'

const thumbStyle = { borderRadius: '5px', backgroundColor: '#027be3', width: '5px', opacity: 0.75 }
const barStyle = { borderRadius: '9px', backgroundColor: '#027be3', width: '9px', opacity: 0.2 }

const props = defineProps ({
  creds: Object,
  idc: String
})

const cm = computed(() => ui.dModels[props.idc].credsmgr)

const sf = stores.safe
const ui = stores.ui
const cfg = stores.config

const creds: Ref<Map<string, Credential>>= ref(new Map<string, Credential>())
if (props.creds) for(const [id, c] of props.creds) creds.value.set(id, c)

const testCreds = ref(testCred())
if (testCreds.value) for(const [id, c] of testCreds.value) creds.value.set(id, c)

const cred = ref()
const crSel = (c) => cred.value && cred.value.id === c.id ? 'bord2w ' : 'bord2c '
const selCred = (c) => {
  cred.value = c
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.select:hover { background-color: $yellow-2; color: black; }
</style>