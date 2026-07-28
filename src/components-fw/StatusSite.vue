<template>
<div class="row justify-between">
  <btn-cond class="col-auto q-pr-sm" :label="$t('status')" @ok="siteStatus"/>
  <div v-if="status !== null" class="col">
    <div>{{$t('svcStatus_now', [dhcool(status.now)])}}</div>
    <div :class="status.st === 9 ? 'text-warning text-bold' : ''">
      {{$t('svcStatus_' + status.st, [dhcool(status.at)])}}</div>
    <div>{{status.txt || $t('nocomment')}}</div>

    <q-expansion-item v-model="setstat" v-if="siteadmin" 
      class="q-my-sm" dense
      :label="$t('APsetstsite')" icon="security" header-class="tbs">
      <div class="column">
        <input-a prefix="svcStatus" v-model="newComment"/>
        <div class="row justify-end q-gutter-sm">
          <btn-cond color="primary" :label="$t('up')" padding="none sm"
            @ok="setSiteSt(1)"/>
          <!--btn-cond color="warning" :label="$t('readonly')" padding="none sm"
            @ok="setSiteSt(2)"/-->
          <btn-cond color="warning" :label="$t('down')" padding="none sm"
            @ok="setSiteSt(9)"/>
        </div>
      </div>
    </q-expansion-item>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted, watch } from 'vue'
import { $t, dhcool } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import InputA from '../components-fw/InputA.vue'
import { isAdmin, getSiteStatus, setSiteStatus, ADMIN$Status } from '../src-fw/operation'
import { FW$getStatus, FW$setStatus } from '../src-fw/operations'

const site = defineModel()

const setstat = ref(false)
const siteadmin = ref(false)
const status: Ref<ADMIN$Status> = ref(null)
const newComment = ref()

const init = async () => {
  siteadmin.value = false
  if (site.value) {
    siteadmin.value = await isAdmin(site.value)
    await siteStatus()
  }
}

const siteStatus = async () => {
  status.value = null
  if (!site.value) return
  const now = Date.now()
  status.value = await getSiteStatus(site.value)
  // console.log(site.value, JSON.stringify(status.value))
  newComment.value = status.value.txt
  status.value.now = now
}

const setSiteSt = async (st: number) => {
  const now = Date.now()
  status.value = await setSiteStatus(site.value, st, newComment.value || '')
  status.value.now = now
  newComment.value = status.value.txt
  setstat.value = false
}

onMounted(async () => { 
  await init() 
})

watch(() => site.value, async (v) => { 
  await init() 
})
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>