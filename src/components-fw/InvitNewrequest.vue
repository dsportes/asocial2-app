<!-- Mon component
-->
<template>
<div class="column pwsm items-center q-pa-xs">
<!--div class="pwsm q-pa-xs"-->
  <div class="row full-width items-start">
    <q-select class="col-5" dense filled v-model="SVC"
      :options="Array.from(services)" emit-value :label="$t('service')"/>
    <div class="col-1"/>
    <input-b class="col-6 self-end"
      prefix="orgcode" v-model="org" size="org" noval/>
  </div>
  
  <div :class="'q-my-md full-width ' + (org.err ? 'disabled' : '')">
  <bar-title prefix="INVmajor"/>
  <q-select dense filled v-model="major" style="margin-left:20px"
    :disable="org.err !== ''"
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
    <btn-cond icon="check" color="primary" @okX="create" 
      :label="$t('INVrec')"
      :disable="!completed"/>
  </div>

</div>
<!--/div-->
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { CreateInvit } from '../src-fw/operations'

import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InputB from '../components-fw/InputB.vue'
import InputA from '../components-fw/InputA.vue'

const mintxtm = 10
const ui = stores.ui
const sf = stores.safe
const config = stores.config

const services = Array.from(Object.keys(config.K.SERVICES))
const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV_' + m)})

const SVC = ref()
const org = reactive({ inp: '', err: 'tooshort' })
const major = ref()
const minor = reactive({ inp: '', err: 'tooshort' })
const label = reactive({ inp: '', err: 'tooshort' })
const txtm = ref('')
const comment = ref('')

const completed = computed(() => 
  org.err === '' && major.value.value && label.err === '' && txtm.value.length > mintxtm
)

const majdescr = computed(() => config.K.majorInvits[major.value.value])

const reset = () => {
  SVC.value = services[0]
  major.value = majors[0]
  org.inp = ''; org.err = 'tooshort'
  major.value = ''; 
  minor.inp = ''; minor.err = 'tooshort'
  label.inp = ''; label.err = 'tooshort'
  txtm.value = ''; comment.value = ''
}

reset()

const create = async () => {
  let status = -1
  const op = new CreateInvit(SVC.value)
  const invit = await op.run(org.inp, major.value.value, minor.inp, 
    txtm.value, label.inp, comment.value)
  if (invit)
    status = await sf.createInvit(invit)
  await ui.diagDisplay(status ? $t('INCRko') : $t('INVcrok'))
  if (!status) reset()
}
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord-red { border-color: $negative !important }
</style>
