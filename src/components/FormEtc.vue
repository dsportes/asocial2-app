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
    <btn-cond v-if="editable" no-caps
      :label="$t('FORMbtncancel')" @ok="emit('action', 1)" color="warning"/>
    <btn-cond v-if="byU" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', 2)"/>
    <btn-cond v-if="byU" no-caps :disable="!validU"
      :label="$t('FORMbtnokp')" @ok="emit('action', 3)"/>
    <btn-cond v-if="byT" no-caps :disable="!hasChg"
      :label="$t('FORMbtnrecd')" @ok="emit('action', 4)"/>
    <btn-cond v-if="byT" no-caps :disable="!validT"
      :label="$t('FORMbtnokp')" @ok="emit('action', 5)"/>
  </div>

  <div class="titre-md q-mt-md">{{  $t('') }}</div>
  <md-editor model="curev.msg" :lgmax="500" :text="curev.msg" modetxt
    :editable="byU" @ok="chgMsg"/>
  <div class="titre-md q-my-sm">{{  $t('') }}</div>
  <md-editor class="q-mb-md"model="curev.msg" :lgmax="500" :text="newcom" modetxt
    :editable="byT" @ok="chgMsg"/>

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
import { ref, Ref, computed, watch, onMounted } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Form } from '../src-fw/documents'

/* action:
1: cancel
2: update U
3: validate U
4: update T
5: validate T
*/
const emit = defineEmits(['action'])

const sf = stores.safe
const ui = stores.ui

const curev = ui.currentEvent
const form: Ref<$Form> = computed(() => curev.form )

const editable = computed(() => form.value.status < 3 )
const byU = computed(() => form.value.userId === sf.userId)
const byT = computed(() => editable.value && form.value.userId !== sf.userId)

const validU = computed(() => 
  editable.value && form.value.etcT !== null && !hasChg.value && !diag.value)
const validT = computed(() => 
  editable.value && form.value.etcU !== null && !hasChg.value && !diag.value)

const hasChg = ref(false)
const diag = ref(0)

const chgMsg = async () => {
  if (byU.value) form.msgU = curev.msg
  if (byT.value) form.msgU = curev.msg
  await onChange()
}

const onChange = async () => {
  hasChg.value = false
  diag.value = ''
  if (byU.value) {
    diag.value = await form.value.checkEtc(curev.etc)
    hasChg.value = curev.msg !== form.value.msgU || form.value.eqEtc(form.value.etcU, curev.etc)
  }
  if (byT.value) {
    diag.value = await form.value.checkEtc(curev.etc)
    hasChg.value = curev.msg !== form.value.msgT || form.value.eqEtc(form.value.etcT, curev.etc)
  }
  if (hasChg.value) ui.setEditing(); else ui.resetEditing()
}

const init = async () => {
  ui.resetEditing()
  if (byU.value) {
    curev.msg = form.value.msgU
    curev.etc = form.value.etcU !== null ? form.value.cloneEtc(form.value.etcU) :
      (form.value.etcT ? form.value.cloneEtc(form.value.etcT) : form.value.initEtc(true))
  }
  if (byT.value) {
    curev.msg = form.value.msgT
    curev.etc = form.value.etcT !== null ? form.value.cloneEtc(form.value.etcT) :
      (form.value.etcU ? form.value.cloneEtc(form.value.etcU) : form.value.initEtc(false))
  }
  await onChange()
}

onMounted(async () => { await init() })

watch(form, async (v) => { 
  await init() 
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>