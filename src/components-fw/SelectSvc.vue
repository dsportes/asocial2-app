<!-- Select d'un service
-->
<template>
  <q-select v-model="model" dense options-dense
    :label="$t('service')"
    style="min-width:150px; height:40px"
    transition-show="flip-up" transition-hide="flip-down"
    :options="opts"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, onMounted, computed } from 'vue'

import stores from '../stores/all'
import { AOperation } from '../src-fw/operation'

const session = stores.session
const config = stores.config

const model = defineModel() // { label: string, svc: string }

const props = defineProps({
  reset: Number,
  restricted: Boolean, // N'accepte QUE les services déclarés dans la configuration de l'app
  initval: String, // Valeur initiale, si '?' force à ''
  /* objet permettant à l'appelant de situer l'instance du composant 
  ayant émis l'événement.
  si ctx.excl est fourni, liste des services NON sélectionnables.
  */
  ctx: Object
})

// Emet 2 arguments: svc (ou ''), ctx (ou null)
const emit = defineEmits(['select'])

const defSvc = computed(() => {
  if (props.initval) return props.initval === '?' ? '' : props.initval
  return session.currentSvc || config.K.DEFAULT_SERVICE || ''
})

const opts = ref()

const init = async () => {
  opts.value = []
  const ks = config.K.SERVICES
  const sl = await AOperation.getServicesLabels()
  const m = new Map()
  for(const [svc, label] of sl) {
    if (props.restricted && !ks[svc]) continue
    if (props.ctx && props.ctx.excl && props.ctx.excl.has(svc)) continue
    const x = { label: label + ' [' + svc + ']', svc: svc }
    m.set(svc, x)
    opts.value.push(x)
    opts.value.sort((a,b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0))
  }
  model.value = defSvc.value ? m.get(defSvc.value) : undefined
}

watch(() => model.value, (v) => { 
  emit('select', model.value, props.ctx || null)
})

watch(() => [props.ctx, props.initval, props.restricted, props.reset], async () => { 
  await init() 
})

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
