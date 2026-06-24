<!-- Mon component
-->
<template>
<div class="column items-center">
<div class="pwsm">
  <div v-if="!ui.currentEvent.zoomed" class="full-width">
    <div v-if="!events.length" class="titre-md text-italic q-pa-md">{{ $t('FORMnoevents') }}</div>
    <div v-else v-for="(event, idx) of events" :key="event.eventId"
      :class="clcase(event, idx) + ' q-my-sm full-width cursor-pointer select'"
      @click="selEvent(event, idx)">
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{$t('services_' + event.svc)}}</div>
        <div class="col-5 ellipsis text-right text-bold">{{ event.typeEd }}</div>
        <div class="col-3 row items-center q-gutter-xs">
          <q-icon :name="stic[event.status]" :color="stclr[event.status]"/>
          <div class="font-mono text-bold" :color="stclr[event.status]">
            {{ $t('FORMstatus_' + event.status) }}</div>
        </div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-center text-italic ellipsis">{{event.org}}</div>
        <div class="col-7 text-right ellipsis">{{dhcool(event.v)}}</div>
        <div class="col-1 row items-center justify-end ellipsis">
          <q-icon v-if="event.lv < event.v"
            name="fiber_new" size="24px" color="warning"/>
        </div>
      </div>
      <div v-if="event.detailEd" class="row items-center full-width">
        <div class="col-2"></div>
        <div class="col-10 ellipsis">{{event.detailEd}}</div>
      </div>
      <div v-if="event.comment" class="row items-center full-width">
        <div class="col-2"></div>
        <scroll-md class="col-10" height="30px" :text="event.comment"/>
      </div>
    </div>
  </div>

  <div v-if="ui.currentEvent.zoomed" class="pwsm">
    <form-zoom class="q-mt-sm" v-model="fctx" @done="onDone"/>
  </div>
</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref, onMounted, computed } from 'vue'

import stores from '../stores/all'
import { $t, dkli, dhcool } from '../src-fw/util'

import { $Form, $MDEvent } from '../src-fw/documents'
import ScrollMd from '../components-fw/ScrollMd.vue'
import FormZoom from '../components-fw/FormZoom.vue'

const stic = ['', 'person', 'person_shield', 'check', 'close']
const stclr = ['', 'warning', 'warning', 'green-5', 'negative']

const ui = stores.ui

const fctx = computed(() => {
  return { form: ui.currentEvent.form, isDemand: true, comment: comment }
})

const nav = async (n) => { // navigation vers 1:next 2: previous, 3:first, 4:last
  const b = await ui.mayClose()
  if (!b) return
  const u = ui.navBar
  switch (n) {
    case 1 : { if (u.idx < events.value.length - 1) u.idx++; break }
    case 2 : { if (u.idx > 0) u.idx--; break }
    case 3 : { if (u.idx !== 0) u.idx = 0; break }
    case 4 : { if (u.idx < events.value.length - 1) u.idx = events.value.length - 1; break }
  }
  const event = events.value[u.idx]
  await selEvent(event, u.idx)
}

const events: Ref<$MDEvent[]> = ref([])

const isCurrent = (event: $MDEvent) =>
  ui.currentEvent.event && (ui.currentEvent.event.eventId === event.eventId)
const clcase = (event: $MDEvent, idx: number) => dkli(idx) + (isCurrent(event) ? ' current ' : ' nocurrent ')
const comment = computed(() => ui.currentEvent.event && ui.currentEvent.event.comment ?
  ui.currentEvent.event.comment : '')

const onDone = (ok: boolean) => {
  if (ok) onUpdate() // ok: true - Maj effectuée.
}

/* Form mise à jour :
- récupère l'ID de l'event courant - old
- recharge la liste
- recherche dans la liste rafraichie l'indice de l'event d'ID acId
- resélectionne cet event à son nouvel indice et rezoom
- si l'event a disparu (rarissime mais possible), rezoom sur le premier de la liste
  ou pas rezoom du tout si la liste rafraichie est vide.
*/
const onUpdate = (newId?: string) => {
  const u = ui.currentEvent
  const old = newId || u.event.eventId
  u.zoomed = false
  setTimeout(async () => {
    events.value = await $MDEvent.listEvents()
    let idx = -1
    let event = null
    for(let i = 0; i < events.value.length; i++) {
      event = events.value[i]
      if (event.eventId === old) { idx = i; break}
    }
    if (idx !== -1) await selEvent(event, idx)
    else {
      if (events.value.length)
        await selEvent(events.value[0], 0)
      else selEvent0()
    }
  }, 100)
}

const selEvent0 = () => {
  const u = ui.currentEvent
  u.event = null
  u.form = null
  u.zoomed = false
  const nb = ui.navBar
  nb.idx = -1
  nb.nb = events.value.length
}

const selEvent = async (event: $MDEvent, idx: number) => {
  // Get du Form associé document
  const u = ui.currentEvent
  const f = await $Form.get(event.svc, event.org, event.eventId, event.type)
  u.form = f || null
  u.event = event
  u.zoomed = f ? true : false
  const nb = ui.navBar
  nb.idx = idx
  nb.nb = events.value.length
}

const init = async () => {
  events.value = await $MDEvent.listEvents()
  selEvent0()
  ui.currentEvent.fnOnUpdate = onUpdate
  ui.navBar.fnnav = nav
  ui.navBar.hasback = true
}

onMounted(async () => { await init() })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2; color: black; }
.current { border: 1px solid $warning }
.nocurrent { border: 1px solid transparent }
</style>
