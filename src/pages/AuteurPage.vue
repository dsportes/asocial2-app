<template>
<div>
<div v-if="ui.appPage.tab === 'auteurs'" class="column items-center">
  <q-splitter v-model="splitterModel" horizontal class="pwsm" :style="sth">
    <template v-slot:before>
      <div v-if="session.hasNet" v-for="([, c], idx) in creds" :key="c.credId"
        :class="'cursor-pointer q-my-sm select ' + sty(idx)"
        @click="select(c)">
        <div>
          <div class="row">
            <div class="col-2">{{ c.org }}</div>
            <div class="col-7">{{ c.name }}</div>
            <div class="col-2">{{ c.props.trig || '' }}</div>
            <div class="col-1 font-mono fs-xs ellipsis">{{ c.docPk.substring(0,5) }}</div>
          </div>
          <div class="row">
            <div class="col-2"></div>
            <div :class="'col-10 ' + (c.isSuspended ? 'text-bold text-warning' : 'text-italic')">
              {{ c.editSusp() }}</div>
          </div>
        </div>
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

    <template #separator>
      <q-btn color="primary" round size="xs" icon="drag_indicator"/>
    </template>

    <template v-slot:after>
    <div style="position:relative;" class="q-mt-md">
      <div v-if="cred">
      <div v-if="session.hasNet" class="row">
        <div class="col-5 text-italic">{{ $t('AUTcol_trig') }}</div>
        <div class="col-7 q-pl-sm ">
          <line-edit :text="cred.props.trig || $t('AUTnotrig')" 
            width="sm" datasize="trig" @change="editTrig"/>
        </div>
      </div>
      <div class="row">
        <div class="col-5 text-italic">{{ $t('AUTcol_stp') }}</div>
        <div :class="'col-7 ' + (cred.isSuspended ? 'text-bold text-warning' : 'text-italic')">
          {{ cred.editSusp() }}</div>
      </div>
      <div class="row">
        <div class="col-5 text-italic">{{ $t('AUTcol_np') }}</div>
        <div class="col-7 q-pl-sm font-mono">
          <line-edit :text="perimetre.name" @change="majNP"
            width="sm" :disable="session.planeMode"/>
        </div>
      </div>
      </div>

      <div v-if="aut" class="q-my-sm">
        <div v-if="aut.v === -1" class="text-bold text-warning">
          {{ $t('nopower') }}
        </div>
        <div v-else>
          <btn-cond icon="open_in_new" @ok="ui.appPage.tab = 'pubs'" 
            size="lg" flat style="position:absolute;right:0;top:0" />
          <div class="fs-xs font-mono">{{ aut.autid }}</div>

          <div class="row">
            <div class="col-5 row items-center q-gutter-xs">
              <span class="text-italic">{{ $t('AUTna_label') }}</span>
              <btn-bubble :text="$t('AUTna_bub')"/>
            </div>
            <div class="col-7 q-pl-sm font-mono">
              <line-edit :text="aut.nomAuteur" @change="majAut"
                datasize="auteur" width="md"
                :disable="session.planeMode"/>
            </div>
          </div>
          <div class="row">
            <div class="col-5">{{ $t('AUTcol_sec') }}</div>
            <div class="col-7 q-pl-sm">{{ aut.section + ' - ' + lbls(aut.section)}}</div>
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
    </div>
    </template>
  </q-splitter>

  <q-page-sticky position="top-right" :offset="[7, 7]">
    <btn-cond icon="sync" round @ok="init"/>
  </q-page-sticky>
</div>


<div v-if="ui.appPage.tab === 'pubs'" class="column items-center">
  <div class="self-end q-ma-xs text-italic text-bold titre-md">{{ ui.appPage.aut.nomAuteur }}</div>

  <q-page-sticky position="top-left" :offset="[7, 7]">
    <q-toolbar :class="sty()">
      <nav-bar2 v-model="ui.navBar" @navigate="navigate"/>
      <btn-cond v-if="session.hasNet && !ui.navBar.editing && !ui.navBar.disable"
        class="col-auto q-ml-xs" icon="add" round @ok="add"/>
      <btn-cond v-if="session.hasNet && ui.navBar.editing && !ui.navBar.disable"
        class="col-auto q-ml-xs" icon="edit_off" round @ok="resetEdit"/>
      <btn-cond v-if="session.hasNet && !ui.navBar.editing && ui.navBar.nb && !ui.navBar.disable"
        class="col-auto q-ml-xs" icon="edit" round @ok="edit"/>
      <btn-cond v-if="session.hasNet && ui.navBar.editing && ui.navBar.changes.size && !ui.navBar.disable"
        class="col-auto q-ml-xs" icon="undo" round @ok="undo"/>
      <btn-cond v-if="session.hasNet && ui.navBar.editing && ui.navBar.changes.size && !ui.navBar.disable"
        class="col-auto q-ml-xs" icon="check" round @ok="val"/>
    </q-toolbar>
  </q-page-sticky>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch, reactive } from 'vue'
import stores from '../stores/all'
import { $Credential, $Cred } from '../src-fw/documents'
import { $Perimeter } from '../src-fw/subscription'
import { $t, sty, dhcool } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import { getStore } from '../stores/docs'
import { AS2$Auteur, AS2$Publication } from '../as2/documents'
import { Registry } from '../src-fw/registry'
import BtnCond from '../components-fw/BtnCond.vue'
import NavBar2 from '../components-fw/NavBar2.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import LineEdit from '../components-fw/LineEdit.vue'
import { Operation, DocEnums } from '../src-fw/operation'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const sth = computed(() => 'height:' + (ui.appPage.height - 30) + 'px;' )

ui.appPage.tab = "auteurs"
watch(() => ui.appPage.tab, async (t) => {
  if (t === 'pubs') {
    pubsInit()
    await listPubs()
  }
})

const splitterModel = ref(50)

const creds: Ref<Map<string, $Credential>> = ref()
const myPerims: Ref<$Perimeter[]> = ref()
const org = ref()
const std = computed(() => getStore('AS2', org.value))
const perimetre = ref()
const cred = ref(null)

watch(perimetre, (p) => {
  ui.appPage.aut = p ? std.value.getDoc('Auteur', p.docPk) : null
  ui.appPage.articles = std.value.getSColl('Auteur', p.docPk)
})

const aut = computed(() => ui.appPage.aut)
/*
  perimetre.value ? std.value.getDoc('Auteur', perimetre.value.docPk) : null)
watch(aut, (v) => { 
  console.log(v ? v.nomAuteur : 'personne') })
*/

const coauts: Ref<$Cred[]> = computed(() => {
  const co = []
  if (aut.value && aut.value.embedCreds) for(const cr in aut.value.embedCreds)
      if (cr !== cred.value.credId) co.push(aut.value.embedCreds[cr])
  return co
})

const init = async () => { 
  if (session.hasNet) {
    creds.value = await sf.myFullCreds('AS2', '', 'Auteur') 
    // console.log(creds.value.size)
  } else {
    const l = []
    for (const [so, m2] of session.perims)
      if (so.startsWith('AS2'))
        for(const [, p] of m2) 
          if(p.docCl === 'Auteur') l.push(p)
    myPerims.value = l
  }
}

onMounted(async () => { await init()})

const lbls = (s) => DocEnums.labelSync('AS2$Section', org.value, s)

const selectp = async (p) => {
  org.value = p.org
  perimetre.value = p
  await std.value.fetch([perimetre.value])
}

const select = async (c: $Credential) => {
  await DocEnums.fetch('AS2$Section', c.org)
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

const majAut = async (nomAuteur: string) => {
  const op = new Operation('MajAuteur', 'AS2', org.value)
  op.args.autpk = cred.value.docPk
  op.args.nomAuteur = nomAuteur
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

type Pubs = {
  a: AS2$Publication[]
  m: Map<string, AS2$Publication>
  c: AS2$Publication
}

const pubs: Ref<Pubs> = reactive({ a: [], m: new Map(), c: null })
const curPub = computed(() => pubs.n || (ui.navBar.nb ? pubs.a[ui.navBar.idx] : null))

const pubsItem = computed(() => std.value.getItem('Publication/auteur/' + perimetre.value.docPk))

const pubsInit = () => {
  pubs.a = []
  pubs.m.clear()
  pubs.n = null // new
  const b = ui.navBar
  b.listMode = true
  b.disable = false
  b.nb = 0
  b.idx = 0 // si nb == 0 ou isnew, ns. Sinon index de l'élément "courant" dans a.
}

watch(pubsItem, async () => {
  await listPubs()
})

const listPubs = async () => {
  if (!pubsItem.value) { pubsInit(); return }
  const pubidAv = curPub.value ? curPub.value.pubid : ''
  const pk = aut.value.pk
  // const s = std.value.getSColl('Publication', 'auteur', perimetre.value.docPk)
  for(const pubpk of pubsItem.value.pks)
    pubs.m.set(pubpk, std.value.getDoc('Publication', pubpk))
  pubs.a = Array.from(pubs.m.values())
  pubs.a.sort((a,b) => (a.v > b.v ? -1 : (a.v < b.v ? 1 : 0)))
  ui.navBar.nb = pubs.a.length
  ui.navBar.idx = 0
  if (!pubs.a.length) return
  if (pubidAv) {
    let i = 0
    for(const p of pubs.a)
      if (p.pubid === pubidAv) { ui.navBar.idx = i; return } 
      else i++
  }
}

const add = async () => {
  ui.navBar.editing = true
  ui.navBar.listMode = false
  ui.navBar.changes = new Set()
  const obj = {
    pubid: Crypt.rnd(15),
    autid: aut.value.autid,
    volume: 0,
    resume: ''
  }
  pubs.n = await Registry.compile('AS2', 'Publication', std.value.org, obj)
}

const edit = () => {
  ui.navBar.editing = true
  ui.navBar.listMode = false
  ui.changes = new Set()
}

const resetEdit = async () => {
  if (await ui.mayClose2()) {
    ui.resetEditing()
    ui.navBar.editing = false
    ui.changes = new Set()
  }
}

const val = async () => {
  // TODO
  ui.resetEditing()
  ui.navBar.editing = false
  ui.changes = new Set()
}

const undo = () => {
  ui.resetEditing()
  ui.changes = new Set()
  if (pubs.n) pubs.n = null
}

const navigate = async (n) => {
  console.log('n=', n)
  if (n < 5) {
    switch (n) { // 1:next 2: previous, 3:first, 4:last
      case 1 : ui.navBar.idx++; break
      case 2 : ui.navBar.idx--; break
      case 3 : ui.navBar.idx = 0; break
      case 4 : ui.navBar.idx = pubs.value.length - 1; break
    }
    pubs.c = pubs.a[ui.navBar.idx]
    ui.resetEditing()
    ui.navBar.editing = false
    ui.changes = new Set()
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.selx:hover { background-color: $yellow-5; color: black }
.selx { cursor:pointer !important }
</style>
