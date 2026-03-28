<!-- Mon component
-->
<template>
<div class="column items-center">
<div class="pwsm q-pa-xs">
  <service-org v-model="svcorg" class="full-width q-mt-sm"/>
  
  <div :class="'q-my-md full-width ' + (svcorg.org.err ? 'disabled' : '')">
  <bar-title prefix="INVmajor"/>
  <q-select v-model="major" style="margin-left:20px"
    dense options-dense
    transition-show="flip-up" transition-hide="flip-down"
    :disable="svcorg.org.err !== ''"
    :options="majOpts" :label="$t('INVmajor_c')"/>
  </div>

  <div v-if="major.value && majdescr" class="q-my-md full-width">
    <div v-if="majdescr.hasMinor" class="q-mt-sm" >
      <bar-title prefix="INVminor"/>
      <input-b prefix="INVminor_c" v-model="minor" size="minor" noval/>
    </div>

    <div v-if="majdescr.hasLabel" class="q-my-md full-width" >
      <bar-title :prefix="'INV' + major.value"/>
      <input-b :prefix="'INV' + major.value" v-model="label" size="about" noval/>
    </div>

    <div :class="'q-my-md full-width' + (label.err ? 'disabled' : '')">
      <bar-title prefix="INVcomment"/>
      <input-a prefix="INVcomment_c" v-model="comment" size="comment" noval/>

      <bar-title class="q-mt-md" prefix="INVmotiv"/>
      <q-input :class="'q-pa-xs bord1 ' + (txtm.length < mintxtm ? 'bord-red' : '')" 
        v-model="txtm" type="textarea"
        :rows="5"/>
    </div>
  </div>

  <div class="row full-width justify-between">
    <btn-cond icon="undo" flat :label="$t('reset')" @ok="reset"/>
    <btn-cond icon="check" color="primary" @ok="create" 
      :label="$t('INVrec')"
      :disable="!completed"/>
  </div>

</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { InvitCreate } from '../src-fw/operations'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InputB from '../components-fw/InputB.vue'
import InputA from '../components-fw/InputA.vue'
import ServiceOrg from '../components-fw/ServiceOrg.vue'

const mintxtm = 10
const ui = stores.ui
const sf = stores.safe
const config = stores.config

const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV_' + m)})

const svcorg = reactive({
  org: { inp: '', err: 'tooshort' },
  SVC: { svc: ''}
})
const major = ref()
const minor = reactive({ inp: '', err: 'tooshort' })
const label = reactive({ inp: '', err: 'tooshort' })
const txtm = ref('')
const comment = ref('')

const completed = computed(() => 
  svcorg.org.err === '' && major.value.value && label.err === '' && txtm.value.length > mintxtm
)

const majdescr = computed(() => config.K.majorInvits[major.value.value])

const reset = () => {
  svcorg.SVC = ''
  major.value = majors[0]
  svcorg.org.inp = ''; svcorg.org.err = 'tooshort'
  major.value = ''; 
  minor.inp = ''; minor.err = 'tooshort'
  label.inp = ''; label.err = 'tooshort'
  txtm.value = ''; comment.value = ''
}

reset()

const create = async () => {
  let status = -1
  const op = new InvitCreate(svcorg.SVC, svcorg.org.inp)
  const invit = await op.run(major.value.value, minor.inp, 
    txtm.value, label.inp, comment.value)
  if (invit)
    status = await sf.invitCreate(invit)
  await ui.diagDisplay(status ? $t('INVcrko') : $t('INVcrok'))
  if (!status) reset()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-red { border-color: $negative !important }
</style>
