<template>
<dialog-std2 v-model="model" vue="AdminMgr"
  :title="$t('HPadminA_label')" tbclass="tbs" noclose @close="closeIt">

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs column items-center">
      <service-op v-model="svcop" class="full-width q-my-sm q-px-xs"/>

      <btn-cond class="q-mt-md" icon='add_circle' :label="$t('HPadminA_add')"
        :disable="!svcop.SVC || !svcop.$OP" @ok="addElt"/>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="q-my-md text-center titre-md">{{$t('HPadminA_lst')}}</div>
      <scroll-area class='pwsm'><template #default>
        <div :class="dkli(idx) + ' row items-center'" v-for="([code, elt], idx) of lstAdmins" :key="code">
          <btn-cond class="col-1" icon="close" color="warning" @ok="delElt(elt)"/>
          <div class="col-7 font-mono text-center q-pr-md">{{$t('services_' + elt.svc)}}</div>
          <div class="col-4 font-mono text-center">{{elt.op}}</div>
        </div>
      </template></scroll-area>
    </div>

  </div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, dkli } from '../src-fw/util'
import { AOperation, isAdmin } from '../src-fw/operation'
import stores from '../stores/all'

import ServiceOp from '../components-fw/ServiceOp.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui
const model = defineModel()

const emit = defineEmits(['close'])
watch(model, (v: boolean) => { 
  if (v) resetAdm() 
})

const closeIt = () => {
  emit('close', true)
  model.value = false
}

type Elt = {
  svc: string
  op: string
}

const svcop = reactive({ SVC: '', $OP: '' })
// watch(svcop, (v) => { console.log(v.SVC) })
const lstAdmins: Ref<Map<string, Elt>> = ref(new Map())

const resetAdm = () => {
  lstAdmins.value.clear()
  if (!sf.auth.admins) return
  const y = sf.auth.admins.split('/')
  for(const x of y) {
    const y = x.split('.')
    lstAdmins.value.set(x, { svc: y[0], op: y[1]})
  }
}

resetAdm()

const addElt = async () => {
  const k = svcop.SVC + '.' + svcop.$OP
  if (lstAdmins.value.get(k)) return
  const u = await AOperation.urlOfSvcOp(svcop.SVC, svcop.$OP)
  if (!u) {
    await ui.diagDisplay($t('HPadminkosvc'))
    return
  }
  if (!await isAdmin(svcop.SVC, svcop.$OP)) {
    ui.diagDisplay($t('HPadminA_ko', [svcop.$OP, svcop.SVC]))
    return
  }
  lstAdmins.value.set(k, { svc: svcop.SVC, op: svcop.$OP})
  await validate()
}

const delElt = async (elt) => {
  lstAdmins.value.delete(elt.svc + '.' + elt.op)
  await validate()
}

const validate = async () => {
  const lst: string[] = []
  for(const [k] of lstAdmins.value) lst.push(k)
  const status = await sf.setAdmins(lst)
  // if (status === 0) await ui.diagDisplay($t('recorded'))
  resetAdm()
  // emit('done', 'AdminMgr')
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
