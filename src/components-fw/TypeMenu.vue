<template>
<div>
  <q-btn :label="title"
    icon-right="keyboard_arrow_down" outline no-caps
    :disable="disable">
    <q-menu anchor="bottom left" self="top left"
      transition-show="scale" transition-hide="scale">
      <q-list dense style="min-width: 250px">
        <q-item v-for="(c, idx) in categs" :key="idx" clickable>
          <q-item-section>{{c.label}}</q-item-section>
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
            <q-menu anchor="center middle"
              transition-show="flip-right" transition-hide="flip-left">
              <q-list dense style="min-width: 250px">
                <q-item v-for="ftl in getFT(c.categ)" :key="ftl.ft.type"
                  v-close-popup
                  dense clickable @click="sel(ftl)">
                  <q-item-section>{{ftl.label}}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</div>
</template>

<script setup lang="ts" vapor>
import { Ref, ref } from 'vue'
import { FormType } from '../src-fw/descriptor'
import { $t } from '../src-fw/util'

type Categ = {
  label: string
  categ: string
}

const props = defineProps<{
  disable?: boolean,
  title: string,
  allow?: Set<string> // fac : set des FormTypes autorisés
}>()

const emit = defineEmits(['select'])

const categs: Ref<Categ[]> = ref([])
// Map des formType par categ de Map par type
const ftmap: Ref<Map<string, Map<string, FormType>>> = ref(new Map())

/*
FormType('membrecodir', 'ad', 'k1', ['A'])
FormType('membreredaction', 'c1', 'k1', ['A'])
FormType('auteur', 'auteurs', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
FormType('coauteur', 'auteurs', 'k2', ['Readction/1', 'Auteur/$1'])
*/

const init = () => {
  for(const [, ft] of FormType.formTypes) {
    if (!props.allow || props.allow.has(ft.type)) { 
      let e = ftmap.value.get(ft.categ)
      if (!e) { e = new Map<string, FormType>(); ftmap.value.set(ft.categ, e)}
      e.set(ft.type, ft)
    }
  }
  const l: Categ[] = []
  for(const c of ftmap.value.keys()) 
    l.push({ label: $t('CATEG_' + c), categ: c })
  l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
  for(const x of l) x.label = x.label.substring(2)
  categs.value = l
}

type FtLabel = {
  ft: FormType,
  label: string
}

const getFT = (c: string) : FtLabel[] => {
  const l: FtLabel[] = []
  const x = ftmap.value.get(c)
  if (x) for(const [type, ft] of x)
    if (!props.allow || props.allow.has(type))
      l.push({ label: $t('TYPE_' + ft.svc + '_' + type), ft: ft })
  l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
  for(const x of l) x.label = x.label.substring(2)
  return l
}

const sel = (ftl: FtLabel) => {
  emit('select', ftl.ft)
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
