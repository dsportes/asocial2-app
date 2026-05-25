<!-- Affiche le détail d'une ligne Credential 
-->
<template>
  <div class="full-width">
    <div class="row font-mono fs-md">
      <div class="col-1">
        <q-icon v-if="cred.alert === 0" name="check" size="18px" color="green-5"/>
        <q-icon v-if="cred.alert" name="warning" size="24px" color="warning"/>
        <btn-cond v-if="cred.alert >= 3"
          icon="undo" round color="primary" @ok="emit('undo', true)"/>
      </div>
      <div class="col-11 q-pl-sm cursor-pointer" @click.stop="emit('select', true)">
        <div class="row">
          <div class="col-8">
            <btn-bubbletxt :text="$t('DOCCL_' + cred.docCl + '_label')" 
              :bub="$t('DOCCL_' + cred.docCl + '_bub')"/>
          </div>
          <div class="col-2 text-italic ellipsis">{{cred.docId || '(na)'}}</div>
          <div class="col-2 self-start row">
            <btn-cond class="self-start" icon="star" size="md" round
              :disable="!cred.more" @ok="cred.dispMore"
              :color="cred.more ? 'green-5' : 'grey-5'"/>
            <btn-cond class="self-start" icon="hourglass" size="md" round 
              :disable="!cred.limit"  @ok="cred.dispLimit"
              :color="cred.limit ? 'warning' : 'grey-5'"/>
            <btn-cond class="self-start" icon="key" size="md" round
              :disable="!cred.docKey" @ok="cred.dispDocKey"
              :color="cred.docKey ? 'warning' : 'grey-5'"/>
            <btn-cond class="self-start" icon="folder_info" size="md" round 
              :disable="!cred.opaque" @ok="cred.dispOpaque"
              :color="cred.opaque ? 'primary' : 'grey-5'"/>
          </div>
        </div>
        <div class="row">
          <div class="col-10 font-mono fs-md mh text-italic">{{cred.name || '?'}}</div>
          <div class="col-2 ellipsis q-pr-sm">{{cred.credId}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BtnBubbletxt from '../components-fw/BtnBubbletxt.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { CredSafeA } from '../src-fw/documents'

const props = defineProps({
  cred: CredSafeA
})

const emit = defineEmits(['undo', 'select'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
