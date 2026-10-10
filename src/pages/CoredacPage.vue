<template>
<div class="column items-center">
  <div class="pwmd" style="position:relative">
    <q-splitter v-model="splitterModel" horizontal :style="sth">
      <template v-slot:before>
        <div v-if="session.planeMode" class="titre-md text-italic">{{ $t('COREDplane') }}</div>
        <div v-else>
          <div v-if="!auteurs.length" class="titre-md text-italic">{{ $t('COREDnoaut') }}</div>
          <div v-else class="q-pa-xs">
            <div v-for="(a, idx) in auteurs" :key="idx"
              :class="'row select cursor-pointer ' + dkli(idx)"
              @click="selAut(a)">{{ a.nomAuteur }}</div>
          </div>
        </div>
      </template>

      <template #separator>
        <q-btn color="primary" round size="xs" icon="drag_indicator"/>
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

          <select-enum2 svc="AS2" :org="ui.appPage.org" enum="Section"
            v-model="aut.a.section"
            class="q-mb-sm q-ml-lg" width="md"
            @select="majSection"/>

          <div class="row items-center q-gutter-md">
            <div class="titre-md text-italic col-auto">{{ $t('CODIRna') }}</div>
            <div class="font-mono">{{ aut.a.nomAuteur }}</div>
          </div>
          <line-edit :text="aut.newNa" @change="majNa" class="q-ml-lg"
            datasize="auteur" width="sm"/>

          <div class="titre-md text-italic q-mt-sm">{{ $t('CODIRcreds') }}</div>
          <div v-for="([, c], idx) in aut.a.creds" :key="c.credId" 
            :class="'row q-ml-lg cursor-pointer ' + dkli(idx)" @click="openCred(c)">
            <div class="col-3 font-mono q-pr-sm text-bold">{{ c.props.trig }}</div>
            <div class="col-9 text-italic q-pr-sm">{{ c.editSusp() }}</div>
          </div>
        </div>
      </template>
    </q-splitter>

  </div>

<rev-susp v-if="dialogs.credmgnt" v-model="dialogs.credmgnt"
  svc="AS2" :org="ui.appPage.org" :cred="cred" :curcred="curcred"
  :title="$t('CODIRcred_tit', [aut.a.nomAuteur, curcred.props.trig])"
  @done="onDone"
/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted, watch, computed, reactive } from 'vue'

import stores from '../stores/all'
import { $t, dkli } from '../src-fw/util'
import RevSusp from '../dialogs-fw/RevSusp.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum2 from '../components-fw/SelectEnum2.vue'
import { Operation, DocEnums } from '../src-fw/operation'
import { $Credential } from '../src-fw/documents'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { AS2$Auteur } from '../as2/documents'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const dialogs = reactive({
  credmgnt : false
})

const sth = computed(() => 'height:' + (ui.appPage.height - 30) + 'px;' )

const splitterModel = ref(33)
const auteurs: Ref<AS2$Auteur[]> = ref([])
const aut = reactive({ a: null, newSection: '', newNa: '', edv: '' })
const docPk = ref()
const curcred = ref()

const selAut = async (a) => {
  aut.a = a // AS2$Auteur
  aut.newSection = a ? a.section : ''
  aut.newNa = a ? a.nomAuteur : ''
  if (a)
    aut.edv = await DocEnums.label('AS2$Section', ui.appPage.org, aut.a.section)
}

const majNa = (n) => { aut.newNa = n }
const majSection = async (n) => { 
  aut.newSection = n 
  await majAut()
}

const cred = computed(() => {
  const m = sf.mySimpleCreds('AS2', ui.appPage.org, 'Redaction') as Map<string, $Credential>
  return Array.from(m.values())[0]
})

const listeAuteurs = async () => {
  await selAut(null)
  if (!ui.appPage.org || !ui.appPage.section || session.planeMode) return
  auteurs.value = await AS2$Auteur.listeParSection(ui.appPage.org, ui.appPage.section, cred.value)
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

const openCred = (c) => {
  curcred.value = c
  const autid = aut.a.autid
  docPk.value = DocDescriptor.get('AS2$Auteur').pkValue({ autid })
  dialogs.credmgnt = true
}

const onDone = async () => {
  dialogs.credmgnt = false
  await listeAuteurs()
  for(const x of auteurs.value)
    if (x.autid === aut.a.autid) { await selAut(x); return }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
