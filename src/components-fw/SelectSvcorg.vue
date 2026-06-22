<!-- Saisie du couple Service / Organisation
event : 'select', svc (org est session.orgs.c)
-->
<template>
  <div class="row items-center q-gutter-xs">
    <select-svc v-model="svc" class="col"/>
    <select-org class="col-auto"/>
    <btn-cond class="col-auto" icon="check" :label="$t('ok')"
      :disable="!svc || !session.orgs.c"
      padding="0 xs" @ok="ok"/>
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

const session = stores.session
const sf = stores.safe

const svc = ref('')
const diag = ref(false)
const emit = defineEmits(['select'])
const ok = async () => {
  const op = await opOfSvcOrg(svc.value, session.orgs.c)
  if (op) {
    const soa = {
      svc: svc.value,
      org: session.orgs.c,
      admin: sf.auth.admins.indexOf(svc.value + '.' + op) !== -1
    }
    emit('select', soa)
  }
  else diag.value = true
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
