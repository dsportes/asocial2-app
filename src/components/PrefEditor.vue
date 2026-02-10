<template>
  <div>
    <div class="column full-width">
      <q-toggle v-model="obj.btn1" label="Bouton 1 visible" :color="clr('btn1')"/>
      <q-toggle v-model="obj.btn2" label="Bouton 2 visible" :color="clr('btn2')"/>
      <q-input v-model="obj.title" label="Titre" :color="clr('title')">
        <template v-slot:append>
          <btn-cond size="sm" icon="undo" round color="warning"
            :disable="obj.title === (orig.title || defaults.title)"
            @ok="obj.title = orig.title || defaults.title"/>
        </template>
      </q-input>
      <q-input v-model="obj.lang" label="Langue" :color="clr('lang')"/>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, watch } from 'vue'

import { $t /*, dkli, dhcool */ } from '../src-fw/util'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'

const session = stores.session

const obj = ref(session.edPref.obj)
const orig = ref(session.edPref.orig)

const defaults = {
  btn1: false,
  btn2: false,
  lang: 'FR',
  title: '(aucun)'
}

for(const p in defaults)
  if (!obj.value[p]) obj.value[p] = defaults[p]

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

watch(() => obj.value.btn1, (ap, av) => { check() })
watch(() => obj.value.btn2, (ap, av) => { check() })
watch(() => obj.value.title, (ap, av) => { check() })
watch(() => obj.value.lang, (ap, av) => { check() })

check()
console.log('init PrefEditor')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>