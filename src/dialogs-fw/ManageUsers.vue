<!-- Dialogue de gestion des users locaux.
Event: close
-->
<template>
<dialog-std2 v-model="model" :title="$t('HPmanusers')" vue="ManageUsers">

<template #default>
<div class="q-pa-xs column items-center">
  <div class="wmd full-width q-pa-xs">
    <div v-for="([uid, t], idx) of sf.trustings" :key="uid" 
      :class="'q-my-sm ' + dkli(idx)">
      <div class="row">
        <btn-cond icon="delete" color="warning" confirm @ok="delu(uid)"
          class="col-1"/>
        <div class="col-3 q-pr-xs ellipsis text-bold font-mono fs-lg">{{t.pseudo}}</div>
        <div class="col-6 q-pr-xs ellipsis font-mono fs-sm">{{ uid }}</div>
        <div class="col-2 q-pr-xs ellipsis font-mono">{{ t.store }}</div>
      </div>
      <div v-for="app of t.appsDb" :key="app">
        <div class="row">
          <div class="col-1"></div>
          <div class="col-3 q-pr-xs ellipsis text-bold font-mono">{{app}}</div>
          <btn-cond v-if="vol(uid, app) >= 0" icon="delete" color="warning" confirm
            class="col-6 q-pr-sm" flat :label="$t('HPmanudeldb')"
            @ok="delDb(uid, app)"/>
          <!--btn-cond v-else icon="check" color="primary" 
            class="col-6 q-pr-xs" flat :label="$t('HPmanuvol')"
            @ok="compDb(uid, app)"/-->
          <div v-if="vol(uid, app) >= 0" class="col-2 ellipsis text-bold font-mono text-right">
            {{ edvol(vol(uid, app))}}
          </div>
          <div v-else class="col-2 ellipsis text-italic text-right">
            {{ $t('HPnocalc') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>
</dialog-std2>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, onMounted } from 'vue'
import stores from '../stores/all'
import { $t, dkli, edvol } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import DialogStd2 from '../dialogs-fw/DialogStd2.vue'
import { volumeIDB } from '../src-fw/idb'
import { IDBsafe } from '../src-fw/idbsafe'

const sf = stores.safe

const model = defineModel()

/* volume des bases par "userId / app"
  - undefined: pas de base
  -1: volume non calculé
  N : volume utile
*/
const dbs: Ref<Map<string, number>> = ref(new Map())
const vol = (userId, app) => dbs.value.get(userId + '/' + app) || 0

const setDbs = async () => {
  for(const [u, t] of sf.trustings) {
    if (t.appsDb) for(const app of t.appsDb) {
      const k = u + '/' + app
      const [vp, vd, vc] = await volumeIDB(app, u)
      const v = vp + vd + vc
      dbs.value.set(k, v)
    }
  }
}

onMounted(async () => {
  await setDbs()
})

const delu = async (userId: string) => {
  await IDBsafe.delTrusting(userId)
  console.log('delete user:', userId)
}

const delDb = async (userId: string, app: string) => {
  console.log('delete Cache:  user:', userId, ' app:', app)
  dbs.value.delete(userId + '/' + app)
  const t = sf.trustings.get(userId)
  await t.delAppsDb(app)
}

const compDb = async (userId: string, app: string) => {
  const [vp, vd, vc] = await volumeIDB(app, userId)
  const v = vp + vd + vc
  console.log('volume Cache:  user:', userId, ' app:', app, ' vol:', v)
  dbs.value.set(userId + '/' + app, v)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
