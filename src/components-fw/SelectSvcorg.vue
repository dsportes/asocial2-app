<!-- Saisie du couple Service / Organisation
event : 'select', svc (org est session.orgs.c)
-->
<template>
  <div class="row q-gutter-xs items-center">
    <btn-cond icon="backspace" flat color="warning" @ok="ko"/>
    <select-svc v-model="svc"/>
    <select-org v-model="org"/>
    <btn-cond icon="check" round size="lg" color="green-5"
      :disable="!svc || !org" @ok="ok"/>
  </div>
  <div v-if="diag" class="msg">{{ $t('nosvcorg') }}</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
import stores from '../stores/all'
import { opOfSvcOrg } from '../src-fw/operation'
import BtnCond from '../components-fw/BtnCond.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import { SOA } from '../src-fw/documents'

const session = stores.session
const sf = stores.safe
const config = stores.config

const emit = defineEmits(['select'])

const svc = ref(session.currentSvc)
const org = ref(session.currentOrg)
const diag = ref(false)

const ok = async () => {
  const op = await opOfSvcOrg(svc.value, org.value)
  if (op) {
    const soa : SOA = {
      svc: svc.value,
      org: org.value,
      admin: sf.auth.admins.indexOf(svc.value + '.' + op) !== -1
    }
    emit('select', soa)
  }
  else diag.value = true
}

const ko = () => {
  svc.value = config.K.DEFAULT_SERVICE
  org.value = ''
  emit('select', null)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
