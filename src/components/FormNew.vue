<!--Composant de saisie des données pour création d'un nouveau Form
selon son type.
-->
<template>
<div>
  <div v-if="!isDemand">
    <q-expansion-item :label="$t('FORMnewex')" v-model="exp" group="g1"
      dense switch-toggle-side class="q-ma-sm full-width"
      header-class="text-bold titre-md text-italic">
      <input-b class="q-my-sm"
        v-model="alias" size="alias" prefix="FORMuseralias" @validate="valA"/>
    </q-expansion-item>
    <q-expansion-item :label="$t('FORMnewinv')" group="g1"
      dense switch-toggle-side class="q-ma-sm full-width"
      header-class="text-bold titre-md text-italic">
      <input-b class="q-my-sm"
        v-model="pfx" size="pseudo" prefix="FORMpfxinv" @validate="valP"/>
      <div v-if="invitCode" class="column q-mt-md items-center q-gutter-sm">
        <div class="titre-lg text-italic text-center">{{ $t('FORMinvcode') }}</div>
        <div class="font-mono fs-xxl">{{ invitCode }}</div>
        <btn-cond :label="$t('FORMcopythat')" color="warning"
          size="lg" @ok="validInv" padding="xs sm"/>
      </div>
    </q-expansion-item>

  </div>
  <div v-if="diag" class="msg q-my-sm">{{  diag }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { $Form } from '../src-fw/documents'
import { FormType } from '../src-fw/docDescriptor'
import { $t } from '../src-fw/util'
import InputB from '../components-fw/InputB.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const encoder = new TextEncoder()

const emit = defineEmits(['done'])

const props = defineProps({
  formType: FormType,
  isDemand: Boolean
})

const sf = stores.safe
const ui = stores.ui
ui.navBar.hasback = false

const exp = ref(true)
const diag = ref()
const estComite = computed(() => props.formType.svc === 'AS2' && (
  props.formType.type === 'membrecodir' || 
  props.formType.type === 'membreredaction'))

// Proposition par un tiers au user ayant cet alias
const alias = reactive({ inp: '', err: '' })
const pfx = reactive({ inp: '', err: '' })
const invitCode = ref('')

const valA = async () => {
  const cf = ui.currentForm
  const userId = await userIdFromAlias()
  if (userId) {
    const form = $Form.basicForm(cf.soa, props.formType.type, userId)
    form.opts.alias = alias.inp
    emit('done', form)
  }
}

const valP = () => {
  invitCode.value = pfx.inp + '@' + Crypt.rnd(3)
}

const validInv = async () => {
  const cf = ui.currentForm
  const userId = Crypt.rnd(15)
  const st = await sf.createInvit(userId, invitCode.value) 
  if (st === 0) {
    const form = $Form.basicForm(cf.soa, props.formType.type, userId)
    form.isInvit = true
    form.msgT = encoder.encode(invitCode.value + ' / ' + userId)
    form.opts.alias = invitCode.value
    emit('done', form)
  } else {
    await ui.diagDisplay($t('FORMinvko'))
  }
}

const userIdFromAlias = async () => {
  const hsha = Crypt.shaS(await Crypt.strongHash(alias.inp, false, true))
  const icvs = await sf.mdUserGetICVS(hsha)
  if (icvs) return icvs.i
  diag.value = $t('APnouser')
  return ''
}

if (estComite.value) {
  const cf = ui.currentForm
  if (props.isDemand) {
    const form = $Form.basicForm(cf.soa, props.formType.type, sf.userId)
    if (cf.asAdmin) form.opts.asAdmin = true
    form.opts.alias = ''
    emit('done', form)
  }
}

if (props.formType.type === 'auteur' || props.formType.type === 'coauteur') {
  const cf = ui.currentForm
  if (props.isDemand) {
    const form = $Form.basicForm(cf.soa, props.formType.type, sf.userId)
    emit('done', form)
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bred { border: 2px solid $negative; border-radius: 5px; }
.byel { border: 2px solid var(--q-msgbg); border-radius: 5px; }
</style>
