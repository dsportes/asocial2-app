<!-- Affiche le détail d'une ligne Credential -->
<template>
  <div class="full-width">
    <div class="row font-mono fs-md items-center">
      <q-icon v-if="cred.alert" class="col-1" name="warning" size="24px" color="warning"/>
      <q-icon v-else class="col-1" name="check" size="18px"  color="green-5"/>
      <div class="col-2 ellipsis q-pr-sm">{{cred.credId}}</div>
      <div class="col-5">
        <btn-bubbletxt :text="$t('ROLE' + cred.role)" :bub="$t('ROLE' + cred.role + '_bub')"/>
      </div>
      <div class="col-3 text-italic ellipsis">{{cred.docId || '(na)'}}</div>
      <q-icon v-if="cred.cond" class="col-1" name="star" size="24px" color="green-5"/>
      <div v-else class="col-1"></div>
    </div>
    <div class="row font-mono fs-md">
      <div class="col-3"></div>
      <div class="col-9 mh text-italic">
        {{cred.comment || $t('nocomment')}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed} from 'vue'
import BtnBubbletxt from '../components-fw/BtnBubbletxt.vue'

const props = defineProps({
  cred: Object
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
