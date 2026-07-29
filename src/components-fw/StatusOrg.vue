<template>
<div v-if="status !== null" class="row justify-between">
  <btn-cond class="col-auto q-pr-sm" round icon="refresh" @ok="setStatus"/>
  <div class="col">
    <div>{{$t('svcStatus_now', [dhcool(status.now)])}}</div>
    <div :class="status.st === 9 ? 'text-warning text-bold' : ''">
      {{$t('svcStatus_' + status.st, [dhcool(status.at)])}}</div>
    <div>{{status.txt || $t('nocomment')}}</div>

    <q-expansion-item v-model="setstat" v-if="so.site && so.admin" 
      class="q-my-sm tbs" switch-toggle-side dense>
      <template v-slot:header>
        <div class="row justify-between full-width">
          <div class="col-auto titre-md text-bold">{{ $t('APsetstsite') }}</div>
          <div v-if="setstat" class="col-auto row justify-end">
            <btn-cond color="primary" :label="$t('up')" padding="none sm"
              @ok="updStatus(1)" class="q-mr-sm"/>
            <btn-cond color="warning" :label="$t('readonly')" padding="none sm"
              @ok="updStatus(2)" class="q-mr-sm"/>
            <btn-cond color="warning" :label="$t('down')" padding="none sm"
              @ok="updStatus(9)"/>
          </div>
        </div>
      </template>
      <input-a :class="sty()" prefix="svcStatus" noval v-model="newComment"/>
    </q-expansion-item>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted, watch } from 'vue'
import { $t, dhcool, sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import { getSiteStatus, setSiteStatus, ADMIN$Status } from '../src-fw/operation'
import { FW$getStatus, FW$setStatus } from '../src-fw/operations'

const so = defineModel()

const setstat = ref(false)
const status: Ref<ADMIN$Status> = ref(null)
const newComment = ref()

const setStatus = async () => {
  status.value = null
  if (!so.value  || !so.value.site || !so.value.org) return
  const now = Date.now()
  status.value = await FW$getStatus(so.value.svc, so.value.org)
  // console.log(site.value, JSON.stringify(status.value))
  newComment.value = status.value.txt
  if (so.admin) setstat.value = true
  status.value.now = now
}

const updStatus = async (st: number) => {
  const now = Date.now()
  status.value = await FW$setStatus(so.value.svc, so.value.org, st, newComment.value || '')
  status.value.now = now
  newComment.value = status.value.txt
  setstat.value = false
}

onMounted(async () => { 
  await setStatus() 
})

watch(() => so.value, async (v) => { 
  await setStatus() 
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>