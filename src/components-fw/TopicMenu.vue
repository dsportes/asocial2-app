<template>
<div>
  <q-btn :label="$t('APtopicmenu')" icon-right="keyboard_arrow_down" outline no-caps
    :disable="disable">
    <q-menu anchor="bottom left" self="top left"
      transition-show="scale" transition-hide="scale">
      <q-list dense style="min-width: 150px">
        <q-item v-for="c in categs" :key="c.value" clickable>
          <q-item-section>{{c.label}}</q-item-section>
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
            <q-menu anchor="center middle"
              transition-show="flip-right" transition-hide="flip-left">
              <q-list dense style="min-width: 200px">
                <q-item v-for="t in topics(c.value)" :key="t.value.id"
                  v-close-popup
                  dense clickable @click="emit('select', t.value)">
                  <q-item-section>{{t.label}}</q-item-section>
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
import { computed, Ref } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { LabVal } from '../stores/service-store'

const svc = stores.service
const ui = stores.ui

const props = defineProps({
  disable: Boolean
})

const emit = defineEmits(['select'])

const categs: Ref<LabVal[]> = computed(() => svc.getCategs(ui.adminPage.SVC))

const topics: Ref<LabVal[]> = (categ: string) => 
  svc.getTopics(ui.adminPage.SVC, categ)

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>