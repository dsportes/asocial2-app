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
        <select-enum1 svc="AS2" :org="org"
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
import { ref, Ref, computed, onMounted, watch } from 'vue'
import stores from '../stores/all'
import { $Credential, $Cred, $Def, $Perimeter } from '../src-fw/documents'
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
const org = ref()
const std = computed(() => getStore('AS2', org.value))
const perimetre = ref()
const tx = ref(0)

const cred = ref(null)

const aut = computed(() => 
  cred.value ? std.value.getDoc('Auteur', cred.value.docPk) : null)

watch(aut, (v) => { 
  console.log(v ? v.nomAuteur : 'personne') })

const coauts: Ref<$Cred[]> = computed(() => {
  const co = []
  if (aut.value && aut.value.embedCreds) for(const cr in aut.value.embedCreds)
      if (cr !== cred.value.credId) co.push(aut.value.embedCreds[cr])
  return co
})

const init = async () => { 
  creds.value = await sf.myFullCreds('AS2', '', 'Auteur') }

onMounted(async () => { 
  await init()})

const select = async (c: $Credential) => {
  cred.value = c
  org.value = c.org
  perimetre.value = session.getPerimeter('AS2', c.org, '', 'Auteur', c.docPk) 
  watchUpdAut(perimetre.value, tx.value, (t) => {
    console.log(`Le périmètre Auteur ${c.docPk} a changé à ${dhcool(t)}`)
  })
  tx.value = await std.value.fetch([perimetre.value])
  if (tx.value === 0) tx.value = await std.value.listen(perimetre.value)
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
  if (await sf.updateCredName(cred.value.credId, nomAuteur))
    cred.value.name = nomAuteur
}

const majSection = async (section: string) => {
  await majAut(null, section)
}

const watchUpdAut = (p: $Perimeter, tx: number, onchg: Function) => {
  std.value.listen(p, tx).then(v => { tx = v; onchg(v); watchUpdAut(p, tx, onchg) })
}

const majAut = async (nomAuteur: string, section: string) => {
  const op = new Operation('MajAuteur', 'AS2', org.value)
  op.args.autpk = cred.value.docPk
  if (nomAuteur) op.args.nomAuteur = nomAuteur
  if (section) op.args.section = section
  await op.sign(cred.value)
  try {
    console.log('majaut1 ' + tx.value)
    const res = await op.post()
    console.log('majaut2 ' + tx.value)
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
