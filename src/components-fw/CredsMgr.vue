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
      v-for="([id, lc], idx) of mlocCreds" :key="id">
      <div :class="crSel(lc) + 'row q-my-xs font-mono fs-md items-start cursor-pointer select'"
        @click="selCred(lc)">
        <div class="col-2 row">
          <q-icon v-if="lc.st === 1" name="add_circle" size="18px"/>
          <q-icon v-if="lc.st === 2" name="delete" size="18px"/>
          <div :class="!lc.st || lc.st === 3 ? 'q-ml-md' : ''">
            {{lc.cred.id.substring(0, 5)}}
          </div>
        </div>
        <div class="col-2 ellipsis q-px-xs">{{lc.cred.org}}</div>
        <div class="col-1 ellipsis q-pr-xs">{{lc.cred.type}}</div>
        <div :class="'col-7' + (lc.st === 3 ? ' text-warning text-italic' : '')">{{lc.cred.about}}</div>
      </div>
    </div>
  </q-scroll-area>

  <bar-open class="q-mt-md" :title="$t('HPcredsdet_1')" :bubble="$t('HPcredsdet_2')"/>
  <div class='bord1 q-pa-xs'>
    <div v-if="localCred === null" class="titre-md text-italic">{{$t('HPcredno')}}</div>
    <div v-else class="column">
      <div class="q-my-xs">{{$t('HPcreddet_0', [localCred.cred.org, localCred.cred.type, localCred.cred.clazz])}}</div>
      <div class="q-my-xs">{{localCred.cred.about}}</div>
      <text-zoom :label="$t('HPcreddis')" :text="localCred.cred.toJson"/>
      <btn-cond class="self-end" v-if="localCred.st" flat :icon="icons[localCred.st]" 
        :label="$t('HPcredac_' + localCred.st)" @ok="doAction" color="warning"/>
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

type LocalPS = { // profile ou session
  id: string
  about: string
  mst: Map<string, number> // Map des statuts des credIds
}

type LocalCred = {
  cred: Credential
  st: number
  psIds: Set<string> // Set des ids des sessions/profiles le référençant
}


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
  idc: String
})

const cm = computed(() => ui.dModels[props.idc].credsmgr)

const sf = stores.safe
const ui = stores.ui
const cfg = stores.config

const PS = ref(sf.isRegistered ? 'P' : 'S')

const mlocCreds: Ref<Map<string, LocalCred>>= ref(new Map<string, LocalCred>())
const mlocPS: Ref<Map<string, LocalPS>>= ref(new Map<string, LocalPS>())

/* Chargement des credentials */
{
  const x = sf.isRegistered ? sf.mySafeCreds : sf.tcreds
  if (x) for(const [, c] of x)
    mlocCreds.value.set(x.id, { cred: c, st: 0, psIds: new Set() })
}

{
  const x = testCred()
  let i = 0
  if (x) for(const [, c] of x) 
    mlocCreds.value.set(x.id, { cred: c, st: i++, psIds: new Set() })
}

/* Chargement des profiles / sessions */
{
  const isR = sf.isRegisterd
  const mx = isR ? sf.mySafeProfiles : sf.mySessions
  if (mx) for (const [id, x] of mx) {
    const mst: Map<string, number> = new Map()
    const prf = { id, about: x.about, mst }
    mlocPS.value.set(id, prf)
    for(const credId of (isR ? x.creds : x.credIds)) {
      mst.set(credId, 0)
      const tc = mlocCreds.get(credId)
      if (tc) tc.psIds.add(id)
    }
  }
}

const localCred = ref(null)
const crSel = (lc) => {
  if (!lc) return ''
  let x = localCred.value && localCred.value.cred.id === lc.cred.id ? 'bord2w ' : 'bord2c '
  if (lc.st === 1) x += 'text-bold text-warning '
  else if (lc.st === 2) x += 'text-italic text-grey-7 '
  return x
}

const selCred = (lc) => {
  localCred.value = lc
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