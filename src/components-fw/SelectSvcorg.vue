<!-- Saisie du couple Service / Organisation
event : 'select', svc (org est session.orgs.c)
-->
<template>
<div>
  <div class="row q-gutter-xs items-center full-width nowrap">
    <btn-cond class="col-auto" icon="backspace" flat color="warning" @ok="doreset"/>
    <div class="col">
      <select-org :initval="initorg" :reset="reset" @select="selOrg"
        style="position: relative; top: 10px"/>
    </div>
    <div class="col">
      <select-svc :initval="initsvc" :reset="reset"
        :restricted="restricted" :ctx="ctx || null" @select="selSvc"/>
    </div>
    <btn-cond class="col-auto" icon="check" round size="lg" color="green-5"
      :disable="!svc || !org" @ok="ok"/>
  </div>
  <div v-if="diag" class="msg">{{ $t('nosvcorg') }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'
import stores from '../stores/all'
import { getSite, isAdmin } from '../src-fw/operation'
import BtnCond from '../components-fw/BtnCond.vue'
import SelectSvc from '../components-fw/SelectSvc.vue'
import SelectOrg from '../components-fw/SelectOrg.vue'
import { SOA } from '../src-fw/registry'

const props = defineProps({
  restricted: Boolean, // N'accepte QUE les services déclarés dans la configuration de l'app
  initorg: String, // Valeur initiale, si '?' force à ''
  initsvc: String, // Valeur initiale, si '?' force à ''
  /* objet permettant à l'appelant de situer l'instance du composant 
  ayant émis l'événement.
  si ctx.excl est fourni, liste des services NON sélectionnables.
  */
  ctx: Object
})

const session = stores.session

// Emet 2 arguments: SOA (ou null), ctx (ou null)
const emit = defineEmits(['select'])

const reset = ref(1)
const doreset = () => { setTimeout(() => { reset.value++ }, 5) }

const svc = ref()
const org = ref()
const diag = ref(false)

const selSvc = (x) => {
  if (x) svc.value = x
}
const selOrg = (x) => {
  if (x) org.value = x
}

const ok = async () => {
  if (session.hasNet) {
    const site = await getSite(svc.value.svc, org.value)
    if (site) {
      const soa : SOA = {
        svc: svc.value.svc,
        svcLabel: svc.value.label,
        org: org.value,
        site: site || '',
        admin: await isAdmin(site)
      }
      emit('select', soa, props.ctx || null)
    }
    else diag.value = true
  } else emit('select', {
        svc: svc.value,
        org: org.value,
        svcLabel: '?',
        ctx: props.ctx || '',
        admin: false
    })
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
