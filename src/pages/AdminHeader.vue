<template>
<div>
  <std-header>
    <template #btn>
      <q-icon v-if="adminPage.mdAdmin" name="security" color="negative" size="28px"/>
    </template>
  </std-header>

  <q-tabs dense v-model="ui.adminPage.tab" breakpoint="2000px"
    class="full-width tbp shadow-2">
    <q-tab name="sites" icon="cloud" :label="$t('sites')" />
    <q-tab name="orgs" icon="people" :label="$t('orgs')" />
    <q-tab name="managers">
      <img :src="superman" width="24px"/>
      <div>{{ $t('APnewManager_2') }}</div>
    </q-tab>
  </q-tabs>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { Ref, onMounted, ref } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import StdHeader from '../components-fw/StdHeader.vue'
import { isMDAdmin } from 'src/src-fw/operation'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui

const isAdmin: Ref<boolean> = ref(false)
const adminPage = ref({ mdAdmin: false})

onMounted(async () => { 
  isAdmin.value = await isMDAdmin()
  adminPage.value = ui.resetAdminPage(isAdmin.value) 
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
