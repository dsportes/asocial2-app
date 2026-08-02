<!-- Saisie du couple Service / Organisation
-->
<template>
  <input-A  simple size="org" v-model="model" :initval="defOrg"
    :list="lst" prefix="ORG" :label="$t('org')"
    style="min-width:100px"
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

const model = defineModel()
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
  if (defOrg.value !== model.value) {
    session.addOrg(model.value)
    const c = localStorage.getItem('org')
    if (c !== model.value) localStorage.setItem('org', model.value)
    emit('select', model.value, props.ctx || null)
  }
}

const init = () => {
  model.value = defOrg.value
}

watch(() => [props.initval, props.ctx, props.reset], () => 
  init() )

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.w1 { background-color:rgba(255,255,255,0.1) }
</style>
