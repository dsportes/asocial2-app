<template>
<div ref="coredacpage" class="column items-center">
<div class="pwmd" style="position:relative">
  <q-splitter v-model="splitterModel" horizontal 
    :style="'height:' + ui.appPage.ph">
    <template v-slot:before>
      <div v-if="!auteurs.length" class="titre-md text-italic">{{ $t('CODIRnoaut') }}</div>
      <div v-else class="q-pa-xs">
        <div v-for="(a, idx) in auteurs" :key="idx"
          :class="'row select cursor-pointer ' + dkli(idx)"
          @click="selAut(a)">{{ a.nomAuteur }}</div>
      </div>
    </template>

    <template v-slot:after>
      <div v-if="!session.planeMode && aut.a" class="q-pa-xs">
        <div class="row justify-end">
          <btn-cond :label="$t('validate')" icon="check" confirm @ok="majAut"
            :disable="aut.newSection === aut.a.section && aut.newNa === aut.a.nomAuteur"/>
        </div>

        <div class="row items-center q-gutter-md">
          <div class="titre-md text-italic col-auto">{{ $t('CODIRsa') }}</div>
          <div class="font-mono">{{ aut.a.section }} - {{ DocEnums.label('AS2$Section', ui.appPage.org, aut.a.section) }}</div>
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

      </div>
    </template>
  </q-splitter>

</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, onMounted, watch, computed, reactive } from 'vue'
import stores from '../stores/all'
import { $t, dkli } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum from '../components-fw/SelectEnum.vue'
import { Operation, DocEnums } from '../src-fw/operation'
import { $Credential } from '../src-fw/documents'
import { DocDescriptor } from '../src-fw/docDescriptor'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const splitterModel = ref(33)
const auteurs = ref([])
const aut = reactive({ a: null, newSection: '', newNa: '' })

const selAut = (a) => {
  aut.a = a
  aut.newSection = a ? a.section : ''
  aut.newNa = a ? a.nomAuteur : ''
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
  if (!ui.appPage.org || !ui.appPage.section) return
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

ui.appPage.org = ''
ui.appPage.section = ''

watch(() => [ui.appPage.org, ui.appPage.section], async () => { 
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
    selAut(null)
    await listeAuteurs() 
  } catch (e) { 
    await op.ko(e)
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
