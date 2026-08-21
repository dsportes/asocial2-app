<template>
<div v-if="fctx && fst.form">
  <q-expansion-item 
    :label="$t('FORMabout') + $t('FORMstatus_' + fst.form.status) + (fst.form.isInvit ? ' [' + $t('FORMisinvit') + ']' : '')" 
    dense switch-toggle-side class="q-ma-sm full-width"
    header-class="text-bold titre-md text-italic">
    <div>
      <div class="font-mono fs-sm">{{ fst.form.formId }}</div>

      <div class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMorg') }}</div>
        <div class="col-7 q-pl-sm font-mono">{{ fst.form.org }}</div>
      </div>

      <div class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMsvc') }}</div>
        <div class="col-7 q-pl-sm font-mono">{{ $t('services_' + fst.form.svc)}}</div>
      </div>

      <div v-if="fst.form.v !== 0" class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMversion') }}</div>
        <div class="col-7 q-pl-sm font-mono">{{ dhcool(fst.form.v) }}</div>
      </div>

      <div v-if="fst.form.v !== 0" class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMlimit') }}</div>
        <div class="col-7 q-pl-sm font-mono">{{ dhcool(fst.form.maxLife * 1000) }}</div>
      </div>

      <div class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMstatus') }}</div>
        <div class="col-7 row items-center">
          <q-icon :name="stic[fst.form.status]" :color="stclr[fst.form.status]" size="28px"/>
          <div class="font-mono text-bold" :color="stclr[fst.form.status]">
            {{ $t('FORMstatus_' + fst.form.status) }}</div>
        </div>
      </div>

      <div v-if="!fst.isDemand" class="row items-center">
        <div class="col-5 titre-md text-italic">{{ $t('FORMuser') }}</div>
        <div class="col-7 q-pl-sm font-mono">
          <span>{{ fst.form.userId }}</span>
          <span v-if="fst.form.userId === sf.userId" class="text-bold q-ml-md">[{{ $t('me') }}]</span>
        </div>
      </div>

      <div v-if="fst.isDemand" class="row items-start">
        <div class="col-5 titre-md text-italic items-center">
          <span>{{ $t('FORMcomment') }}</span>
          <btn-cond class="q-ml-sm" icon="edit" round
            @ok="edCom"/>
        </div>
        <div class="col-7 q-pl-sm font-mono">
          <div v-if="!evcomment && !newcom">{{ $t('FORMnocomment') }}</div>
          <scroll-md v-else height="50px" class="q-mx-xs bord1 q-pa-xs"
            :text="newcom || evcomment"/>
        </div>
      </div>

    </div>
  </q-expansion-item>

  <div v-if="fst.diag1 !== ''" class="q-my-sm msg byel">
    {{ fst.diag1 }}</div>
  <div v-if="fst.diag1 === '' && fst.diag2 !== ''" class="q-my-sm msg bred">
    {{ fst.diag2 }}</div>
  <div v-if="!fst.diag" class="q-my-sm text-italic">
    {{ $t(fst.isDemand ? 'FORMdem_OK' : 'FORMprop_OK') }}</div>

  <div v-if="fst.form.status <= 2" class="q-mb-sm row justify-center q-gutter-sm">
    <btn-cond v-if="fst.creating" icon="check"
      :label="$t('FORMbtnnocr' + (fst.isDemand ? 'd' : 'p'))" @ok="action(8)"/>
    <btn-cond v-if="!fst.creating" icon="undo"
      :disable="!ui.editingInCourse" color="warning"
      :label="$t('FORMbtnundo')" @ok="doUndo"/>
    <btn-cond v-if="fst.isDemand && fst.creating" icon="add"
      :label="$t('FORMbtnrecd')" :disable="fst.diag"
      @ok="action(6)"/>
    <btn-cond v-if="!fst.isDemand && fst.creating" icon="add"
      :label="$t('FORMbtnrecp')" :disable="fst.diag"
      @ok="action(7)"/>
    <btn-cond v-if="fst.isDemand && fst.editable && !fst.creating" icon="check"
      :label="$t('FORMbtnrecd')" :disable="!fst.hasChg || fst.diag"
      @ok="action(2)"/>
    <btn-cond v-if="fst.isDemand && fst.editable && !fst.creating" icon="check"
      :label="$t('FORMbtnokp')" :disable="!validU"
      @ok="action(3)"/>
    <btn-cond v-if="!fst.isDemand && fst.editable && !fst.creating" icon="check"
      :label="$t('FORMbtnrecp')" :disable="!fst.hasChg || fst.diag"
      @ok="action(4)"/>
    <btn-cond v-if="!fst.isDemand && fst.editable && !fst.creating" icon="check"
      :label="$t('FORMbtnokp')" :disable="!validT"
      @ok="action(5)"/>
    <btn-cond v-if="fst.isDemand && fst.editable && !fst.creating" icon="close"
      :label="$t('FORMbtncancel')"
      @ok="action(1)" color="warning"/>
  </div>

  <!-- Messages --------------------------------------------------------------->
  <!--q-expansion-item v-model="exp['msg']" @before-show="fst.expOnShow('msg')"
    :label="$t('FORMmsg')" dense switch-toggle-side class="q-ma-sm full-width"
    header-class="text-bold titre-md text-italic"-->
  <form-exp name="msg" :label="$t('FORMmsg')">
    <template #default>
    <div class="q-ml-sm">
      <div v-if="fst.visU">
        <div class="titre-md q-mt-sm">{{  $t('FORMmsg_d') }}</div>
        <md-editor v-if="fst.isDemand && fst.form.status <= 2" v-model="fst.upd.msg"
          :lgmax="500" :rows="3" :text="fst.form.msgUS" modetxt editable/>
        <md-editor v-else model="fst.form.msgUS" :rows="3" disable
          :text="fst.form.msgUS" modetxt/>
      </div>

      <div v-if="fst.visT">
        <div class="titre-md q-mt-sm">{{  $t('FORMmsg_p') }}</div>
        <md-editor v-if="!fst.isDemand && fst.form.status <= 2" v-model="fst.upd.msg"
          :lgmax="500" :rows="3" :text="fst.form.msgTS" modetxt editable/>
        <md-editor v-else v-model="fst.form.msgTS" :rows="3" disable
          :text="fst.form.msgTS" modetxt/>
      </div>
    </div>
    </template>
  </form-exp>

  <form-etc/>

  <dialog-std0 v-if="dialogs.editcomment" v-model="dialogs.editcomment"
    :title="$t('FORMeditcom')" vh="sm">
    <template #default>
      <md-editor v-model="newcom" editable :lgmax="250"
        :text="evcomment" modetxt :row="3"
        okbtn @ok="chgcomment"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch, reactive } from 'vue'

import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'
import FormExp from '../components-fw/FormExp.vue'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import FormEtc from '../components/FormEtc.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { $Form } from '../src-fw/documents'

export type FormCtx = {
  form: $Form,
  isDemand: boolean
}

const stic = ['add', 'person', 'local_police', 'check', 'close']
const stclr = ['primary', 'warning', 'warning', 'green-5', 'negative']

const emits = defineEmits(['done'])

const dialogs = reactive({
  editcomment: false
})

const sf = stores.safe
const ui = stores.ui
const fst = stores.form
fst.setExp('msg')

const fctx = defineModel<FormCtx>()
fst.startEdit(fctx.value)
watch(() => fctx.value,
  () => { fst.startEdit(fctx.value) }) // quand on navigue par suiv. prec.

watch(() => fst.upd.msg, (v) => {
  fst.onChange()
})
const evcomment = computed(() => fst.isDemand && ui.currentEvent.event && ui.currentEvent.event.comment ?
  ui.currentEvent.event.comment : '')

const newcom = ref('')

const edCom = () => {
  newcom.value = fst.comment || ''
  dialogs.editcomment = true
}

const validU = computed(() =>
  (fst.form.status === 1 || fst.form.status === 2) &&
  !fst.diag1 && !fst.diag2 &&
  fst.form.eqEtc(fst.upd.etc, fst.form.etcT))

const validT = computed(() =>
  (fst.form.status === 1 || fst.form.status === 2) &&
  !fst.diag1 && !fst.diag2 &&
  fst.form.eqEtc(fst.upd.etc, fst.form.etcU))

const chgcomment = async () => {
  if (fst.form.v !== 0) {
    const event = ui.currentEvent.event
    if (event && (newcom.value !== event.comment)) {
      await event.mdEventUser(true, newcom.value)
      event.comment = newcom.value
    }
  } else // en création. On passe le comment à createByU
    fst.form.comment = newcom.value
  dialogs.editcomment = false
}

const doUndo = async () => {
  await fst.undo()
}

const action = async (a: number) => {
  ui.resetEditing()
  const f = fst.form
  const upd = fst.upd
  let ok = true
  switch (a) {
    case 1 : ok = await f.cancelByU(); break
    case 2 : ok = await f.updateByU(upd); break
    case 3 : ok = await f.validateByU(upd); break
    case 4 : ok = await f.updateByT(upd); break
    case 5 : ok = await f.validateByT(upd); break
    case 6 : ok = await f.createByU(upd); break
    case 7 : ok = await f.createByT(upd); break
    case 8 : ok = false; break // renoncer à créer
    default: ok = false
  }
  emits('done', ok)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
