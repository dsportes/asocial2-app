<template>
<div ref="root">
  <div v-if="!max" :class="sty() + ' full-width'">

        <q-toolbar class="fs-md full-width tbs bar">
          <btn-cond class="q-mr-xs" @ok="max=true" icon="zoom_out_map" flat color="nb"/>
          <btn-cond flat color="nb" :icon="md ? 'edit' : 'visibility'"
            round @ok="md = !md"/>
          <btn-cond v-if="editable && !md" :disable="md" class="q-mr-xs" @ok="ouvriremojimd1"
            icon="insert_emoticon" flat color="nb"/>
          <btn-cond v-if="modifie" class="q-mr-xs" @ok="undo" icon="undo" flat color="nb"/>
          <slot/>
          <q-space/>
          <div :class="'font-mono fs-sm' + (model.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
            {{model.length}}/{{maxlg}}c
          </div>
          <btn-cond class="q-mx-xs" @ok="print" icon="print" flat color="nb"/>
          <btn-cond v-if="okbtn && editable" class="q-mx-xs" padding="xs" color="warning"
            @ok="emit('ok', true)" :disable="!modifie" :label="$t('ok')"/>
          <help-button page="dial_editeur"/>
        </q-toolbar>

        <q-input v-if="!md" type="textarea"
          class="q-pa-xs font-mono" v-model="model" :rows="rows || 10"
          :readonly="!editable" :placeholder="placeholder"/>
        <sd-nb v-else :text="model" class="q-pa-xs bord1" :style="mhs(0)"/>

  </div>

  <q-dialog v-model="max" full-height full-width
    transition-show="slide-up" transition-hide="slide-down">
    <div ref="root2" :class="sty() + ' column'" :style="mhst">
    <q-layout container view="hHh lpR fFf">
      <q-header elevated>
        <q-toolbar class="fs-md full-width tbs">
          <btn-cond class="q-mr-xs" @ok="max=false" icon="zoom_in_map" flat color="nb"/>
          <btn-cond flat :icon="md ? 'edit' : 'visibility'" color="nb"
            round @ok="md = !md"/>
          <btn-cond v-if="editable && !md" :disable="md" class="q-mr-xs" @ok="ouvriremojimd2"
            icon="insert_emoticon" flat color="nb"/>
          <btn-cond v-if="modifie" class="q-mr-xs" @ok="undo" icon="undo" flat color="nb"/>
          <q-space/>
          <div :class="'font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
            {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
          </div>
          <btn-cond class="q-mx-xs" @ok="print" icon="print" flat color="nb"/>
          <btn-cond v-if="okbtn && editable" class="q-mx-xs" padding="xs" color="warning"
            @ok="emit('ok', true)" :disable="!modifie" :label="$t('ok')"/>
          <help-button page="dial_editeur"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-input v-if="!md" type="textarea" v-model="model" autogrow
          :class="sty() + ' font-mono'"
          :readonly="!editable" :placeholder="placeholder"/>
        <sd-nb v-else :class="sty() + ' bord1'" :text="model"/>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

  <q-dialog v-model="dialogs.emoji">
    <emoji-select v-model="inp" @done="emojiDone"/>
  </q-dialog>

</div>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue'

import stores from '../stores/all'
import { sty, $t } from '../src-fw/util'
import { debut, finmd, fintxt, stytxt, css } from '../src-fw/showdowncss'

import SdNb from '../components-fw/SdNb.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import EmojiSelect from '../dialogs-fw/EmojiSelect.vue'

const model = defineModel({ type: String })

const emit = defineEmits(['ok'])

const dialogs = reactive({ emoji: false })

const props = defineProps({
  help: String,
  lgmax: Number,
  text: String,
  placeholder: String,
  editable: Boolean,
  idx: Number,
  modetxt: Boolean,
  okbtn: Boolean,
  rows: Number
})

model.value = props.text || ''
/* valeur initiale. Change quand text change.
Permet de savoir si model a été réellement changé */
const initial = ref(props.text || '')

const ui = stores.ui

const config = stores.config
const root = ref()
const root2 = ref()

const max = ref(false)

const maxlg = ref(props.lgmax || config.maxlgtextegen)

const md = ref(!props.modetxt)

watch(() => props.text, (ap, av) => {
  if (model.value === initial.value) model.value = ap
  initial.value = ap
})

watch(() => props.modetxt, (ap, av) => {
  if (ap) md.value = false
})

watch(model, (ap, av) => {
  if (ap && ap.length > maxlg.value) model.value = ap.substring(0, maxlg.value)
})

const undo = () => {
  model.value = props.text
}

const modifie = computed(() => model.value !== initial.value)

const ouvriremojimd1 = () => {
  inp.value = root.value.querySelector('textarea')
  dialogs.emoji = true
}

const ouvriremojimd2 = () => {
  inp.value = root2.value.querySelector('textarea')
  dialogs.emoji = true
}

const print = async () => {
  let txt
  const r = max.value ? root2.value : root.value
  if (md.value) {
    let el = r.querySelector('.markdown-body2')
    if (!el) el = r.querySelector('.markdown-body')
    const html = el.innerHTML
    txt = debut + css + html + finmd
  } else {
    const inp = r.querySelector('textarea')
    txt = debut + stytxt + inp.value.replaceAll('\n', '<br>') + fintxt
  }

  const buf = new TextEncoder().encode(txt)
  const blob = new Blob([buf], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  if (url) {
    setTimeout(() => { window.open(url, '_blank') }, 100)
  } else {
    await ui.diagDisplay($t('noprint'), true)
  }
}

const emojiDone = (pos) => {
  const ta = inp.value
  textelocal.value = ta.value
  dialogs.emoji = false
  setTimeout(() => {
    ta.focus()
    ta.selectionStart = pos
    ta.selectionEnd = pos
  }, 10)
}

</script>

<style lang="css">
@media screen and (max-width: 320px) {
  emoji-picker {
    --num-columns: 5;
    --category-emoji-size: 1rem;
  }
}
</style>

<style lang="sass" scoped>
.dlx
  background-color: rgba(127,127,127,0.2) !important
  padding: 4px
.bord1
  border-bottom: 1px solid $grey-5
</style>

<style lang="sass" scoped>
::v-deep(.q-field__native)
  padding-top: 0 !important
  min-height: 1rem !important
::v-deep(.q-field__control)
  min-height: 0 !important
</style>
