<template>
<div ref="autpage">
<div v-if="tab === 1" class="column items-center">
  <q-splitter v-model="splitterModel" horizontal class="pwsm" :style="pageh">
    <template v-slot:before>
      <btn-cond label="test-setenum" @ok="setEnum"/>
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
    </template>

    <template v-slot:after>
      <div v-if="aut" class="q-my-sm" style="position:relative;">
        <btn-cond icon="open_in_new" @ok="goto2" size="lg" flat
          style="position:absolute;right:0;top:0" />
        <div class="fs-xs font-mono">{{ aut.autid }}</div>
        <div v-if="session.hasNet" class="row">
          <div class="col-5 text-italic">{{ $t('AUTcol_trig') }}</div>
          <div class="col-7 q-pl-sm ">
            <line-edit :text="cred.props.trig || $t('AUTnotrig')" 
              width="sm" datasize="trig" @change="editTrig"/>
          </div>
        </div>
        <div class="row">
          <div class="col-5 text-italic">{{ $t('AUTcol_np') }}</div>
          <div class="col-7 q-pl-sm font-mono">
            <line-edit :text="perimetre.name" @change="majNP"
              width="sm" :disable="session.planeMode"/>
          </div>
        </div>
        <div class="row">
          <div class="col-5 row items-center q-gutter-xs">
            <span class="text-italic">{{ $t('AUTna_label') }}</span>
            <btn-bubble :text="$t('AUTna_bub')"/>
          </div>
          <div class="col-7 q-pl-sm font-mono">
            <line-edit :text="aut.nomAuteur" @change="majNA"
              datasize="auteur" width="md"
              :disable="session.planeMode"/>
          </div>
        </div>
        <div class="row">
          <div class="col-5">{{ $t('AUTcol_sec') }}</div>
          <div class="col-7 q-pl-sm">
            <select-enum svc="AS2" :org="org"
              v-model="aut.section" enum="Section" width="md"
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
    </template>
  </q-splitter>
</div>
<div v-if="tab === 2" class="column items-center">
  <div class="q-ma-md">Mes publications ...</div>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch, useTemplateRef } from 'vue'
import stores from '../stores/all'
import { $Credential, $Cred } from '../src-fw/documents'
import { $Perimeter } from '../src-fw/subscription'
import { $t, sty, dhcool } from '../src-fw/util'
import { getStore } from '../stores/docs'
// import { AS2$Auteur } from '../as2/documents'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import SelectEnum from '../components-fw/SelectEnum.vue'
import { Operation, DocEnums } from '../src-fw/operation'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const autpage = useTemplateRef('autpage')

const pageh = ref(100)
const ph = () => { setTimeout(() => {
    const h = autpage.value.parentNode.style.minHeight
    pageh.value = 'height:' + h + ';'
    //console.log(pageh.value)
  },5)
}

onMounted(() => {
  ph()
})

watch(() => ui.screenHeight, () => {
  ph()
})

ui.appPage.tab = 1
ui.appPage.btnInit = 1
ui.appPage.btnAdd = 1
ui.appPage.btnVal = 1
ui.appPage.btnUndo = 1
ui.navBar.hasBack = true

watch(() => ui.appPage.btnInit, async () => { await init() })
watch(() => ui.appPage.btnVal, async () => { await val() })
watch(() => ui.appPage.btnAdd, async () => { await add() })
watch(() => ui.appPage.btnUndo, async () => { undo() })

const tab = computed(() => ui.appPage.tab )

const goto2 = () => {
  ui.appPage.tab = 2
  ui.appPage.aut = aut.value
  ui.navBar.hasBack = true
  ui.navBar.nb = 0
  ui.navBar.idx = 0
}

const splitterModel = ref(33)

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

const majNP = async (nom: string) => {
  if (await sf.updateCredName(cred.value.credId, nom)) cred.value.name = nom
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

const add = async () => {

}
const val = async () => {

}
const undo = () => {

}

const setEnum = async () => {
  const val = ["10 roman", "20 Histoire", "30 sf", "40 politique"]
  const res = await DocEnums.set('AS2$Section', val, 'doda')
  console.log('ok')
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.selx:hover { background-color: $yellow-5; color: black }
.selx { cursor:pointer !important }
</style>
