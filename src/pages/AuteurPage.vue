<template>
<div class="column items-center">
  <div class="row justify-between q-gutter-md q-mb-md">
    <bar-title class="col" prefix="PAGEauteur" large/>
    <btn-cond class="col-auto" icon="sync" round @ok="init"/>
  </div>
  <scroll-area class="pwsm" size="sm">
    <div v-if="session.hasNet" v-for="([, c], idx) in creds" :key="c.credId"
      :class="'cursor-pointer q-my-sm select row q-gutter-sm' + sty(idx)"
      @click="select(c)">
      <div class="col-2">{{ c.org }}</div>
      <div class="col">{{ c.name }}</div>
      <div class="col-2">{{ c.props.trig || '' }}</div>
      <div class="col-auto font-mono">{{ c.docPk.substring(0,5) }}</div>
    </div>
    <div v-else v-for="(p, idx) in myPerims" :key="p.id"
      :class="'cursor-pointer q-my-sm select row q-gutter-sm' + sty(idx)"
      @click="selectp(p)">
      <div class="col-2">{{ p.org }}</div>
      <div class="col">{{ p.name }}</div>
      <div class="col-2">{{ p.code }}</div>
      <div class="col-auto font-mono">{{ p.docPk.substring(0,5) }}</div>
    </div>
  </scroll-area>

  <div v-if="aut" class="pwsm q-my-md">
    <div v-if="session.hasNet" class="row q-mb-sm">
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
      <div class="col-5 text-italic">{{ $t('AUTcol_np') }}</div>
      <div class="col-7 q-pl-sm font-mono"> {{  perimetre.name }}</div>
    </div>
    <div class="row">
      <div class="col-5 text-italic">{{ $t('AUTcol_na') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <line-edit :text="aut.nomAuteur" @change="majNA"
          :disable="session.planeMode"/>
      </div>
    </div>
    <div class="row">
      <div class="col-5">{{ $t('AUTcol_sec') }}</div>
      <div class="col-7 q-pl-sm font-mono">
        <select-enum1 svc="AS2" :org="org"
          v-model="aut.section" enum="Section" size="md"
          @select="majSection"
          :disable="session.planeMode"/>
      </div>
    </div>
    <div v-if="session.hasNet" class="row">
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
import { ref, Ref, computed, onMounted, watch } from 'vue'
import stores from '../stores/all'
import { $Credential, $Cred } from '../src-fw/documents'
import { $Perimeter } from '../src-fw/subscription'
import { $t, sty, dhcool } from '../src-fw/util'
import { getStore } from '../stores/docs'
// import { AS2$Auteur } from '../as2/documents'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum1 from '../components-fw/SelectEnum1.vue'
import { Operation } from '../src-fw/operation'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const creds: Ref<Map<string, $Credential>> = ref()
const myPerims: Ref<$Perimeter[]> = ref()
const org = ref()
const std = computed(() => getStore('AS2', org.value))
const perimetre = ref()
const cred = ref(null)

const aut = computed(() => 
  perimetre.value ? std.value.getDoc('Auteur', perimetre.value.docPk) : null)

watch(aut, (v) => { 
  console.log(v ? v.nomAuteur : 'personne') })

const coauts: Ref<$Cred[]> = computed(() => {
  const co = []
  if (aut.value && aut.value.embedCreds) for(const cr in aut.value.embedCreds)
      if (cr !== cred.value.credId) co.push(aut.value.embedCreds[cr])
  return co
})

const init = async () => { 
  if (session.hasNet)
    creds.value = await sf.myFullCreds('AS2', '', 'Auteur') 
  else {
    const l = []
    for (const [so, m2] of session.perims)
      if (so.startsWith('AS2'))
        for(const [, p] of m2) 
          if(p.docCl === 'Auteur') l.push(p)
    myPerims.value = l
  }
}

onMounted(async () => { await init()})

const selectp = async (p) => {
  org.value = p.org
  perimetre.value = p
  await std.value.fetch([perimetre.value])
}

const select = async (c: $Credential) => {
  cred.value = c
  org.value = c.org
  perimetre.value = session.getPerimeter('AS2', c.org, '', 'Auteur', c.docPk)

  setTimeout(async () => {
    while (perimetre.value) {
      await std.value.waitNextSync(perimetre.value)
      const t = std.value.getLastSyncTime(perimetre.value)
      console.log(`Le périmètre Auteur ${perimetre.value.docPk} a changé à ${dhcool(t, true)}`)
    }
  }, 1)
  await std.value.fetch([perimetre.value], true)
}

const editTrig = async (trig: string) => {
  const op = new Operation('UpdPropsCred', 'AS2', org.value)
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
  await majAut(nomAuteur, null)
  // if (await sf.updateCredName(cred.value.credId, nomAuteur)) cred.value.name = nomAuteur
}

const majSection = async (section: string) => {
  await majAut(null, section)
}

const majAut = async (nomAuteur: string, section: string) => {
  const op = new Operation('MajAuteur', 'AS2', org.value)
  op.args.autpk = cred.value.docPk
  if (nomAuteur) op.args.nomAuteur = nomAuteur
  if (section) op.args.section = section
  await op.sign(cred.value)
  try {
    console.log('majaut1')
    const res = await op.post()
    console.log('majaut2')
    if (res.status)
      await ui.diagDisplay($t('AUTko_' + res.status))
  } catch (e) { 
    await op.ko(e)
  }
}

const selCo = (cx: $Cred) => {
  console.log('co-auteur', cx.credId, cx.props.name, cx.props.trig)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
