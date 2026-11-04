<!-- Input de sélection d'un Safe Store.
Vérifie sa disponibilité par un "ping", sauf pour le Site générique.
Résultat en v-model.
-->
<template>
<q-expansion-item dense v-model="exp">
  <template v-slot:header>
    <div class="row full-width items-start">
      <btn-bubble class="q-mr-sm" :text="$t(pfx + '_bub')"
        style="position:relative;top:-4px;"/>
      <div class="titre-sm text-italic">{{$t('SEStit')}}</div>
      <div class='font-mono fs-sm text-bold text-italic q-mx-sm'
        style="position:relative; top:-2px">{{ store }}</div>
      <div v-if="err" class="msg3 ellipsis">{{$t('SECsite_msg' + err)}}</div>
      <q-icon v-else name="check_circle" class="text-green-5" size="20px"/>
    </div>
  </template>
  <div class="q-ml-md q-mr-xs q-my-sm bordl bordb">
    <select-site v-model="store" :initval="def" @select="check" forstore/>
    <!--input-a prefix="SECsitech"
      @validate="check" :initval="def" :list="vals"
      v-model="store"/-->
  </div>
</q-expansion-item>
</template>

<script setup lang="ts" vapor>
import { ref, Ref, watch } from 'vue'
import stores from '../stores/all'
import BtnBubble from '../components-fw/BtnBubble.vue'
import SelectSite from '../components-fw/SelectSite.vue'
import { pingStore } from '../src-fw/operation'
import { $t } from '../src-fw/util'

const exp = ref(false)
const def: string = $t('SECsite_std')

const model = defineModel<string>() // Dans le script accessible par model.value

const props = defineProps<{
  prefix?: string
}>()

const pfx = ref(props.prefix || 'SECsite')
const store: Ref<string> = ref(def)
const err = ref(0)

model.value = ''

const check = async () => {
  if (store.value === def) {
    err.value = 0
    model.value = ''
    exp.value = false
  } else {
    err.value = 2
    await checkStore()
  }
}

watch(store, (v) => {
  check()
})

const checkStore = async () => {
  const s = store.value
  const ok = await pingStore(s)
  if (ok) {
    model.value = s
    err.value = 0
    exp.value = false
  } else {
    err.value = 1
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordb { border-bottom: 1px solid $grey-5 }
.bordl { border-left: 1px solid $grey-5 }
</style>
