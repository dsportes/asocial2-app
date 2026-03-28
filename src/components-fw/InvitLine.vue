<template>
  <div :class="clinv" @click="emit('zoom', model)">
    <div class="row full-width">
      <div class="col-2 row items-center">
        <q-icon v-if="model.status <= 2"
          name="hourglass" size="24px" color="primary"/>
        <q-icon v-if="model.status === 2"
          name="check_circle" size="24px" color="none"/>
        <q-icon v-if="model.status === 4"
          name="check_circle" size="24px" color="green-5"/>
        <q-icon v-if="model.status === 6"
          name="close" size="24px" color="warning"/>
        <q-icon v-if="model.status === 3 || model.status === 5"
          name="close" size="24px" color="negative"/>
        <div class="font-mono">{{$t('INVst_' + model.status)}}</div>
      </div>
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