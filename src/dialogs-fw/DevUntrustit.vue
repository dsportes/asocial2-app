<!-- Dialogue de retrait de certification du terminal -->
<template>
  <q-dialog v-model="model" persistent>
    <q-card :class="sty('md')">
      <div class="q-mt-md q-mb-sm titre-lg text-italic">
        {{$t('HPutnbs', sf.mySessions.size, {count: sf.mySessions.size})}}
      </div>
      <div class="column q-mb-md">
        <div class="titre-md">{{$t('HPutd_1')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_2')}}</div>
        <div class="q-ml-md titre-md">{{$t('HPutd_3')}}</div>
      </div>

      <div v-if="sf.mySessions.size" class="q-mb-sm q-pa-xs row">
        <div class="col-3 q-pr-md text-right titre-md text-italic">{{$t('HPutc1')}}</div>
        <div class="col-9 titre-md text-italic">{{$t('HPutc2')}}</div>
      </div>
      <div v-if="sf.mySessions.size" class="q-my-sm q-mx-md slist q-pa-xs">
        <scroll-area>
        <template #default>
          <div v-for="([id,s], idx) in sf.mySessions" :key="id" 
            :class="dkli(idx) + ' q-my-xs row'">
            <div class="col-3 q-pr-md text-right font-mono">{{s.app}}</div>
            <div class="col-9 fs-md">{{s.about}}</div>
          </div>
        </template>
        </scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="model = false"/>
        <btn-cond flat :label="$t('HPuntrust_1')" color="warning" @ok="setUntrust"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { watch, computed } from 'vue'

import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

const ui = stores.ui
const sf = stores.safe

const myModule = 'DevUntrustit'
const emit = defineEmits(['close', 'done'])
const model = defineModel()
// const dialogs = reactive({})
// onMounted(() => console.log(myModule, "mounted"))
// onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v) => {
  if(!v) emit('close', true)
})

const setUntrust = async () => {
  try {
    const status = await sf.setUntrust()
    if (status < 0) return
    await ui.diagDisplay($t('HPstuntrust_' + status))
    emit('done', true)
    model.value = false
  } catch (e) {
    await ui.diagDisplay($t('exui', [e.label, e.message]))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>