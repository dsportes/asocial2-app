<!--
Edite le etc d'un Form
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])
-->
<template>
<div>
  <div class="q-mb-sm column items-center q-gutter-xs">
    <btn-cond v-if="creating" no-caps
      :label="$t('FORMbtnnocr' + (byU ? 'd' : 'p'))" @ok="noCreate"/>
    <btn-cond v-if="!creating && ui.editingInCourse" no-caps
      :label="$t('FORMbtnundo')" @ok="undo"/>
    <btn-cond v-if="byU && creating" no-caps
      :label="$t('FORMbtnrecd')" @ok="emit('action', { a: 6, chg: curev })"/>
    <btn-cond v-if="byT && creating" no-caps
      :label="$t('FORMbtnrecp')" @ok="emit('action', { a: 7, chg: curev })"/>
    <btn-cond v-if="byU && editable" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', { a: 2, chg: curev })"/>
    <btn-cond v-if="byU && editable" no-caps :disable="!validU"
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 3, chg: curev })"/>
    <btn-cond v-if="byT && editable" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', { a: 4, chg: curev })"/>
    <btn-cond v-if="byT && editable" no-caps :disable="!validT"
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 5, chg: curev })"/>
    <btn-cond v-if="editable && byU" no-caps
      :label="$t('FORMbtncancel')" @ok="emit('action', { a: 1, chg: {} })" color="warning"/>
  </div>

  <!-- Messages --------------------------------------------------------------->
  <div v-if="visU">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_d') }}</div>
    <md-editor v-if="byU" model="curev.msg" :lgmax="500" :text="form.msgU" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgU" :text="form.msgU" modetxt/>
  </div>

  <div v-if="visT">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_p') }}</div>
    <md-editor v-if="byT" model="curev.msg" :lgmax="500" :text="form.msgT" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgT" :text="form.msgT" modetxt/>
  </div>

  <!-- membrecodir --------------------------------------------------------------->
  <div v-if="form.type === 'membrecodir'" class="q-my-md">
    <div class="titre-md q-mt-md">{{  $t('TYPE_membrecodir_pseudo') }}</div>

    <div v-if="visU" class="row" items-center>
      <div class="col-1 titre-md text-italic">{{$t('FORMdem_1')}}</div>
      <input-b class="col-10 font-mono text-bold" size="pseudo" prefix="$t('FORMdem_2')"
        v-model="curev.etc.pseudo" :initval="form.etcU.pseudo"
        :disable="!byU" @validate="onChange"/>
      <btn-cond v-if="!byU" class="col-1" round icon="content_paste"
        @ok="curev.etc.pseudo = form.etcT.pseudo"/>
    </div>

    <div v-if="visT" class="row" items-center>
      <div class="col-1 titre-md text-italic">{{$t('FORMdprop_1')}}</div>
      <input-b class="col-10 font-mono text-bold" size="pseudo" prefix="$t('FORMprop_2')"
        v-model="curev.etc.pseudo" :initval="form.etcT.pseudo"
        :disable="!byT" @validate="onChange"/>
      <btn-cond v-if="!byT" class="col-1" round icon="content_paste"
        @ok="curev.etc.pseudo = form.etcU.pseudo"/>
    </div>
  </div>

  <!-- membreredaction --------------------------------------------------------------->
  <div v-if="form.type === 'membreredaction'">
  </div>

  <!-- auteur --------------------------------------------------------------->
  <div v-if="form.type === 'auteur'">
  </div>

  <!-- coauteur --------------------------------------------------------------->
  <div v-if="form.type === 'coauteur'">
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, watch, onMounted } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Form } from '../src-fw/documents'

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
const emit = defineEmits(['action'])

const props = defineProps({
  form: $Form
})

const sf = stores.safe
const ui = stores.ui

const curev = reactive({
  etc: null,
  msg: '',
  msgc: false,
  etcc: false
})

const hasChg = computed(() => curev.etcc || curev.msgc )
const diag = ref(0)

const editable = computed(() => props.form.status === 1 || props.form.status === 2 )
const creating = computed(() => props.form.status === 0 )
const byU = computed(() => props.form.userId === sf.userId)
const byT = computed(() => props.form.userId !== sf.userId)
const visU = computed(() => props.form.status === 0 && byU) || (props.form.status > 0)
const visT = computed(() => props.form.status === 0 && byT) || (props.form.status > 0)

const validU = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag.value && props.form.eqEtc(curev.etc, props.form.etcT))
const validT = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag.value && props.form.eqEtc(curev.etc, props.form.etcU))

const noCreate = async () => {
  const b = await ui.mayClose()
  if (b) emit('action', { a: 8, chg: {}})
}

const undo = async () => {
  await init()
}

const onChange = async () => {
  hasChg.value = false
  diag.value = ''
  if (byU.value) {
    diag.value = await props.form.checkEtc(curev.etc)
    curev.etcc = curev.msg !== props.form.msgU || props.form.eqEtc(props.form.etcU, curev.etc)
    curev.msgc = curev.msg !== props.form.msgU
  }
  if (byT.value) {
    diag.value = await props.form.checkEtc(curev.etc)
    curev.etcc = curev.msg !== props.form.msgT || props.form.eqEtc(props.form.etcT, curev.etc)
    curev.msgc = curev.msg !== props.form.msgT
  }
  if (!creating.value) {
    if (hasChg.value) ui.setEditing(); else ui.resetEditing()
  }
}

const init = async () => {
  if (!creating.value) ui.resetEditing()
  if (byU.value) {
    curev.msg = props.form.msgU
    curev.etc = props.form.etcU !== null ? props.form.cloneEtc(props.form.etcU) :
      (props.form.etcT ? props.form.cloneEtc(props.form.etcT) : props.form.initEtc(true))
  }
  if (byT.value) {
    curev.msg = props.form.msgT
    curev.etc = props.form.etcT !== null ? props.form.cloneEtc(props.form.etcT) :
      (props.form.etcU ? props.form.cloneEtc(props.form.etcU) : props.form.initEtc(false))
  }
  await onChange()
}

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>
