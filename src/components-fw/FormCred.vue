<template>
<dialog-std1 v-model="ui.dModels[idc].formcred" 
  :title="title" hdrclass='wmd' @close="emit('close', idc)">
  <template #hdr>
    <div class="row justify-between q-px-md q-mb-md">
      <btn-cond flat icon="close" color="none"
        :label="$t('giveup')" @ok="ui.fD"/>
      <btn-cond flat icon="check" :label="$t('validate')"
        @ok="ui.fD(); validatefn()" :disable="diag !== ''"/>
    </div>
    <div v-if="diag !== ''" class="msg2 full-width">{{diag}}</div>
  </template>
  <template #default>
  <div class="column q-gutter-xs">
    <input-a v-if="org" v-model="m.org"
      prefix="orgcode" size="org" />
    <q-select v-if="role" dense filled v-model="m.role"
      :options="optsRoles" emit-value :label="$t('ROLE')"/>
    <input-a v-if="entid" v-model="m.entid"
      prefix="FCentid" size="entid"/>
    <input-a v-if="hpems" v-model="m.hpems"
      prefix="FCentid" size="entid"/>
    <div v-if="pemv" class="q-my-xs">
      <bar-title prefix="FCpemv"/>
      <q-input v-model="m.pemv" type="textarea"
        class="q-pa-xs bord1 full-width"  :rows="5"/>
    </div>
    <input-a v-if="dtime" v-model="dtime"
      prefix="FCdtime" size="isotime"/>
    <input-a v-if="infou" v-model="m.infou"
      prefix="FCinfou"/>
    <input-a v-if="infos" v-model="m.infos"
      prefix="FCinfos"/>
  </div>
  </template>
</dialog-std1>
</template>

<script setup lang="ts">

// @ts-ignore
import { ref, Ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InputA from '../components-fw/InputA.vue'
import DialogStd1 from '../components-fw/DialogStd1.vue'
import { $t } from '../src-fw/util'

const ui = stores.ui
const config = stores.config

const m = defineModel() // Dans le script accessible par m.value

const props = defineProps({
  idc: String,
  title: String,
  validatefn: Function,
  org: Boolean,
  role: Boolean,
  entid: Boolean,
  hpems: Boolean,
  pemv: Boolean,
  dtime: Boolean,
  infou: Boolean,
  infos: Boolean
})

const emit = defineEmits(['close'])

const optsRoles = ref([])
for (const r of config.K.roles) optsRoles.value.push({ value: r, label : $t('ROLE' + r)})

const diag = computed(() => {
  for(const f of ['org', 'hpems', 'pemv'])
    if (props[f] && !m.value[f]) return $t('FCmissing', [f])
  if (props['role'] && config.K.roles.has(m.value['role']))
    return $t('FCroleko')
  if (props['dtime'] && dtimeerr.value)
    return $t('FCdtimeko')
  return ''
})

const dtime = ref()
const dtimeerr = ref(false)
if (props.dtime) {
  let d
  if (m.value.dtime) d = new Date(m.value.dtime)
  else {
    d = new Date()
    m.value.dtime = d.getTime()
  }
  dtime.value = d.toISOString()
  dtimeerr.value = false
}
watch(dtime, (v) => {
  const n = Date.parse(dtime.value)
  dtimeerr.value = isNaN(n)
  if (!dtimeerr.value) m.value.dtime = n
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
