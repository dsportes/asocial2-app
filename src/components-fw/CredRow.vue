<template>
<div>
  <div class="column font-mono fs-md full-width">
    <div class="row font-mono fs-md items-center">
      <q-icon v-if="st === 1" class="col-1" name="add_circle" size="24px" color="warning"/>
      <q-icon v-if="st === 2" class="col-1" name="delete" size="24px"  color="warning"/>
      <q-icon v-if="st === 0 || st === 3" class="col-1" name="check" size="12px"  color="none"/>
      <div :class="'col-2 ellipsis q-px-xs' + cl">{{cred.svc}}</div>
      <div :class="'col-2 ellipsis q-px-xs' + cl">{{cred.xid.substring(0, 8)}}</div>
      <div :class="'col-2 ellipsis q-px-xs' + cl">{{cred.org}}</div>
      <div :class="'col-4 ellipsis q-pr-xs' + cl">{{$t('ROLE' + cred.role)}}</div>
    </div>
    <div class="row font-mono fs-md">
      <div class="col-2"></div>
      <div :class="'col-10 mh' + (st === 3 ? ' text-warning text-italic' : ' text-italic') + cl">
        {{cred.about + (cred.entid ? ' [' + cred.entid.substring(0, 8) + ']' : '')}}</div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed} from 'vue'
import { Credential } from '../src-fw/credential'

const props = defineProps({
  cred: Credential,
  st: Number // 0: inchangé 1:importé/créé 2:supprimé 3:about corrigé
})

const cl = computed(() => props.st === 2 ? ' text-strike' : '')
</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
