<!-- Saisie du couple Service / Organisation
-->
<template>
  <input-A  simple size="org" v-model="local" :initval="defOrg"
    :list="lst" prefix="ORG" :label="$t('org')"
    style="min-width:105px;overflow:hidden"
    @validate="val"/>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, watch } from 'vue'
// @ts-ignore
import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'

const session = stores.session
const lst = computed(() => session.orgs.lst)

const local = defineModel()
const props = defineProps({
  reset: Number,
  initval: String, // Valeur initiale, si '?' force à ''
  /* objet permettant à l'appelant de situer l'instance du composant 
  ayant émis l'événement.
  */
  ctx: Object
})

const c = localStorage.getItem('org')
if (c) {
  session.addOrg(c)
  if (!session.currentOrg) session.setOrg(c)
}

const defOrg = ref(props.initval ? (props.initval === '?' ? '' : props.initval) : (session.currentOrg || ''))

// Emet 2 arguments: org (ou ''), ctx (ou null)
const emit = defineEmits(['select'])

const val = () => {
  if (defOrg.value !== local.value) {
    session.addOrg(local.value)
    const c = localStorage.getItem('org')
    if (c !== local.value) localStorage.setItem('org', local.value)
    emit('select', local.value, props.ctx || null)
  }
}

const init = () => {
  local.value = defOrg.value
  if (local.value)
    emit('select', local.value, props.ctx || null)
}

watch(() => [props.initval, props.ctx, props.reset], () => 
  init() )

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
