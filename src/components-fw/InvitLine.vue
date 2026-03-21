<template>
  <div :class="clinv" @click="emit('zoom', model)">
    <div class="row full-width">
      <div class="col-2 font-mono">{{$t('INVst_' + model.status)}}</div>
      <div class="col-4">{{dhcool(model.time * 1000)}}</div>
      <div class="col-3 text-center">{{ model.minor || '-'}}</div>
      <div class="col-3 text-center">{{ model.label || '(na)'}}</div>
    </div>
    <div class="row full-width">
      <div class="col-2"></div>
      <div class="col-10 text-italic ellipsis">
        {{ model.txtx || model.txtm }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { $t, dhcool } from '../src-fw/util'

const emit = defineEmits(['zoom'])
const model = defineModel()

const props = defineProps({
  selected: Boolean
})

const clinv = ref()

const setCl = () => { clinv.value = (props.selected ? 'current' : 'nocurrent') +
 ' column q-py-xs full-width select cursor-pointer'}

watch(() => props.selected, () => {
  setCl()
})

setCl()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>