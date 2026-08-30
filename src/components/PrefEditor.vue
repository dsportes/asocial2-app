<template>
  <div>
    <div class="column full-width">
      <div class="row justify-around">
        <div class="column">
          <q-select dense options-dense filled clearable
            transition-show="flip-up" transition-hide="flip-down"
            class="q-mt-md" v-model="lang" label="Lang"
            :options="opts" style="width: 150px">
          </q-select>
          <div class="titre-md q-mb-md">{{$t('lang')}}</div>
        </div>
        <q-toggle v-model="obj.dark" :label="$t('darkclear')" :color="clr('dark')"/>
      </div>

      <q-separator class="q-my-sm" color="orange"/>

      <q-toggle v-model="obj.btn1" label="Bouton 1 visible" :color="clr('btn1')"/>
      <q-toggle v-model="obj.btn2" label="Bouton 2 visible" :color="clr('btn2')"/>
      <q-input v-model="obj.title" label="Titre" :color="clr('title')">
        <template v-slot:append>
          <btn-cond size="sm" icon="undo" round color="warning"
            :disable="obj.title === (orig.title || defaults.title)"
            @ok="obj.title = orig.title || defaults.title"/>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
import { $t } from '../src-fw/util'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'

const session = stores.session
const config = stores.config
const ui = stores.ui
const i18n = useI18n()
const opts = config.K.localeOptions

const obj = ref(session.edPref.obj)
const orig = ref(session.edPref.orig)

const defaults = {
  lang: 'fr',
  dark: true,

  btn1: false,
  btn2: false,
  title: '(aucun)'
}

const lang = ref()
const setLang = (opt) => {
  config.setLocale(opt.value)
  i18n.locale.value = opt.value
  obj.value.lang = opt.value
}

for(const p in defaults)
  if (!obj.value[p]) obj.value[p] = defaults[p]

let x; for (const opt of opts) if (orig.value.lang === opt.value) x = opt
lang.value = x || opts[0]
setLang(lang.value)

ui.setDark(obj.value.dark)

const clr = (p) => obj.value[p] !== defaults[p] ? 'warning' : 'none'

const check = () => {
  session.edPref.diag = ''
  session.edPref.chg = false
  for(const p in defaults) {
    const ap = obj.value[p]
    const av = orig.value[p]
    const def = defaults[p]
    if (av !== ap) {
      if (av) session.edPref.chg = true
      else if (ap !== def) session.edPref.chg = true
    }
    if (p === 'title' && ap.length > 3) 
      session.edPref.diag = 'titre trop long'
  }
}

watch(lang, (opt) => { setLang(opt); check() })
watch(() => obj.value.btn1, (ap, av) => { check() })
watch(() => obj.value.btn2, (ap, av) => { check() })
watch(() => obj.value.title, (ap, av) => { check() })
watch(() => obj.value.dark, (v) => { ui.setDark(v); check() })

check()
// console.log('init PrefEditor')
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>