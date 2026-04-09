<template>
<dialog-std2 v-model="model" vue="AdminMgr"
  :title="$t('HPadminA_label')" tbclass="tbs">
  <template #hdr>
    <div class="row justify-end q-px-xs q-mb-sm">
      <btn-cond flat size="lg" icon="check" color="warning"
        :label="$t('validate')" @ok="validate"
        :disable="disval()"/>
    </div>
  </template>

<template #default>
  <div class="column items-center">
    <div class="pwsm q-pa-xs column items-center">
      <service-op v-model="svcop" class="full-width q-my-sm q-px-xs"/>

      <btn-cond class="q-mt-md" icon='add_circle' :label="$t('HPadminA_add')"
        :disable="!svcop.SVC || !svcop.$OP" @ok="addElt"/>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="q-my-md text-center titre-md">{{$t('HPadminA_lst')}}</div>
      <div class="q-my-md text-center titre-md text-italic text-warning">{{$t('HPadminA_val')}}</div>
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

  </div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, reactive, watch } from 'vue'

import { $t, dkli } from '../src-fw/util'
import { Operation } from '../src-fw/operation'
import stores from '../stores/all'

import ServiceOp from '../components-fw/ServiceOp.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

import DialogStd2 from '../dialogs-fw/DialogStd2.vue'

const sf = stores.safe
const ui = stores.ui
const model = defineModel()

const emit = defineEmits(['done'])
watch(model, (v: boolean) => { if (v) init() })
const init = () => {
  resetAdm()
}

const disval = () => nbChg.value === 0

type Elt = {
  st: number // O:inchangé 1:ajouté 2:supprimé
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
    lstAdmins.value.set(x, { st:0, svc: y[0], op: y[1]})
  }
}

const ic = (elt) => elt.st === 1 ? 'add_circle' : (elt.st === 1 ? 'delete' : '')

const addElt = async () => {
  const k = svcop.SVC + '.' + svcop.$OP
  const elt = lstAdmins.value.get(k)
  if (elt && elt.st === 1) return
  const op = new Operation('SvcOpIsAdmin', svcop.SVC, '', svcop.$OP)
  try {
    /* const u = */ await op.getBaseUrl()
  } catch(e) {
    await ui.diagDisplay($t('HPadminkosvc'))
    return
  }
  const ret = await op.post()
  if (!ret.isadmin) {
    if (elt) elt.st = 2
    ui.diagDisplay($t('HPadminA_ko', [svcop.$OP, svcop.SVC]))
    return
  }
  if (elt) elt.st = 0
  else lstAdmins.value.set(k, { st: 1, svc: svcop.SVC, op: svcop.$OP})
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
  const lst: string[] = []
  for(const [k, elt] of lstAdmins.value)
    if (elt.st !== 2) lst.push(k)
  await sf.setAdmins(lst)
  await ui.diagDisplay($t('recorded'))
  resetAdm()
  emit('done', 'AdminMgr')
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
