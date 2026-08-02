<template>
<div>
  <div class="column items-center q-pa-sm">

    <div v-if="!ui.currentForm.zoomed" class="pwmd">
      <div v-if="forms.length">
        <div v-for="(form, idx) in forms" :key="form.formId"
          :class="clcase(form, idx) + ' q-my-sm full-width cursor-pointer select'"
          @click="selForm(form, idx)">
          <div class="row items-center full-width">
            <div class="col-4 text-italic ellipsis">{{$t('services_' + form.svc)}}</div>
            <div class="col-5 ellipsis text-right text-bold">{{ form.typeEd }}</div>
            <div class="col-3 row items-center">
              <q-icon :name="stic[form.status]" :color="stclr[form.status]" size="md"/>
              <div class="font-mono text-bold" :color="stclr[form.status]">
                {{ $t('FORMstatus_' + form.status) }}</div>
            </div>
          </div>

          <div class="row items-center full-width">
            <div class="col-4 text-italic ellipsis">{{form.org}}</div>
            <div class="col-8 text-right ellipsis">{{dhcool(form.v)}}</div>
          </div>

          <div class="row items-center">
            <div class="col-4 titre-md text-italic ellipsis">{{ $t('FORMuser') }}</div>
            <div class="col-8 q-pl-sm font-mono">
              <span>{{ form.userId }}</span>
              <span v-if="form.userId === sf.userId" class="text-bold q-ml-md">[{{ $t('me') }}]</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="titre-md text-italic">{{ $t('FORMnoforms') }}</div>
    </div>

    <div v-else class="pwmd">
      <form-zoom v-if="fctx" v-model="fctx" @done="onDone"/>
    </div>

  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, watch } from 'vue'

import stores from '../stores/all'
import { $t, dkli, dhcool } from '../src-fw/util'
import { $Form } from '../src-fw/documents'
import FormZoom from '../components-fw/FormZoom.vue'

const stic = ['add', 'person', 'local_police', 'check', 'close']
const stclr = ['', 'warning', 'warning', 'green-5', 'negative']

const ui = stores.ui
const sf = stores.safe

const fctx = ref(null)

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const b = await ui.mayClose()
  if (!b) return
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < forms.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < forms.value.length - 1) u.idx = forms.value.length - 1; break }
  }
  const form = forms.value[u.idx]
  selForm(form, u.idx)
}

const forms: Ref<$Form[]> = ref([])

const isCurrent = (form: $Form) =>
  ui.currentForm.form && (ui.currentForm.form.formId === form.formId)
const clcase = (form: $Form, idx: number) => dkli(idx) + (isCurrent(form) ? ' current ' : ' nocurrent ')

const onDone = (ok: boolean) => {
  if (ok) onUpdate() // ok: true - Maj effectuée.
}

// forms mise à jour : rafraichir la liste
const onUpdate = (newId?: string) => {
  const u = ui.currentForm
  const old = newId || u.form.formId
  u.zoomed = false
  setTimeout(async () => {
    forms.value = await $Form.filteredList(u.soa.svc, u.soa.org, u.asAdmin)
    let idx = -1
    let form: $Form = null
    for(let i = 0; i < forms.value.length; i++) {
      form = forms.value[i]
      if (form && form.formId === old) { idx = i; break}
    }
    if (idx !== -1) selForm(form, idx)
    else {
      if (forms.value.length)
        selForm(forms.value[0], 0)
      else selForm0()
    }
  }, 100)
}

const selForm0 = () => {
  const u = ui.currentForm
  u.form = null
  u.zoomed = false
  fctx.value = null
  const nb = ui.navBar
  nb.idx = -1
  nb.nb = forms.value.length
  nb.hasBack = false
}

const selForm = (form: $Form, idx: number) => {
  const u = ui.currentForm
  u.form = form
  u.zoomed = true
  fctx.value = { form: u.form, isDemand: false }
  const nb = ui.navBar
  nb.idx = idx
  nb.nb = forms.value.length
  nb.hasBack = true
}

const init = () => {
  ui.currentForm.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
  selForm0()
}

watch(() => ui.currentForm.pft, async () => {
  const u = ui.currentForm
  forms.value = !ui.currentForm.pft || !ui.currentForm.pft.size ? [] :
    await $Form.filteredList(u.soa.svc, u.soa.org, u.asAdmin)
  init()
})

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
