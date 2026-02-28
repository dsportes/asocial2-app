<template> <!-- Gérer les credentials -->
<dialog-std2 v-model="adm" :title="$t('HPadmin_label')">
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-sm">
      <btn-cond flat size="lg" icon="check" color="warning"
        :label="$t('validate')" @ok="validate"
        :disable="nbChg === 0"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs">

    <div class="row q-my-sm q-px-xs">
      <q-select class="col-5" dense filled v-model="SVC"
        :options="services" emit-value :label="$t('service')"/>
      <div class="col-1"/>
      <input-A class="col-6" prefix="operator" v-model="$OP" size="oper"
        :list="config.K.FAVORITE_OPERATORS"/>
    </div>
    <btn-cond class="q-mt-md" icon='add_circle' :label=$t('HPadmin_add')
      :disable="!SVC || !$OP" @ok="addElt"/>

    <q-separator color="orange" class="q-my-sm"/>

    <div class="q-my-md text-center titre-md">{{$t('HPadmins_list')}}</div>
    <scroll-area class='pwsm'><template #default>
      <div :class="dkli(idx) + ' row'" v-for="([code, elt], idx) of lstAdmins" :key="code">
        <div class="col-1">
          <btn-cond v-if="elt.st !== 2" icon="close" color="warning"
            @ok="delElt"/>
          <btn-cond v-if="elt.st === 2" icon="undo" color="primary"
            @ok="undoElt"/>
        </div>
        <div class="col-1">
          <q-icon v-if="elt.st !== 0" :name="ic(elt)"/>
        </div>
        <div class="col-5 font-mono text-center">{{elt.svc}}</div>
        <div class="col-5 font-mono text-center">{{elt.op}}</div>
      </div>
    </template></scroll-area>

  </div>
  </div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, onUnmounted, watch } from 'vue'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { LocPref } from '../stores/safe-store'
import DialogStd2 from '../components-fw/DialogStd2.vue'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import InputA from '../components-fw/InputA.vue'
import PrefEditor from '../components/PrefEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
// import HelpButton from '../components-fw/HelpButton.vue'
import BarOpen from '../components-fw/BarOpen.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import { $t, dkli, dhcool, b64ToU8, u8ToB64 } from '../src-fw/util'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'

const props = defineProps ({
  idc: String
})

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const pe = computed(() => ui.dModels[idc2].edprf)
const adm = computed(() => ui.dModels[props.idc].adminmgr)

const services = Array.from(Object.keys(config.K.SERVICES))

type Elt = {
  st: number // O:inchangé 1:ajouté 2:supprimé
  svc: string
  op: string
}

const SVC = ref('')
const $OP = ref('')
const lstAdmins: Ref<Map<string, Elt>> = new Map()

const init = () => {
  if (!sf.auth.admins) return
  const y = sf.auth.admins.split('/')
  for(const x of y) {
    const y = x.split('.')
    lstAdmins.value.set(x, { st:0, svc: y[0], op: y[1]})
  }
}

init()

const ic = (elt) => elt.st === 1 ? 'add_circle' : (elt.st === 1 ? 'delete' : '')

const addElt = async () => {
  const k = SVC.value + '.' + $OP
  const elt = lstAdmins.value.get(k)
  const op = new Operation('SvcOpIsAdmin', SVC.value)
  const isAdmin = await op.post($OP.value)
  if (!isAdmin) {
    if (elt) elt.st = 2
    ui.diagDisplay($t('HPadmin_ko', [$OP.value, SVC.value]))
    return
  }
  if (elt) elt.st = 0
  else lstAdmins.value.set(k, { st:1, svc: SVC.value, op: $OP.value})
}

const delElt = async (elt) => {
  if (elt.st === 2) return
  if (elt.st === 0) elt.st = 2
  else lstAdmins.value.delete(elt.svc + '.' + elt.op)
}

const undoElt = async (elt) => {
  elt.st = 0
}

const nbChg = computed(() => {
  let n = 0
  for(const [,elt] of lstAdmins.value)
    if (elt.st !== 0) n++
  return n
})

const validate = async () => {
  const l = []
  for(const [k, elt] of lstAdmins.value)
    if (elt.st !== 2) l.push(k)
  await sf.setAdmins(lst)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-top { border-top: 1px solid $grey-5; }
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
.bord2c { border: 1px solid transparent; }
.bord2w { border: 1px solid $warning; }
.bord2g { border: 1px solid $green-5; }
.select:hover { background-color: $yellow-2; color: black; }
</style>
