<template>
<div ref="coredacpage" class="column items-center">
<div class="pwmd" style="position:relative">
  <q-splitter v-model="splitterModel" horizontal :style="pageh">
    <template v-slot:before>
      <div class="q-pa-xs">
        Liste des auteurs de la section
      </div>
    </template>

    <template v-slot:after>

    </template>
  </q-splitter>

</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, computed, onMounted, watch, useTemplateRef } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage, dkli } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import { DocEnums } from '../src-fw/operation'


const ui = stores.ui
const session = stores.session
const sf = stores.safe

const coredacpage = useTemplateRef('coredacpage')

const pageh = ref(100)
const ph = () => { setTimeout(() => {
    const h = coredacpage.value.parentNode.style.minHeight
    pageh.value = 'height:' + h + ';'
    //console.log(pageh.value)
  },5)
}

onMounted(() => {  ph() })

watch(() => ui.screenHeight, () => { ph() })

ui.appPage.org = ''
ui.appPage.sectionL = ''
ui.appPage.section = ''

watch(() => ui.appPage.org, async () => { 
  // await init1() 
})

const splitterModel = ref(33)

const selSection = (t) => {
  ui.appPage.section = t[0]
  ui.appPage.sectionL = t[1]
}


</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
