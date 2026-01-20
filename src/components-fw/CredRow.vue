<template>
  <div class="column font-mono fs-md full-width q-py-xs">
    <div class="row font-mono fs-md items-start">
      <q-icon v-if="st === 1" class="col-1" name="add_circle" size="24px" color="warning"/>
      <q-icon v-if="st === 2" class="col-1" name="delete" size="24px"  color="warning"/>
      <q-icon v-if="st === 0 || st === 3" class="col-1" name="check" size="12px"  color="none"/>
      <div :class="'col-2 ellipsis q-px-xs' + cl()">{{cred.id.substring(0, 8)}}</div>
      <div :class="'col-2 ellipsis q-px-xs' + cl()">{{cred.org}}</div>
      <div :class="'col-4 ellipsis q-pr-xs' + cl()">{{cred.type}}</div>
    </div>
    <div class="row font-mono fs-md items-start">
      <div class="col-2"></div>
      <div :class="'col-10 mh' + (st === 3 ? ' text-warning text-italic' : ' text-italic') + cl()">{{cred.about}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, computed, reactive, onUnmounted, watch, onMounted } from 'vue'
import { Credential } from '../src-fw/credential'

const props = defineProps({
  cred: Credential,
  st: Number
})

const cl = () => props.st === 2 ? ' text-strike' : ''
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
