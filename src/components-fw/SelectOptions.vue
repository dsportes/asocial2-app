<template>
<div>
  <div v-if="s1 === 1 && session.syncMode" class="q-my-sm q- ml-xs row justify-between items-center">
    <q-toggle class="col q-pr-md" v-model="session.resetdb" dense :label="$t('HPresetdb_0')"/>
  </div>

  <div class="q-my-md">
    <q-checkbox dense v-model="toSave" :label="$t('OPTStosave')" />
  </div>

  <div class="q-mt-md titre-md text-italic">{{ $t('OPTSpref') }}</div>
  <div class="row q-gutter-sm">
    <q-radio v-for="code in prCodes" dense v-model="selPref" 
      :val="code" :label="code" />
  </div>

  <div class="row items-center q-mt-md titre-md text-italic">
    <div class="titre-md text-italic">{{ $t('OPTSroles') }}</div>
    <btn-cond v-if="orChg" round class="q-ml-md" icon="undo" @ok="undo"/>
  </div>
  <div v-for="(r, idx) in orgRoles" :key="r.role" 
    :class="dkli(idx) + ' q-my-sm q-pl-lg'">
    <div class="titre-md">{{ r.label }}</div>
    <div class="row q-gutter-md">
      <q-checkbox dense v-for="org in r.orgs" :key="org.code" v-model="org.sel" 
        :label="org.org"/>
    </div>
  </div>

<!--
<choose-it v-model="dialogs.close"
  prefix="OPTSquit" options="pw"
  @giveup="closeIt"
  @option="dialogs.close = false"/-->
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, ref, computed, watch, reactive } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
// import ChooseIt from '../dialogs-fw/ChooseIt.vue'
import { checkStatus } from '../src-fw/operation'
import { $t, dkli } from '../src-fw/util.js'

type Org = {
  org: string
  sel: boolean
  seli : boolean
}

type OrgRole = {
  role: string
  label: string
  orgs: Org[]
}

const ui = stores.ui
const session = stores.session
const s1 = computed(() => session.step === 1 ? 1 : 2)
const okn = ref(session.okOptions)
session.haschgOptions = false

watch(() => session.okOptions, async (v) => { 
  if (v > okn.value) await ok() })

/*
const dialogs = reactive({
  close: false
})
*/

watch(() => session.resetdb, async (v) => {
  if (v) await ui.diagDisplay($t('OPTSresetdb'))
})

const toSave = ref(true)
const prCodes = ref()
const defp = ref()
const selPref = ref()
const selPrefi = ref()
const orgRoles: Ref<OrgRole[]> = ref()

// const test = ['doda/AS2_auteurs', 'doda/AS2_ad', 'demo/AS2_auteurs' ]

const init = () => {
  defp.value = $t('OPTSdef')
  prCodes.value = Array.from(session.prefs.keys()).sort()
  prCodes.value.unshift(defp.value)
  selPref.value = session.pref && prCodes.value.indexOf(session.pref) !== -1 ? session.pref : defp.value
  selPrefi.value = selPref.value
  const x = []
  for(const y of session.orgRolesP) {
  // for(const y of test) {
    const i = y.indexOf('/')
    const org = y.substring(0, i)
    const role = y.substring(i + 1)
    let j = 0
    while (j < x.length) { if (x[j].role === role) break; else j++ }
    if (j < x.length) { x[j].orgs.push({ org, sel: false, seli: false }) }
    else x.push({ 
      role, 
      label: $t('CATEG_' + role).substring(2), 
      orgs: [{ org, sel: false, seli: false }]
    })
  }
  x.sort((a,b) => a.label < b.label ? 1 : (a.label < b.label ? -1 : 0))
  for(const y of x)
    y.orgs.sort((a,b) => a.code < b.code ? 1 : (a.code < b.code ? -1 : 0))
  for(const y of session.orgRoles) {
    const i = y.indexOf('/')
    const org = y.substring(0, i)
    const role = y.substring(i + 1)
    let j = 0
    while (j < x.length) { if (x[j].role === role) break; else j++ }
    if (j < x.length)
      for(const ox of x[j].orgs) if (ox.org === org) { ox.seli = true; ox.sel = true }
  }
  orgRoles.value = x
}

const orChg = computed(() => {
  if (orgRoles.value) for(const r of orgRoles.value)
    for(const ox of r.orgs) if (ox.sel !== ox.seli) return true
  return false
})

const chg = computed(() => selPrefi.value !== selPref.value || orChg.value)
watch(chg, (v) => {
  session.haschgOptions = v
})

const undo = () => {
  for(const r of orgRoles.value) for(const ox of r.orgs) ox.sel = ox.seli
}

const ok = async () => {
  const _orgRoles: string[] = []
  for(const r of orgRoles.value)
    for(const ox of r.orgs) if (ox.sel) _orgRoles.push(ox.org + '/' + r.role)
  console.log('orgRoles: ' + _orgRoles.join('  '))

  const _pref = selPref.value === defp.value ? '' : selPref.value
  const allOK = await checkStatus(_orgRoles)
  if (allOK) {
    /* Si session.step === 1, vient de SafeBox
      sinon la session est en cours, vient de LeftMenu */ 
    session.dialogs.options = false
    session.dialogs.netStatus = false
    await session.chgOptions(_pref, _orgRoles, toSave.value)
  } else 
    session.dialogs.netStatus = true
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
