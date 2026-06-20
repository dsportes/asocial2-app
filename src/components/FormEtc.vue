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
    <btn-cond v-if="byU && creating" no-caps
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 6, chg: curev })"/>
    <btn-cond v-if="byT && creating" no-caps
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 7, chg: curev })"/>
    <btn-cond v-if="byU && editable" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', { a: 2, chg: curev })"/>
    <btn-cond v-if="byU && editable" no-caps :disable="!validU"
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 3, chg: curev })"/>
    <btn-cond v-if="byT && editable" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', { a: 4, chg: curev })"/>
    <btn-cond v-if="byT && editable" no-caps :disable="!validT"
      :label="$t('FORMbtnokp')" @ok="emit('action', { a: 5, chg: curev })"/>
    <btn-cond v-if="editable && byU" no-caps
      :label="$t('FORMbtncancel')" @ok="emit('action', { a: 1 })" color="warning"/>
  </div>

  <div v-if="(form.status === 0 && byU) || (form.status > 0)">
    <div class="titre-md q-mt-md">{{  $t('') }}</div>
    <md-editor v-if="byU" model="curev.msg" :lgmax="500" :text="form.msgU" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgU" :text="form.msgU" modetxt/>
  </div>

  <div v-if="(form.status === 0 && byT) || (form.status > 0)">
    <div class="titre-md q-mt-md">{{  $t('') }}</div>
    <md-editor v-if="byT" model="curev.msg" :lgmax="500" :text="form.msgT" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgT" :text="form.msgT" modetxt/>
  </div>

  <div v-if="form.type === 'membrecodir'">
  </div>

  <div v-if="form.type === 'membreredaction'">
  </div>

  <div v-if="form.type === 'auteur'">
  </div>

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

const validU = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag.value && props.form.eqEtc(curev.etc, props.form.etcT))
const validT = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag.value && props.form.eqEtc(curev.etc, props.form.etcU))

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
  if (hasChg.value) ui.setEditing(); else ui.resetEditing()
}

const init = async () => {
  ui.resetEditing()
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
