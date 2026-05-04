<template>
  <div :class="clinv" @click="emit('zoom', model)">
    <div class="row full-width">
      <div class="col-1 row items-center">
        <q-icon v-if="model.etc !== null"  
          name="check_circle" size="24px" color="green-5"/>
      </div>
      <div class="col-1 row items-center">
        <q-icon v-if="model.byU"
          name="person" size="24px" color="primary"/>
      </div>
      <div class="col-4">{{dhcool(model.v)}}</div>
      <div class="col-3 ellipsis text-right text-bold">{{$t('INV$' + model.major)}}</div>
      <div class="col-3 text-center">{{ model.minor || '-'}}</div>
    </div>
    <div class="row full-width">
      <div class="col-2"></div>
      <div class="col-10 text-italic ellipsis">
        {{ model.tab }}
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