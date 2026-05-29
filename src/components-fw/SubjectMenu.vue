<template>
<div>
  <bar-title v-if="sType.type === 0" mini prefix="SUBnosub"/>

  <div v-if="sType.type === 1" class="column items-center">
    <bar-title prefix="SUBtype" mini/>
    <q-select class="q-my-xs font-mono fs-lg" dense options-dense filled clearable
      transition-show="flip-up" transition-hide="flip-down" 
      style="width:300px"
      v-model="subject"
      :options="options()" :label="$t('SUBlist')">
    </q-select>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed, ref, watch } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage } from '../src-fw/util'
import BarTitle from '../components-fw/BarTitle.vue'
import BtnCond from '../components-fw/BtnCond.vue'
// import { TopicDef } from '../stores/service-store'
import SelectCode  from '../dialogs-fw/SelectCode.vue'

type sType = {
  type: number // 0:aucun 1:config 2:singleton 3:property 4:docCl/alias
  singleton?: string
  property?: string
  docCl?: string
  alias?: string
}

type LabVal = {
  label: string
  value: string
}

/*
export type TopicDef = {
  id: string
  categ: string
  key: string
  subjects: string
  pubC: Uint8Array
}
  - `subjects`:
  - absent: le topic n'a pas de sujets.
  - `"a b c "`. Valeurs séparées par un espace.
  - `"@sujet35"` : ID du _singleton_ (du service) portant cette liste.
  - `"$sujet35"` : ID du _Property_ (de l'organisation) portant cette liste.
  - `"DocCl/alias"` : nom de classe des documents dont `alias` est la propriété définissant un code externe.
*/
const svc = stores.service
const ui = stores.ui

const model = defineModel() // TopicDef

const sType = computed(() => {
  if (!model.value) return { type: 0 }
  const s = model.value.subjects
  const st: sType = { type: 0 }
  if (!s) return st
  if (s.startsWith('@')) { st.type = 2; st.singleton = s.substring(1) }
  else if (s.startsWith('$')) { st.type = 3; st.property = s.substring(1) }
  else {
    const i = s.indexOf('/')
    if (i === -1) st.type = 1
    else { st.type = 4; st.docCl = s.substring(0, i); st.alias = s.substring(i + 1)}
  }
  return st
})

const emit = defineEmits(['select'])

const subject = ref()

const options = () => {
  const opts: LabVal[] = []
  const ls = model.value.subjects.split(' ')
  for (const s of ls) {
    const label = hasMessage('SUBJECT_' + model.value.id + '_' + s) || s
    opts.push({ label, value: s})
  }
  opts.sort((a,b) => a.label < b.label ? -1 : (a.label > b.label ? -1 : 0))
  return opts
}

watch(subject, (v) => {
  emit('select', subject.value)
})

const selectSub = () => {
  emit('select', subject.value)
}

if (sType.value.type === 0)
  emit('select', '')

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>