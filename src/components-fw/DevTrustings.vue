<template>
  <!-- Gérer les terminaux de confiance -->
  <q-dialog v-model="ui.dModels[idc].trustings" persistent>
    <q-card :class="sty('md')">
      <q-toolbar>
        <btn-cond color="none" size="lg" icon="chevron_left" flat
          @ok="delTrustSet.clear(); ui.fD(); emit('close', idc)"/>
        <q-toolbar-title class="titre-lg text-right q-mx-sm">{{$t('HPtrustings_1')}}</q-toolbar-title>
        <btn-bubble :text="$t('HPtrustings_2')"/>
      </q-toolbar>
      <div class="full-width q-pa-sm">
        <div v-if="sf.devName" class="row items-center q-my-sm">
          <span class="titre-sm text-italic">{{$t('HPterminal')}}</span>
          <span class="font-mono fs-sm text-italic q-ml-sm">{{sf.devId.substring(0, 5) + ' [' + sf.devName + ']'}}</span>
        </div>
        <div class="titre-md q-my-sm">{{ $t('HPtrustings_l', sf.devices.size) }}</div>
        <scroll-area>
        <template #default>
          <div v-for="([id, dev], idx) in sf.devices" :key="id" :class="'row ' + dkli(idx)">
            <btn-cond class="col-1" :icon="delTrustSet.has(id) ? 'undo' : 'delete'"
              :color="delTrustSet.has(id) ? 'primary' : 'warning'"
              @ok="delTrustIt(id)"/>
            <div :class="'col-2 font-mono ellipsis' + (delTrustSet.has(id) ? ' text-strike' : '') + (id === sf.devId ? ' text-bold' : '')">
              {{ id.substring(0, 5) }}</div>
            <div :class="'col-9 font-mono' + (delTrustSet.has(id) ? ' text-strike' : '') + (id === sf.devId ? ' text-bold' : '')">
              {{ dev.devName }}</div>
          </div>
        </template>
        </scroll-area>
      </div>

      <q-card-actions vertical align="right">
        <btn-cond flat :label="$t('giveup')" @ok="ui.fD(); emit('close', idc)"/>
        <btn-cond flat :label="$t('HPtrustings_del', [delTrustSet.size])" color="warning"
          :disable="delTrustSet.size === 0" @ok="delTrustings"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import { $t, sty, dkli } from '../src-fw/util'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const props = defineProps({
  idc: String
})

const emit = defineEmits(['close'])

const delTrustSet = ref(new Set())

const delTrustIt = (id) => {
  if (delTrustSet.value.has(id)) delTrustSet.value.delete(id)
  else delTrustSet.value.add(id)
}

const delTrustings = async () => {
  console.log('delTrust')
  const st = await sf.setUntrustAll(delTrustSet.value)
  if (st === 0) {
    delTrustSet.value = null
    ui.fD()
  } else await ui.diagDisplay($t('HPopnotpin_' + st))
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>