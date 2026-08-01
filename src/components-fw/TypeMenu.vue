<template>
<div>
  <q-btn :label="title"
    icon-right="keyboard_arrow_down" outline no-caps
    :disable="disable">
    <q-menu anchor="bottom left" self="top left"
      transition-show="scale" transition-hide="scale">
      <q-list dense style="min-width: 250px">
        <q-item v-for="c in categs" :key="c.value" clickable>
          <q-item-section>{{c.label}}</q-item-section>
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
            <q-menu anchor="center middle"
              transition-show="flip-right" transition-hide="flip-left">
              <q-list dense style="min-width: 250px">
                <q-item v-for="ft in getFT(c.value)" :key="ft.value.type"
                  v-close-popup
                  dense clickable @click="sel(ft)">
                  <q-item-section>{{ft.label}}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref } from 'vue'
import { FormType } from '../src-fw/docDescriptor'
import { $t } from '../src-fw/util'

type LabVal = {
  label: string
  value: string | FormType
}

const props = defineProps({
  disable: Boolean,
  title: String,
  allow: Object // fac : set des FormTypes autorisés
})

const emit = defineEmits(['select'])

const categs: Ref<LabVal[]> = ref([])
const ftmap: Ref<Map<string, Map<string, FormType>>> = ref(new Map())

/*
new FormType('membrecodir', 'ad', 'k1', ['A'])
new FormType('membreredaction', 'c1', 'k1', ['A'])
new FormType('auteur', 'auteurs', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'auteurs', 'k2', ['Readction/1', 'Auteur/$1'])
*/

const init = () => {
  for(const [, ft] of FormType.all) {
    if (!props.allow || props.allow.has(ft.type)) { // TODO
      let e = ftmap.value.get(ft.categ)
      if (!e) { e = new Map<string, FormType>(); ftmap.value.set(ft.categ, e)}
      e.set(ft.type, ft)
    }
  }
  const l: LabVal[] = []
  for(const c of ftmap.value.keys()) l.push({ label: $t('CATEG_' + c), value: c })
  l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
  for(const x of l) x.label = x.label.substring(2)
  categs.value = l
}

const getFT = (c: string) : LabVal[] => {
  const l: LabVal[] = []
  const x = ftmap.value.get(c)
  for(const [type, ft] of x) 
    if (!props.allow || props.allow.has(type))
      l.push({ label: $t('TYPE_' + ft.svc + '_' + type), value: ft })
  l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
  for(const x of l) x.label = x.label.substring(2)
  return l
}

const sel = (ft) => {
  emit('select', ft.value)
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
