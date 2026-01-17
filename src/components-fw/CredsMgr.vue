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

  <bar-open :title="$t('HPcredslst_1')" :bubble="$t('HPcredslst_2')"/>
  <q-scroll-area style="height: 150px;width: 100%;" :barStyle="barStyle" :thumbStyle="thumbStyle"
    class='bord1 q-pa-xs'>
    <div :class="dkli(idx)" 
      v-for="([id, c], idx) of creds" :key="id">
      <div :class="crSel(c) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
        @click="selCred(c)">
        <div class="col-2 row">
          <q-icon v-if="c.st === 1" name="add_circle" size="18px"/>
          <q-icon v-if="c.st === 2" name="delete" size="18px"/>
          <div :class="!c.st || c.st === 3 ? 'q-ml-md' : ''">
            {{c.id.substring(0, 5)}}
          </div>
        </div>
        <div class="col-2 ellipsis q-px-xs">{{c.org}}</div>
        <div class="col-1 ellipsis q-pr-xs">{{c.type}}</div>
        <div :class="'col-7' + (c.st === 3 ? ' text-warning text-italic' : '')">{{c.about}}</div>
      </div>
    </div>
  </q-scroll-area>

  <bar-open class="q-mt-md" :title="$t('HPcredsdet_1')" :bubble="$t('HPcredsdet_2')"/>
  <div class='bord1 q-pa-xs'>
    <div v-if="cred === null" class="titre-md text-italic">{{$t('HPcredno')}}</div>
    <div v-else class="column">
      <div class="q-my-xs">{{$t('HPcreddet_0', [cred.org, cred.type, cred.clazz])}}</div>
      <div class="q-my-xs">{{cred.about}}</div>
      <text-zoom :label="$t('HPcreddis')" :text="cred.toJson"/>
      <btn-cond class="self-end" v-if="cred.st" flat :icon="icons[creds.st]" 
        :label="$t('HPcredac_' + cred.st)" @ok="doAction" color="warning"/>
    </div>
  </div>
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
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, sty, equ8, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { Credential, testCred } from '../src-fw/credential'

const icons = ['', 'close', 'redo', 'redo']
/* 
Status d'un credential dans la liste
0 : inchangé
1 : ajouté à la liste
2 : retiré de la liste
3 : about mis à jour
Statut d'un credId dans la liste d'une session
0 : inchangé
1 : ajouté à la liste
2 : retiré de la liste
*/

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
if (props.creds) for(const [id, c] of props.creds) {
  c.st = 0
  creds.value.set(id, c)
}

const testCreds = ref(testCred())
let i = 0
if (testCreds.value) for(const [id, c] of testCreds.value) {
  c.st = i++
  creds.value.set(id, c)
}

const cred = ref(null)
const crSel = (c) => {
  let x = cred.value && cred.value.id === c.id ? 'bord2w ' : 'bord2c '
  if (c.st === 1) x += 'text-bold text-warning '
  else if (c.st === 2) x += 'text-italic text-grey-7 '
  return x
}

const selCred = (c) => {
  cred.value = c
}

const doAction = () => {

}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.select:hover { background-color: $yellow-2; color: black; }
</style>