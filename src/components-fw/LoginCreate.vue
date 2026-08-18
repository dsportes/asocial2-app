<template>
<div>
  <q-toolbar>
    <btn-bubble :text="$t('LOGcreate_bub')"/>
    <q-toolbar-title class="titre-md text-center q-mx-sm">{{$t('LOGcreate_tit')}}</q-toolbar-title>
    <q-checkbox v-model="adm" color="negative" size="16px"
      checked-icon="star" unchecked-icon="star_border"/>
  </q-toolbar>

  <div class="column items-center">
    <select-site class="pwxxs q-my-md" v-if="adm" v-model="site"/>
    <input-a v-if="!adm || site" class="pwsm q-my-md"
      :prefix="adm ? 'LOGcreate_pwd' : 'LOGcreate_inv'" 
      size="ps" v-model="invitCode" @validate="onCode"/>
    <div class="pwxs font-mono q-my-sm">{{ userId }}</div>
  </div>

  <safe-cr v-if="dialogs.create" v-model="dialogs.create"
    mode="u" @creation="onCreation"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { reactive, ref } from 'vue'
import stores from '../stores/all'

import { Crypt } from '../src-fw/crypt'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import BtnBubble from '../components-fw/BtnBubble.vue'
import InputA from '../components-fw/InputA.vue'
import SelectSite from '../components-fw/SelectSite.vue'
import { AdminOperation } from '../src-fw/operation'
import { $t } from '../src-fw/util'

import SafeCr from '../dialogs-fw/SafeCr.vue'

const sf = stores.safe
const ui = stores.ui
const session = stores.session

const emit = defineEmits(['done'])

const dialogs = reactive({
  create: false
})
const adm = ref(false)
const site = ref('')
const userId = ref()
const shi = ref()

const invitCode = ref('')

const adminId = async () => {
  const op = new AdminOperation('CONFIG$AdminID', site.value)
  op.args.pwd = await Crypt.strongHash(invitCode.value, false, false)
  try {
    const res = await op.post()
    if (!res.id) {
      await ui.diagDisplay($t('LOGcreate_noid'))
    } else {
      userId.value = res.id
      await checkUID()
    }

  } catch (e) {
    await op.ko(e)
    userId.value = ''
  }
}

const getInvit = async () => {
  shi.value = await Crypt.strongHash(invitCode.value, false, true)
  const hsha1 = Crypt.shaS(shi.value)
  // const invit = keyToB64(shi.value)
  // const x = Crypt.shaS(keyFromB64(invit))
  const icvs = await sf.mdUserGetICVS(hsha1)
  if (!icvs) await ui.diagDisplay($t('LOGcreate_noinv'))
  else {
    if (icvs.c) {
      await ui.diagDisplay($t('LOGcreate_cr'))
      ui.loginPage.tab = 'login'
    } else {
      userId.value = icvs.i
      // await ui.diagDisplay(userId.value)
      dialogs.create = true
    }
  }
}

const checkUID = async () => {
  const icvs = await sf.mdUserGetICVS(userId.value)
  if (icvs) {
    await ui.diagDisplay($t('LOGcreate_cr'))
    ui.loginPage.tab = 'login'
  }
  else dialogs.create = true
}

const onCode = async () => {
  if (adm.value) await adminId()
  else await getInvit()
}

const onCreation = async ({ st, a1, a2, shp1, shp2 }) => {
  const invit = adm.value ? '' : keyToB64(shi.value)
  const status = await sf.createSafe(st, a1, a2, shp1, shp2, userId.value, invit)
  if (!status) {
    await ui.diagDisplay($t('LOGcreate_ok'))
    await session.setStep(1, !adm.value ? 'demands' : 'app')
  } else {
    await ui.diagDisplay($t('STSF_' + status))
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordv { border-left: 1px solid $grey-5; }
.left { position: relative; left: -10px; }
</style>
