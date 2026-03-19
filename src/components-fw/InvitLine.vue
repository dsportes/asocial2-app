<template>
  <div :class="clinv()" @click="emit('zoom', invit)">
    <div class="row full-width">
      <div class="col-2 font-mono">{{$t('INVst_' + invit.status)}}</div>
      <div class="col-4">{{dhcool(invit.time * 1000)}}</div>
      <div class="col-3 text-center">{{ invit.minor || '-'}}</div>
      <div class="col-3 text-center">{{ invit.label || '(na)'}}</div>
    </div>
    <div class="row full-width">
      <div class="col-2"></div>
      <div class="col-10 text-italic ellipsis">
        {{ invit.txtx || invit.txtm }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits(['zoom'])
const props = defineProps({
  invit: Object,
  selinvit: Object
})

const clinv = ref()

const setCl = () => { clinv.value = (props.selinvit && 
  (invit.invitId === props.selinvit.invitId) ? 'current' : 'nocurrent') +
 ' column q-py-xs full-width select cursor-pointer' }

watch(() => props.selinvit, setCl())

setCl()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>