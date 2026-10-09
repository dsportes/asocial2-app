<template>
<div class="column items-center">
<div class="pwmd" style="position:relative">
  <q-splitter v-model="splitterModel" horizontal 
    :style="sth">
    <template v-slot:before>
      <div v-if="session.planeMode" class="titre-md text-italic">{{ $t('CODIRplane') }}</div>
      <div v-else>
        <div class="titre-md text-italic">{{ $t('CODIRnogr') }}</div>
      </div>
    </template>

    <template #separator>
      <q-btn color="primary" round size="xs" icon="drag_indicator"/>
    </template>

    <template v-slot:after>

    </template>
  </q-splitter>

</div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted, watch, computed, reactive } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

const ui = stores.ui
const session = stores.session

const sth = computed(() => 'height:' + (ui.appPage.height - 30) + 'px;' )
// onMounted(() => { ui.getPh() })

const splitterModel = ref(33)

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border:1px solid $grey-5; border-radius: 5px; padding:2px; }
</style>
