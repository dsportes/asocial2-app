<template>
<div ref="coredacpage" class="column items-center">
<div class="pwmd" style="position:relative">
  <q-splitter v-model="splitterModel" horizontal 
    :style="'height:' + ui.appPage.ph">
    <template v-slot:before>
      <div v-if="session.planeMode" class="titre-md text-italic">{{ $t('CODIRplane') }}</div>
      <div v-else>
        <div v-if="!auteurs.length" class="titre-md text-italic">{{ $t('CODIRnoaut') }}</div>
        <div v-else class="q-pa-xs">
          <div v-for="(a, idx) in auteurs" :key="idx"
            :class="'row select cursor-pointer ' + dkli(idx)"
            @click="selAut(a)">{{ a.nomAuteur }}</div>
        </div>
      </div>
    </template>

    <template v-slot:after>
      <div v-if="!session.planeMode && aut.a" class="q-pa-xs">
        <div class="row justify-end">
          <btn-cond :label="$t('validate')" icon="check" confirm @ok="majAut"
            v-if="aut.newSection !== aut.a.section || aut.newNa !== aut.a.nomAuteur"/>
        </div>

        <div class="row items-center q-gutter-md">
          <div class="titre-md text-italic col-auto">{{ $t('CODIRsa') }}</div>
          <div class="font-mono">{{ aut.a.section }} - {{ aut.edv }}</div>
        </div>
        <select-enum svc="AS2" :org="ui.appPage.org" class="q-mb-sm q-ml-lg"
          v-model="aut.newSection" enum="Section" width="md"
          @select="majSection"/>

        <div class="row items-center q-gutter-md">
          <div class="titre-md text-italic col-auto">{{ $t('CODIRna') }}</div>
          <div class="font-mono">{{ aut.a.nomAuteur }}</div>
        </div>
        <line-edit :text="aut.newNa" @change="majNa" class="q-ml-lg"
          datasize="auteur" width="md"/>

        <div class="titre-md text-italic q-mt-sm">{{ $t('CODIRcreds') }}</div>
        <div v-for="([credId, c], idx) in aut.creds" :key="credId" 
          :class="'row q-ml-lg cursor-pointer ' + dkli(idx)" @click="openCred(credId, c)">
          <div class="col-3 font-mono q-pr-sm text-bold">{{ c.trig }}</div>
          <div class="col-9 text-italic q-pr-sm">{{ suspDispl(c.susp) }}</div>
        </div>
      </div>
    </template>
  </q-splitter>

</div>

<dialog-std0 vue="coredac" :title="$t('CODIRcred_tit', [aut.a.nomAuteur, curcred.props.trig])"
  v-if="dialogs.credmgnt" v-model="dialogs.credmgnt" vh="80">
  <q-tabs v-model="tab" dense class="tbp shadow-2">
    <q-tab name="suspc" :label="$t('CODIRcred_susp')"/>
    <q-tab name="delc" :label="$t('CODIRcred_del')" />
  </q-tabs>

  <div v-if="tab === 'delc'" class="q-ma-sm column items-center q-gutter-sm">
    <div class="titre-md text-italic text-center">{{ $t('CODIRcred_del2') }}</div>
    <date-time :title="$t('CODIRcred_del1')" v-model="ddel" @ok="okdel1 = true"/>
    <btn-cond class="self-end q-mr-sm" confirm :disable="!okdel1" :label="$t('validate')" color="warning" 
      icon="check" @ok="okSusp(1)"/>
  </div>

  <div v-if="tab === 'suspc'" class="q-ma-sm column items-center q-gutter-sm">
    <btn-cond v-if="curcred.props.susp" class="q-my-md" flat :label="$t('CODIRcred_susp4')"
      @ok="okSusp(2)"/>
    <div class="titre-md text-italic text-center">
      {{ $t('CODIRcred_susp' + (curcred.props.susp ? '3' : '2')) }}
    </div>
    <date-time2 :title="$t('CODIRcred_susp1')" v-model="dsusp"/>
    <div v-if="dsusp.length === 2" class="row items-center q-gutter-sm justify-between">
      <div class="col text-italic q-my-sm">{{ dsuspL }}</div>
      <btn-cond class="col-auto" confirm 
        :label="$t('iconfirm')" color="warning" 
        icon="check" @ok="okSusp(3)"/>
    </div>
  </div>
</dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, onMounted, watch, computed, reactive } from 'vue'
// @ts-ignore
import { date } from 'quasar'

import stores from '../stores/all'
import { $t, dkli } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum from '../components-fw/SelectEnum.vue'
import { Operation, DocEnums } from '../src-fw/operation'
import { $Credential } from '../src-fw/documents'
import { DocDescriptor } from '../src-fw/docDescriptor'
import DateTime from '../components-fw/DateTime.vue'
import DateTime2 from '../components-fw/DateTime2.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import { UpdateCredentialRedaction } from '../as2/operations'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const dialogs = reactive({
  credmgnt : false
})

const tab = ref('suspc')

const splitterModel = ref(33)
const auteurs = ref([])
const aut = reactive({ a: null, newSection: '', newNa: '', edv: '', creds: new Map() })

const selAut = async (a) => {
  aut.a = a
  aut.newSection = a ? a.section : ''
  aut.newNa = a ? a.nomAuteur : ''
  if (a) {
    aut.creds = new Map()
    for(let credId in a.creds) 
      aut.creds.set(credId, a.creds[credId])
    aut.edv = await DocEnums.label('AS2$Section', ui.appPage.org, aut.a.section)
  }
}

const majNa = (n) => { aut.newNa = n }
const majSection = (n) => { 
  aut.newSection = n[0] }

onMounted(() => {  ui.declarePh('coredacpage') })
watch(() => ui.screenHeight, () => { ui.resetPh() })

const cred = computed(() => {
  const m = sf.mySimpleCreds('AS2', ui.appPage.org, 'Redaction') as Map<string, $Credential>
  return Array.from(m.values())[0]
})

const listeAuteurs = async () => {
  if (!ui.appPage.org || !ui.appPage.section || session.planeMode) return
  const op = new Operation('ListeAuteursSection', 'AS2', ui.appPage.org)
  try {
    op.args.section = ui.appPage.section
    const c = cred.value
    await op.sign(c)
    const res = await op.post()
    auteurs.value = res.lst
  } catch (e) {
    await op.ko(e)
  }
}

const suspDispl = (susp) => {
  if (!susp) return $t('SUSPcred_0')
  const s = susp[0] ? date.formatDate(susp[0], 'YYYY-MM-DD HH:mm') : ''
  const e = susp[1] ? date.formatDate(susp[1], 'YYYY-MM-DD HH:mm') : ''
  if (susp[0] === 0) 
    return !e ? $t('SUSPcred_4') : $t('SUSPcred_2', [e])
  return !e ? $t('SUSPcred_1', [s]) : $t('SUSPcred_3', [s, e])
}

watch(() => [ui.appPage.org, ui.appPage.count], async () => { 
  await listeAuteurs() 
})

const majAut = async () => {
  const op = new Operation('MajAuteur', 'AS2', ui.appPage.org)
  const dd = DocDescriptor.get('AS2$Auteur')
  op.args.autpk = dd.pkValue(aut.a)
  if (aut.newNa) op.args.nomAuteur = aut.newNa
  if (aut.newSection) op.args.section = aut.newSection
  await op.sign(cred.value)
  try {
    console.log('majaut1')
    const res = await op.post()
    console.log('majaut2')
    if (res.status)
      await ui.diagDisplay($t('AUTko_' + res.status))
    await selAut(null)
    await listeAuteurs() 
  } catch (e) { 
    await op.ko(e)
  }
}

const curcred = reactive({
  props: null,
  id: ''
})
const ddel = ref(date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm'))
const dsusp = ref([0, 0])
const dsuspL = computed(() => suspDispl(dsusp.value) )
const okdel1 = ref(false)

const openCred = (credId, c) => {
  curcred.props = c
  curcred.id = credId
  dialogs.credmgnt = true
  dsusp.value = c.susp ? c.susp : [0, 0]
}

watch(tab, (v) => {
  if (v === 'delc') {
    okdel1.value = false
    ddel.value = date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm')
  } else {
    dsusp.value = [0, 0]
  }
})

const okSusp = async (t: number) => {
  if (t === 2) {
    if (dsusp.value) {
      console.log('okSusp', 
        dsusp.value[0] ? date.formatDate(dsusp.value[0], 'YYYY-MM-DD HH:mm') : 0,
        dsusp.value[1] ? date.formatDate(dsusp.value[1], 'YYYY-MM-DD HH:mm') : 0)
    } else console.log('okSusp', 0, 0)
  }

  const op = new UpdateCredentialRedaction('AS2', ui.appPage.org)
  const props = { ...curcred.props }
  if (t === 1) props.limit = Math.floor(Date.now() / 60000)
  else if (t === 2) delete props.susp
  else props.susp = dsusp.value
  const autid = aut.a.autid
  const autPk = DocDescriptor.get('AS2$Auteur').pkValue({ autid })
  const status = await op.run(curcred.id, 'Auteur', autPk, props, cred.value)

  dialogs.credmgnt = false
  dsusp.value = [0, 0]
  await listeAuteurs()
  for(const x of auteurs.value)
    if (x.autid === autid) { await selAut(x); return }
}

tab.value = 'suspc'

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
