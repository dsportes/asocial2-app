<template>
  <div class="row font-mono fs-md items-start">
    <q-icon v-if="st === 1" class="col-1" name="add_circle" size="24px" color="warning"/>
    <q-icon v-if="st === 2" class="col-1" name="delete" size="24px"  color="warning"/>
    <div v-if="st === 0 || st === 3" class="col-1"/>
    <div :class="'col-2' + cl()">{{cred.id.substring(0, 5)}}</div>
    <div :class="'col-2 ellipsis q-px-xs' + cl()">{{cred.org}}</div>
    <div :class="'col-1 ellipsis q-pr-xs' + cl()">{{cred.type}}</div>
    <div :class="'col-6 mh' + (st === 3 ? ' text-warning text-italic' : ' text-italic') + cl()">{{cred.about}}</div>
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
