<template>
<div class="bord1 q-pa-xs box">
  <div class="row full-width q-mb-xs">
    <btn-bubble class="col-auto" size="md" :text="$t(pfx + '_bub')"/>
    <div class="col-7 q-ml-md titre-md text-bold text-italic ellipsis">{{$t(pfx + '_label')}}</div>
    <div class="col column items-end">
      <div v-if="err" class="msg3 ellipsis">{{$t('SECsite_msg' + err)}}</div>
      <q-icon v-else name="check_circle" class="text-green-5" size="24px"/>
    </div>
  </div>
  <input-a prefix="SECsitech" class="full-width q-mt-xs q-pl-lg" 
    :validatefn="checkSite" :initval="def" :list="vals"
    v-model="site"/>
</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import stores from '../stores/all'
import InputA from '../components-fw/InputA.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import { $t, hasMessage } from '../src-fw/util'

const sf = stores.safe
const config = stores.config

const def = $t('SECsite_std')
const std = config.K.MASTERDIR_URL
const urls = config.K.SAFE_URLS
const sites = Array.from(Object.keys(urls)).sort()
const vals = ref([def, ...sites])

const model = defineModel() // Dans le script accessible par model.value

const props = defineProps({
  prefix: String,
})

const pfx = ref(props.prefix || 'SECsite')
const site = ref(def)
const err = ref(0)

model.value = ''

const check = () => {
  const s = site.value
  if (s === def) {
    err.value = 0
    model.value = ''
  } else {
    err.value = 2
    if (urls[s]) checkSite()
  }
}

watch(site, (v) => {
  check()
})

const checkSite = async () => {
  const s = site.value
  const ok = await sf.pingSite(s)
  if (ok) {
    model.value = s 
    err.value = 0
  } else {
    err.value = 1
  }
}




</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.box { max-height:6.2rem; overflow:hidden }
</style>
