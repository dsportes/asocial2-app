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
      <div class="col-2">{{ c.trig || '' }}</div>
      <div class="col-auto font-mono">{{ credId.substring(0,5) }}</div>
    </div>
  </scroll-area>

  <div v-if="aut" class="pwsm q-my-md">
    <div class="row q-mb-sm">
      <div class="col-5 text-italic">{{ $t('AUTcol_trig') }}</div>
      <div class="col-7 q-pl-sm ">
        <line-edit :text="cred.trig || $t('AUTnotrig')" @change="editTrig"/>
      </div>
    </div>

    <div class="row">
      <div class="col-5 text-italic">{{ $t('AUTcol_id') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ aut.autid }}</div>
    </div>
    <div class="row">
      <div class="col-5 text-italic">{{ $t('AUTcol_na') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ aut.nomAuteur }}</div>
    </div>
    <div class="row">
      <div class="col-5">{{ $t('AUTcol_sec') }}</div>
      <div class="col-7 q-pl-sm font-mono">{{ aut.section }}</div>
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
import { ref, Ref, computed, onMounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'
import { $Credential, $Cred } from '../src-fw/documents'
import { $t, sty } from '../src-fw/util'
import { Auteur } from '../app/documents'
// import { keyToB64 } from '../src-fw/b64'
// import { Operation } from '../src-fw/operation'
// import { Crypt } from '../src-fw/crypt'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import LineEdit from '../components-fw/LineEdit.vue'

// const decoder = new TextDecoder()
// const encoder = new TextEncoder()

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const creds: Ref<Map<string, $Credential>> = ref()
const cred = ref(null)
const aut = ref(null)
const coauts: Ref<$Cred[]> = ref([])

const init = async () => { creds.value = await sf.myFullCreds('Auteur') }
onMounted(async () => { await init()})

const dialogs = reactive({ })

const select = async (c: $Credential) => {
  cred.value = c
  aut.value = await Auteur.get(null, c.docPk)
  if (!aut.value) {
    await ui.diagDisplay($t('AUTko'))
  } else {
    const co = []
    for(const cr in aut.value.embedCreds)
      if (cr !== c.credId) co.push(aut.value.embedCreds[cr])
    coauts.value = co
  }
}

const editTrig = async (trig: string) => {
  console.log('select', trig)
}

const selCo = (cx: $Cred) => {
  console.log('co-auteur', cx.credId, cx.props.name, cx.props.trig)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
