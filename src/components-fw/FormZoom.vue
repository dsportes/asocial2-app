<template>
<div>
  <div class="q-ma-sm a-pa-sm bord1 full-width">
    <div class="font-mono fs-sm">{{ fctx.form.formId }}</div>
    <!--div class="q-my-sm text-bold titre-lg">{{ fctx.form.typeEd }}</div-->

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMorg') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ fctx.form.org }}</div>
    </div>

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMsvc') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ $t('services_' + fctx.form.svc)}}</div>
    </div>

    <div v-if="fctx.form.v !== 0" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMversion') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <div class="font-mono">{{ dhcool(fctx.form.v) }}</div>
        <div v-if="notView" class='titre-md text-bold text-warning text-italic'>
          {{$t('FORMnotv_u')}}</div>
      </div>
    </div>

    <div v-if="fctx.form.v !== 0" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMlimit') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ dhcool(fctx.form.maxLife * 1000) }}</div>
    </div>

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMstatus') }}</div>
      <div class="col-7 row items-center q-gutter-xs">
        <q-icon :name="stic[fctx.form.status]" :color="stclr[fctx.form.status]" size="24px"/>
        <div class="font-mono text-bold" :color="stclr[fctx.form.status]">
          {{ $t('FORMstatus_' + fctx.form.status) }}</div>
        </div>
    </div>

    <div v-if="!fctx.isDemand" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMuser') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <span>{{ fctx.form.userId }}</span>
        <span v-if="fctx.form.userId === sf.userId" class="text-bold q-ml-md">[{{ $t('me') }}]</span>
      </div>
    </div>

    <div v-if="fctx.isDemand" class="row items-start">
      <div class="col-5 titre-md text-italic items-center">
        <span>{{ $t('FORMcomment') }}</span>
        <btn-cond class="q-ml-sm" icon="edit" round
          @ok="edCom"/>
      </div>
      <div class="col-7 q-pl-sm font-mono">
        <div v-if="!fctx.comment && !fctx.form.comment">{{ $t('FORMnocomment') }}</div>
        <scroll-md v-else height="50px" class="q-mx-xs bord1 q-pa-xs"
          :text="fctx.comment || fctx.form.comment || ''"/>
      </div>
    </div>

  </div>

  <div v-if="fst.diag1 !== ''" class="q-my-sm msg byel">
    {{ $t('FORMdiag_' + fst.diag1) }}</div>
  <div v-if="fst.diag1 === '' && fst.diag2 !== ''" class="q-my-sm msg bred">
    {{ $t('FORMdiag_' + fst.diag2) }}</div>

  <div class="q-mb-sm column items-center q-gutter-xs">
    <btn-cond v-if="fst.creating" no-caps
      :label="$t('FORMbtnnocr' + (fctx.isDemand ? 'd' : 'p'))" @ok="action(8)"/>
    <btn-cond v-if="!fst.creating && ui.editingInCourse" no-caps
      :label="$t('FORMbtnundo')" @ok="fst.undo"/>
    <btn-cond v-if="fctx.isDemand && fst.creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="fst.diag1 !== ''"
      @ok="action(6)"/>
    <btn-cond v-if="!fctx.isDemand && fst.creating" no-caps
      :label="$t('FORMbtnrecp')" :disable="fst.diag1 !== ''"
      @ok="action(7)"/>
    <btn-cond v-if="fctx.isDemand && fst.editable && !fst.creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="!fst.hasChg || fst.diag1 !== ''"
      @ok="action(2)"/>
    <btn-cond v-if="fctx.isDemand && fst.editable && !fst.creating" no-caps
      :label="$t('FORMbtnokp')" :disable="!validU"
      @ok="action(3)"/>
    <btn-cond v-if="!fctx.isDemand && fst.editable && !fst.creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="!fst.hasChg || fst.diag1 !== ''"
      @ok="action(4)"/>
    <btn-cond v-if="!fctx.isDemand && fst.editable && !fst.creating" no-caps
      :label="$t('FORMbtnokp')" :disable="!validT"
      @ok="action(5)"/>
    <btn-cond v-if="fctx.isDemand && fst.editable && !fst.creating" no-caps
      :label="$t('FORMbtncancel')"
      @ok="action(1)" color="warning"/>
  </div>

  <!-- Messages --------------------------------------------------------------->
  <div v-if="fst.visU">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_d') }}</div>
    <md-editor v-if="fctx.isDemand" v-model="fst.upd.msg"
      :lgmax="500" :rows="3" :text="fctx.form.msgU" modetxt
      editable okbtn @ok="fst.onChange"/>
    <md-editor v-else model="fctx.form.msgU" :text="fctx.form.msgU" modetxt/>
  </div>

  <div v-if="fst.visT">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_p') }}</div>
    <md-editor v-if="!fctx.isDemand" v-model="fst.upd.msg"
      :lgmax="500" :rows="3" :text="fctx.form.msgT" modetxt
      editable okbtn @ok="fst.onChange"/>
    <md-editor v-else v-model="fctx.form.msgT" :text="fctx.form.msgT" modetxt/>
  </div>

  <form-etc/>

  <dialog-std0 v-if="dialogs.editcomment" v-model="dialogs.editcomment"
    :title="$t('FORMeditcom')" :vh="sm">
    <template #default>
      <md-editor v-model="newcom" editable :lgmax="250"
        :text="fctx.comment" modetxt :row="3"
        okbtn @ok="chgcomment"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref, computed, onMounted, watch, reactive } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'
import ScrollMd from '../components-fw/ScrollMd.vue'
import MdEditor from '../components-fw/MdEditor.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import FormEtc from '../components/FormEtc.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { $Form } from '../src-fw/documents'

export type FormCtx = {
  form: $Form,
  isDemand: boolean,
  comment: string
}

const stic = ['add', 'person', 'person_shield', 'check', 'close']
const stclr = ['primary', 'warning', 'warning', 'green-5', 'negative']

const fctx = defineModel<FormCtx>()

const emits = defineEmits(['done'])

const sf = stores.safe
const ui = stores.ui
const fst = stores.form

const notView = computed(() => fctx.value.isDemand && fctx.value.form.lv < fctx.value.form.v)

const dialogs = reactive({
  editcomment: false
})

const newcom = ref('')

const edCom = () => {
  newcom.value = fctx.value.comment || ''
  dialogs.editcomment = true
}

const validU = computed(() =>
  (fctx.value.form.status === 1 || fctx.value.form.status === 2) &&
  !fst.diag1.value && !fst.diag2.value &&
  fctx.value.form.eqEtc(fst.upd.etc, fctx.value.form.etcT))

const validT = computed(() =>
  (fctx.value.form.status === 1 || fctx.value.form.status === 2) &&
  !fst.diag1.value && !fst.diag2.value &&
  fctx.value.form.eqEtc(fst.upd.etc, fctx.value.form.etcU))

const chgcomment = async () => {
  if (newcom.value !== fctx.value.comment) {
    if (fctx.value.form.v !== 0) {
      const event = ui.currentEvent.event
      if (event) await event.mdEventUser(true, newcom.value)
    } else // en création. On passe le comment à createByU
      fctx.value.form.comment = newcom.value
  }
  dialogs.editcomment = false
}

watch(fctx, (v) => {
  fst.startEdit(v)
})

fst.startEdit(fctx.value)

onMounted(async () => {
  if (notView.value) {
    await ui.diagDisplay($t('FORMnotv_u'))
    const event = ui.currentEvent.event
    if (event)
      await event.mdEventUser(true)
  }
})

/* action:
1: cancel
2: update U
3: validate U
4: update T
5: validate T
6: create U
7: create T
8: renoncer à la création
*/
const action = async (a: number) => {
  ui.resetEditing()
  const f = fst.form
  const upd = fst.upd
  let ok = true
  switch (a) {
    case 1 : await f.cancelByU(); break
    case 2 : await f.updateByU(upd); break
    case 3 : await f.validateByU(upd); break
    case 4 : await f.updateByT(upd); break
    case 5 : await f.validateByT(upd); break
    case 6 : await f.createByU(upd); break
    case 7 : await f.createByT(upd); break
    case 8 : // renoncer à créer
      ok = false
      break
    default: return
  }
  emits('done', ok)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
