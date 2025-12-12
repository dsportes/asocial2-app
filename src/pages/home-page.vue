<template>
  <div class="column full-width items-center">
    <!--btn-cond label="Go Test1" @ok="ui.setPage('test1')"/-->
    <q-toggle v-model="session.hasNet" 
      :class="'q-mb-md q-pa-xs bord1 q-pa-xs ' + (!session.hasNet ? 'text-bold bg-warning' : '')" 
      dense color="positive"
      checked-icon="cloud" unchecked-icon="cloud_off"
      :label="$t(session.hasNet ? 'HPnet' : 'HPplane')" />

    <div v-if="options.length === 0 && !session.hasNet"
      class="q-mb-sm wsm titre-md text-italic text-center">{{$t('HPnoplane')}}</div>

    <div v-if="session.hasNet" 
      class="q-mb-md wsm row items-start">
      <div class="col titre-sm text-italic text-center">{{$t('HPnoreg')}}</div>
      <btn-cond class="col-auto q-ml-sm" size="sm" icon="send" @ok="regme"/>
    </div>
    <p0-p1 v-if="session.hasNet || (options.length !== 0 && !session.hasNet)"
      class="wsm" :title="$t('HPauth')" @ok="auth"/>
    <div v-if="options.length > 0 && session.hasNet" class="wsm column">
      <div class="tbs q-px-xs titre-md text-italic">{{$t('HPseluser')}}</div>
      <div class="q-mb-sm wsm row justify-between items-center">
        <q-select class="col q-mr-sm" dense filled
          transition-show="flip-up" transition-hide="flip-down"
          v-model="selectedSafe" :options="options" />
        <pin-code class="col" :disable="selectedSafe === null" @ok="authPin"/>
      </div>
    </div>
    <div v-if="options.length === 0 && session.hasNet" 
      class="q-mb-sm wsm titre-md text-italic text-center">{{$t('HPnotrust')}}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'
import P0P1 from '../components-fw/P0P1.vue'
import PinCode from '../components-fw/PinCode.vue'
import stores from '../stores/all'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

onMounted(async () => {
  await sf.open()
  await sf.getHeader()
  await sf.getTrustings()
})

const p0p1 = ref(null)
const pin = ref(null)
const selectedSafe = ref(null)

const options = computed(() => {
  const r = []
  sf.trustings.forEach(e => { r.push({ label: e.pseudo, value: e }) })
  if (r.length) selectedSafe.value = r[0]
  return r
})

const auth = (args) => {
  p0p1.value = args
  console.log(args.p0, args.p1, args.p0h, args.p1h)
}

const authPin = (args) => {
  pin.value = args
  console.log(args.pin, selectedSafe.value['value']['safeId'])
}

const regme = () => {

}


</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 7px; width:20rem; }
</style>