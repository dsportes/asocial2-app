<template>
<div class="column items-center">
  <div class="row justify-between q-gutter-md q-mb-md">
    <bar-title class="col" prefix="PAGEauteur" large/>
    <btn-cond class="col-auto" icon="sync" round @ok="init"/>
  </div>
  <scroll-area class="pwsm" size="sm">
    <div v-for="([credId, c], idx) in creds" :key="c.credId"
      :class="'cursor-pointer q-my-sm select row q-gutter-sm' + sty(idx)"
      @click="select(c)">
      <div class="col">{{ c.name }}</div>
      <div class="col-2">{{ c.props.trig || '' }}</div>
      <div class="col-auto font-mono">{{ credId.substring(0,5) }}</div>
    </div>
  </scroll-area>

  <div v-if="aut" class="pwsm q-my-md">
    <div class="row q-mb-sm">
      <div class="col-5 text-italic">{{ $t('AUTcol_trig') }}</div>
      <div class="col-7 q-pl-sm ">
        <line-edit :text="cred.props.trig || $t('AUTnotrig')" @change="editTrig"/>
      </div>
    </div>

    <div class="row">
      <div class="col-5 text-italic">{{ $t('AUTcol_id') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ aut.autid }}</div>
    </div>
    <div class="row">
      <div class="col-5 text-italic">{{ $t('AUTcol_na') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <line-edit :text="aut.nomAuteur" @change="majNA"/>
      </div>
    </div>
    <div class="row">
      <div class="col-5">{{ $t('AUTcol_sec') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <select-enum1 :svc="soa.svc" :org="soa.org"
          v-model="aut.section" enum="Section" size="md"
          @select="majSection"/>
      </div>
    </div>
    <div class="row">
      <div class="col-5">{{ $t('AUTcol_co', coauts.length) }}</div>
      <div class="col-7 row q-gutter-md q-pl-sm">
        <div v-for="cx in coauts" :key="cx.credId" @click="selCo(cx)"
          class="font-mono text-bold cursor-pointer select">
          [{{ cx.props.trig || cx.props.name }}]
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted } from 'vue'
import stores from '../stores/all'
import { $Credential, $Cred } from '../src-fw/documents'
import { $t, sty } from '../src-fw/util'
import { IDocStore } from '../stores/docs'
import { DocDescriptor } from '../src-fw/docDescriptor'
// import { AS2$Auteur } from '../as2/documents'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum1 from '../components-fw/SelectEnum1.vue'
import { Operation } from '../src-fw/operation'
import { $Subs, FW$Sync } from '../src-fw/subscription'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const creds: Ref<Map<string, $Credential>> = ref()
const soa = computed(() => session.currentOrgSvc )
const cred = ref(null)
const aut = ref(null)
const coauts: Ref<$Cred[]> = ref([])

const init = async () => { 
  creds.value = await sf.myFullCreds('Auteur') }
onMounted(async () => { await init()})

const subsAuteur = async (pk: string) => {
  const subs = $Subs.new(soa.value.svc, soa.value.org) as $Subs
  subs.setTitle('Test auteur').setDef('Auteur/' + pk, 'Hello victor')
  if (await subs.subscribe(false))
    console.log('subs done')
}

const syncAuteur = async (pk: string) : Promise<IDocStore> => {
  const sync = new FW$Sync(soa.value)
  const toSync = await sync.setDefs(['Auteur', pk])
  await sync.post(true)
  return sync.getStd()
}

const select = async (c: $Credential) => {
  cred.value = c
  await subsAuteur(c.docPk)

  const std = await syncAuteur(c.docPk)

  aut.value = std.getDoc('Auteur', c.docPk)

  if (!aut.value) {
    await ui.diagDisplay($t('AUTko'))
  } else {
    const subs = $Subs.new(soa.value.svc, soa.value.org) as $Subs
    subs.setTitle('Test auteur').setDef('Auteur/' + c.docPk, 'Hello victor')
    if (await subs.subscribe(false))
      console.log('subs done')
    const co = []
    for(const cr in aut.value.embedCreds)
      if (cr !== c.credId) co.push(aut.value.embedCreds[cr])
    coauts.value = co
  }
}

const editTrig = async (trig: string) => {
  const soa = session.currentOrgSvc
  const op = new Operation('UpdPropsCred', soa.svc, soa.org)
  const c = cred.value
  op.setArgs({ credId: c.credId, docCl: c.docCl, docPk: c.docPk, props: { trig: trig } })
  await op.sign(c)
  try {
    const res = await op.post()
    if (res.status) await ui.diagDisplay($t('STCR_' + res.status))
    else creds.value.get(c.credId).props = res.props
  } catch (e) { op.ko(e) }
}

const majNA = async (nomAuteur: string) => {
  if (await majAut(nomAuteur, null)) {
    if (await sf.updateCredName(cred.value.credId, nomAuteur))
      cred.value.name = nomAuteur
  }
}

const majSection = async (section: string) => {
  await majAut(null, section)
}

const majAut = async (nomAuteur: string, section: string) => {
  const soa = session.currentOrgSvc
  const pk = DocDescriptor.get('AS2$Auteur').pkValue(aut.value)
  const op = new Operation('MajAuteur', soa.svc, soa.org)
  op.args.autid = aut.value.autid
  if (nomAuteur) op.args.nomAuteur = nomAuteur
  if (section) op.args.section = section
  await op.sign(cred.value)
  try {
    const res = await op.post()
    if (res.status) {
      await ui.diagDisplay($t('AUTko_' + res.status))
      return false
    } else { 
      const std = await syncAuteur(pk)
      aut.value = std.getDoc('Auteur',pk)
      return aut.value || false
    }
  } catch (e) { op.ko(e); return false }
}

const selCo = (cx: $Cred) => {
  console.log('co-auteur', cx.credId, cx.props.name, cx.props.trig)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
