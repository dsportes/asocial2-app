<template>
  <div :class="clinv" @click="emit('zoom', model)">
    <div class="row full-width">
      <div class="col-1 row items-center">
        <q-icon :name="icons[model.status]" size="24px" :color="colors[model.status]"/>
      </div>
      <div class="col-3">{{dhcool(model.v)}}</div>
      <div class="col-5 ellipsis text-right text-bold">{{model.topicEd}}</div>
      <div class="col-3 text-center">{{ model.subjectEd }}</div>
    </div>
    <div class="row full-width">
      <div class="col-1"></div>
      <div class="col-11 text-italic ellipsis">{{ model.tab }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { dhcool } from '../src-fw/util'

const emit = defineEmits(['zoom'])
const model = defineModel()

const props = defineProps({
  selected: Boolean
})

const icons = ['cancel', 'person', 'badge', 'check_box']
const colors = ['warning', 'primary', 'primary', 'green-5']

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