<template>
<dialog-std2 v-model="adm" :title="$t('HPadmin_label')" tbclass="tbs">
  <template #hdr>
    <q-tabs v-model="tab" dense class="primary text-white">
      <q-tab name="admins" :label="$t('HPtab_adm')"
        icon="img:icons/superman.jpg"/>
      <q-tab name="contact" :label="$t('HPtab_ctc')"
        icon="img:icons/anonymous_white.png"/>
    </q-tabs>
    <div class="row justify-end q-px-xs q-mb-sm">
      <btn-cond flat size="lg" icon="check" color="warning"
        :label="$t('validate')" @ok="validate"
        :disable="disval()"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div v-if="tab === 'admins'" class="pwsm q-pa-xs column items-center">

      <div class="row full-width q-my-sm q-px-xs">
        <q-select class="col-5" dense filled v-model="SVC"
          :options="services" emit-value :label="$t('service')"/>
        <div class="col-1"/>
        <input-a class="col-6" prefix="operator" v-model="$OP" size="oper"
          :list="config.K.FAVORITE_OPERATORS"/>
      </div>
      <btn-cond class="q-mt-md" icon='add_circle' :label="$t('HPadmin_add')"
        :disable="!SVC || !$OP" @ok="addElt"/>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="q-my-md text-center titre-md">{{$t('HPadmin_lst')}}</div>
      <scroll-area class='pwsm'><template #default>
        <div :class="dkli(idx) + ' row items-center'" v-for="([code, elt], idx) of lstAdmins" :key="code">
          <div class="col-1">
            <btn-cond v-if="elt.st !== 2" icon="close" color="warning"
              @ok="delElt(elt)"/>
            <btn-cond v-if="elt.st === 2" icon="undo" color="primary"
              @ok="undoElt(elt)"/>
          </div>
          <div class="col-1">
            <q-icon v-if="elt.st !== 0" :name="ic(elt)" size="sm"/>
          </div>
          <div class="col-5 font-mono text-center">{{elt.svc}}</div>
          <div class="col-5 font-mono text-center">{{elt.op}}</div>
        </div>
      </template></scroll-area>
    </div>

    <div v-if="tab === 'contact'" class="pwsm q-pa-xs column items-center">
      <input-a class="q-my-md full-width" prefix="HPctc" :initval="ctcav"
        v-model="ctc" :validatefn="setContact" size="contact"
        :valctrl="chCtc"/>
      <btn-cond class="q-my-md" :label="$t('HPctc_del')"
        icon="delete" color="warning"
        :disable="!ctcav"
        @ok="ctc = ''; setContact()"/>
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
import { Operation } from '../src-fw/operation'
import { AuthRecord } from '../src-fw/credential'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'

const props = defineProps ({
  idc: String
})

const sf = stores.safe
const ui = stores.ui
const session = stores.session
const config = stores.config

const pe = computed(() => ui.dModels[idc2].edprf)
const adm = computed(() => ui.dModels[props.idc].adminmgr)

const tab = ref('contact')
watch(tab, (t) => {
  if (t === 'contact') resetCtc()
  else if (t === 'admins') resetAdm()
})

const chCtc = () => ctc.value !== ctcav.value
const disval = () => tab.value === 'admins' ? nbChg.value === 0
  : (ctc.value.length < config.K.sizes.contact[0] || !chCtc())

const services = Array.from(Object.keys(config.K.SERVICES))

type Elt = {
  st: number // O:inchangé 1:ajouté 2:supprimé
  svc: string
  op: string
}

const SVC = ref('')
const $OP = ref('')
const lstAdmins: Ref<Map<string, Elt>> = ref(new Map())

const resetAdm = () => {
  lstAdmins.value.clear()
  if (!sf.auth.admins) return
  const y = sf.auth.admins.split('/')
  for(const x of y) {
    const y = x.split('.')
    lstAdmins.value.set(x, { st:0, svc: y[0], op: y[1]})
  }
}

const ctcav = ref('')
const ctc = ref('')

const resetCtc = () => {
  ctcav.value = sf.auth.contact
  ctc.value = ctcav.value || ''
}

resetAdm()
resetCtc()

const ic = (elt) => elt.st === 1 ? 'add_circle' : (elt.st === 1 ? 'delete' : '')

const addElt = async () => {
  const k = SVC.value + '.' + $OP.value
  const elt = lstAdmins.value.get(k)
  if (elt && elt.st === 1) return
  const op = new Operation('SvcOpIsAdmin', SVC.value)
  try {
    const u = await op.getBaseUrl($OP.value, '')
  } catch(e) {
    await ui.diagDisplay($t('HPadminkosvc'))
    return
  }
  const authRecord = await AuthRecord.create(SVC.value, $OP.value)
  const ret = await op.post({ authRecord, $OP: $OP.value })
  if (!ret.isadmin) {
    if (elt) elt.st = 2
    ui.diagDisplay($t('HPadmin_ko', [$OP.value, SVC.value]))
    return
  }
  if (elt) elt.st = 0
  else lstAdmins.value.set(k, { st: 1, svc: SVC.value, op: $OP.value})
}

const delElt = (elt) => {
  if (elt.st === 2) return
  if (elt.st === 0) elt.st = 2
  else lstAdmins.value.delete(elt.svc + '.' + elt.op)
}

const undoElt = async (elt) => {
  elt.st = 0
}

const nbChg = computed(() => {
  let n = 0
  if (lstAdmins.value) for(const [,elt] of lstAdmins.value)
    if (elt.st !== 0) n++
  return n
})

const validate = async () => {
  if (tab.value === 'ctc') {
    await setContact()
    return
  }
  const lst = []
  for(const [k, elt] of lstAdmins.value)
    if (elt.st !== 2) lst.push(k)
  await sf.setAdmins(lst)
  await ui.diagDisplay($t('recorded'))
  resetAdm()
}

const setContact = async () => {
  await sf.setContact(ctc.value)
  await ui.diagDisplay($t('recorded'))
  resetCtc()
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
