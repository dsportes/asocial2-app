<!-- Affiche le détail d'une ligne Credential -->
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
            <btn-bubbletxt :text="$t('ROLE' + cred.role)" :bub="$t('ROLE' + cred.role + '_bub')"/>
          </div>
          <div class="col-3 text-italic ellipsis">{{cred.docId || '(na)'}}</div>
          <q-icon v-if="cred.cond" class="col-1 self-start" name="star" size="24px" color="green-5"/>
          <div v-else class="col-1"></div>
        </div>
        <div class="row">
          <div class="col-10 font-mono fs-md mh text-italic">{{cred.comment || $t('nocomment')}}</div>
          <div class="col-2 ellipsis q-pr-sm">{{cred.credId}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { computed} from 'vue'
import BtnBubbletxt from '../components-fw/BtnBubbletxt.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const props = defineProps({
  cred: Object
})

const emit = defineEmits(['undo', 'select'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
