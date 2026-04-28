<!-- https://github.com/serebrov/emoji-mart-vue#i18n -->
<template>
  <div style="position:relative">
    <Picker :data="emojiIndex" :i18n="i18()" title=""
      :emoji-size="18" @select="showEmoji" />
    <div class="bg-white row" style="position:absolute;top:35px;right:8px">
      <div class="col fs-xl" style="width:6rem;min-height:2rem;">{{entree}}</div>
      <btn-cond class="col-auto" icon="backspace" color="primary" @ok="bs"/>
      <btn-cond class="col-auto" icon="check" color="green-5" @ok="ok"/>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import stores from '../stores/all'
import data from 'emoji-mart-vue-fast/data/all.json?raw'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'

import BtnCond from '../components-fw/BtnCond.vue'
import { $t } from '../src-fw/util'

const i18 = () => { return {
    search: $t('EMOsearch1'),
    notfound: $t('EMOnotfound'),
    categories: {
      search: $t('EMOsearch2'),
      recent: $t('EMOrecent'),
      smileys: $t('EMOsmileys'),
      people: $t('EMOpeople'),
      nature: $t('EMOnature'),
      foods: $t('EMOfoods'),
      activity: $t('EMOactivity'),
      places: $t('EMOplaces'),
      objects: $t('EMOobjects'),
      symbols: $t('EMOsymbols'),
      flags: $t('EMOflags'),
      custom: $t('EMOcustom')
    }
  }
}

const ui = stores.ui

const emojiIndex = ui.emojiIndex ? ui.emojiIndex : ui.setEmoji(new EmojiIndex(JSON.parse(data)))

const model = defineModel ({ type: Object })

const emit = defineEmits('done')

const entree = ref('')

function ok () {
  const ta = model.value
  const ss = ta.selectionStart
  const sf = ta.selectionEnd
  const deb = ta.value.substring(0, ss)
  const fin = ta.value.substring(sf, ta.value.length)
  ta.value = deb + entree.value + fin
  const pos = ss + entree.value.length
  entree.value = ''
  emit('done', pos)
}

const showEmoji = (emoji) => { 
  entree.value += emoji.native
}

const bs = () => { 
  entree.value = entree.value.substring(0, entree.value.length - 2) 
}

</script>

<style lang="scss">
.emoji-mart {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-anchor {
  padding: 2px 0 !important
}
.emoji-mart-bar {
  margin-right: 0px;
  background: white !important
}
.emoji-mart-search input {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-category-label h3 {
  background: indigo !important;
  color: white !important;
  padding: 2px;
  font-size: 1rem;
}
.emoji-mart-preview {
  height: 70px !important;
  background:#141414 !important;
}
</style>
