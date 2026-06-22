<template>
<div>
  <div class="q-ma-sm a-pa-sm bord1 full-width">
    <div class="font-mono fs-sm">{{ form.formId }}</div>
    <div class="q-my-sm text-bold titre-lg">{{ form.typeEd }}</div>

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMorg') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ form.org }}</div>
    </div>

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMsvc') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ $t('services_' + form.svc)}}</div>
    </div>

    <div v-if="form.v !== 0" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMversion') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <div class="font-mono">{{ dhcool(form.v) }}</div>
        <div v-if="notView" class='titre-md text-bold text-warning text-italic'>
          {{$t('FORMnotv_u')}}</div>
      </div>
    </div>

    <div v-if="form.v !== 0" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMlimit') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ dhcool(form.maxLife * 1000) }}</div>
    </div>

    <div class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMstatus') }}</div>
      <div class="col-7 row items-center q-gutter-xs">
        <q-icon :name="stic[form.status]" :color="stclr[form.status]"/>
        <div class="font-mono text-bold" :color="stclr[form.status]">
          {{ $t('FORMstatus_' + form.status) }}</div>
        </div>
    </div>

    <div v-if="!isDemand" class="row items-center">
      <div class="col-5 titre-md text-italic">{{ $t('FORMuser') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <span>{{ form.userId }}</span>
        <span v-if="form.userId === sf.userId" class="text-bold q-ml-md">[{{ $t('me') }}]</span>
      </div>
    </div>

    <div v-if="isDemand" class="row items-center">
      <div class="col-5 titre-md text-italic">
        <span>{{ $t('FORMcomment') }}</span>
        <btn-cond class="q-ml-sm" icon="edit" round
          @ok="edCom"/>
      </div>
      <div class="col-7 q-pl-sm font-mono">
        <div v-if="!comment">{{ $t('FORMnocomment') }}</div>
        <scroll-md v-else height="50px" :text="comment"/>
      </div>
    </div>

  </div>

  <form-etc v-if="form" @action="action" :form="form" :isDemand="isDemand"/>

  <dialog-std0 v-if="dialogs.editcomment" v-model="dialogs.editcomment"
    :title="$t('FORMeditcom')">
    <template #default>
      <md-editor model="newcom" editable :lgmax="250" :text="newcom" modetxt
        @ok="chgcomment"/>
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
import { $Form, Curev } from '../src-fw/documents'

const stic = ['add', 'person', 'person_shield', 'check', 'close']
const stclr = ['primary', 'warning', 'warning', 'green-5', 'negative']

const props = defineProps({
  form: $Form,
  isDemand: Boolean,
  comment: String
})

const emits = defineEmits(['done'])

const sf = stores.safe
const ui = stores.ui

const notView = computed(() => props.isDemand && props.form.lv < props.form.v)

const dialogs = reactive({
  editcomment: false
})

const newcom = ref('')

const edCom = () => {
  newcom.value = props.comment || ''
  dialogs.editcomment = true
}

const chgcomment = async () => {
  if (newcom.value !== props.comment) {
    if (props.form.v !== 0)
      await props.form.mdEventUser(true, newcom.value)
    else // en création. On passe le comment à createByU
      props.form.comment = newcom.value
  }
  dialogs.editcomment = false
}

if (notView.value)
  onMounted(async () => {
    await ui.diagDisplay($t('FORMnotv_u'))
    await props.form.mdEventUser(true)
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
const action = async (ev: { a: number, chg: Curev }) => {
  const x = ev.chg
  const f = props.form
  let ok = true
  switch (ev.a) {
    case 1 : await f.cancelByU(); break
    case 2 : await f.updateByU(x); break
    case 3 : await f.validateByU(x); break
    case 4 : await f.updateByT(x); break
    case 5 : await f.validateByT(x); break
    case 6 : await f.createByU(x); break
    case 7 : await f.createByT(x); break
    case 8 : // renoncer à créer
      ui.resetEditing()
      ok = false
      break
  }
  emits('done', ok)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
