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
  
  <div v-if="diag1 !== ''" class="q-my-sm msg byel">
    {{ $t('FORMdiag_' + diag1) }}</div>
  <div v-if="diag1 === '' && diag2 !== ''" class="q-my-sm msg bred">
    {{ $t('FORMdiag_' + diag2) }}</div>

  <div class="q-mb-sm column items-center q-gutter-xs">
    <btn-cond v-if="creating" no-caps
      :label="$t('FORMbtnnocr' + (isDemand ? 'd' : 'p'))" @ok="noCreate"/>
    <btn-cond v-if="!creating && ui.editingInCourse" no-caps
      :label="$t('FORMbtnundo')" @ok="undo"/>
    <btn-cond v-if="isDemand && creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="diag1 !== ''"
      @ok="emit('action', { a: 6, chg: curev })"/>
    <btn-cond v-if="!isDemand && creating" no-caps
      :label="$t('FORMbtnrecp')" :disable="diag1 !== ''"
      @ok="emit('action', { a: 7, chg: curev })"/>
    <btn-cond v-if="isDemand && editable && !creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="!hasChg || diag1 !== ''"
      @ok="emit('action', { a: 2, chg: curev })"/>
    <btn-cond v-if="isDemand && editable && !creating" no-caps 
      :label="$t('FORMbtnokp')" :disable="!validU"
      @ok="emit('action', { a: 3, chg: curev })"/>
    <btn-cond v-if="!isDemand && editable && !creating" no-caps
      :label="$t('FORMbtnrecd')" :disable="!hasChg || diag1 !== ''"
      @ok="emit('action', { a: 4, chg: curev })"/>
    <btn-cond v-if="!isDemand && editable && !creating" no-caps
      :label="$t('FORMbtnokp')" :disable="!validT"
      @ok="emit('action', { a: 5, chg: curev })"/>
    <btn-cond v-if="isDemand && editable && !creating" no-caps
      :label="$t('FORMbtncancel')" 
      @ok="emit('action', { a: 1, chg: {} })" color="warning"/>
  </div>

  <!-- Messages --------------------------------------------------------------->
  <div v-if="visU">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_d') }}</div>
    <md-editor v-if="isDemand" model="curev.msg" 
      :lgmax="500" :rows="3" :text="form.msgU" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgU" :text="form.msgU" modetxt/>
  </div>

  <div v-if="visT">
    <div class="titre-md q-mt-md">{{  $t('FORMmsg_p') }}</div>
    <md-editor v-if="!isDemand" model="curev.msg" 
      :lgmax="500" :rows="3" :text="form.msgT" modetxt
      editable @ok="onChange"/>
    <md-editor v-else model="form.msgT" :text="form.msgT" modetxt/>
  </div>

  <!-- membrecodir --------------------------------------------------------------->
  <div v-if="form.type === 'membrecodir'" class="q-my-md">
    <div class="titre-md q-mt-md">{{  $t('TYPE_membrecodir_pseudo') }}</div>

    <div v-if="visU" class="row q-px-xs" items-center>
      <input-b class="col font-mono text-bold" size="pseudo" prefix="FORMdem_2"
        v-model="pseudo" noval :initval="curev.etc.pseudo || ''"
        :disable="!isDemand || !editable"/>
      <btn-cond v-if="!isDemand || !editable" class="col-auto" round icon="content_paste"
        @ok="curev.etc.pseudo = (form.etcT && form.etcT.pseudo ? form.etcT.pseudo : ''); onChange()"/>
    </div>

    <div v-if="visT" class="row q-px-xs" items-center>
      <input-b class="col-10 font-mono text-bold" size="pseudo" prefix="FORMprop_2"
        v-model="pseudo" noval :initval="curev.etc.pseudo || ''"
        :disable="isDemand || !editable"/>
      <btn-cond v-if="isDemand || !editable" class="col-1" round icon="content_paste"
        @ok="curev.etc.pseudo = (form.etcU && form.etcU.pseudo ? form.etcU.pseudo : ''); onChange()"/>
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
import { ref, reactive, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import MdEditor from '../components-fw/MdEditor.vue'
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
  form: $Form,
  isDemand: Boolean
})

const sf = stores.safe
const ui = stores.ui

const curev = reactive({
  etc: null,
  msg: '',
  msgc: false,
  etcc: false
})

const pseudo = reactive({ inp: '', err: '' })
watch(pseudo, async (v) => {
  curev.etc.pseudo = v.inp
  await onChange()
})

const hasChg = computed(() => curev.etcc || curev.msgc )
const diag1 = ref('')
const diag2 = ref('')

const editable = computed(() => props.form.status < 3 )
const creating = computed(() => props.form.status === 0 )
const visU = computed(() => props.form.status === 0 && props.isDemand) || (props.form.status > 0)
const visT = computed(() => props.form.status === 0 && !props.isDemand) || (props.form.status > 0)

const validU = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag1.value && !diag2.value &&
  props.form.eqEtc(curev.etc, props.form.etcT))
const validT = computed(() =>
  (props.form.status === 1 || props.form.status === 2) &&
  !diag1.value && !diag2.value &&
  props.form.eqEtc(curev.etc, props.form.etcU))

const noCreate = async () => {
  const b = await ui.mayClose()
  if (b) emit('action', { a: 8, chg: {}})
}

const undo = () => {
  init()
}

const onChange = async () => {
  const f = props.form
  diag1.value = fnCheck[f.type]()
  diag2.value = diag1.value ? '' : await f.checkEtc(curev.etc)
  if (props.isDemand) {
    curev.etcc = curev.msg !== f.msgU || f.eqEtc(f.etcU, curev.etc)
    curev.msgc = curev.msg !== f.msgU
  } else {
    curev.etcc = curev.msg !== f.msgT || f.eqEtc(f.etcT, curev.etc)
    curev.msgc = curev.msg !== f.msgT
  }
  if (!creating.value) {
    if (hasChg.value) ui.setEditing(); else ui.resetEditing()
  }
}

const init = () => {
  const f = props.form
  if (!creating.value) ui.resetEditing()
  if (props.isDemand) {
    curev.msg = f.msgU
    curev.etc = f.etcU ? f.cloneEtc(f.etcU) : (f.etcT ? f.cloneEtc(f.etcT) : f.initEtc(true))
  } else {
    curev.msg = f.msgT
    curev.etc = f.etcT ? f.cloneEtc(f.etcT) : (f.etcU ? f.cloneEtc(f.etcU) : f.initEtc(false))
  }
  setTimeout(async () => await onChange(), 1)
}

init()

/**********************************************************************************/
const fnCheck = {
  membrecodir: () : string => {
    return pseudo.err ? 'pseudo' : ''
  },

  membreredaction: () : string => {
    return ''
  },

  auteur: () : string => {
    return ''
  },

  coauteur: () : string => {
    return ''
  }

}
/**********************************************************************************/

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bred { border: 2px solid $negative; border-radius: 5px; }
.byel { border: 2px solid var(--q-msgbg); border-radius: 5px; }
</style>
