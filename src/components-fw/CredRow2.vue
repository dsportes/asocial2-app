<!-- Affiche le détail d'une ligne $Credential 
-->
<template>
    <div class="row font-mono fs-md" style="overflow-x: hidden;">
      <div class="col-1">
        <q-icon v-if="cred.alert === 0" name="check" size="18px" color="green-5"/>
        <q-icon v-if="cred.alert" name="warning" size="24px" color="warning"/>
        <btn-cond v-if="cred.alert === 2"
          icon="undo" round color="primary" @ok="emit('undo', true)"/>
      </div>
      <div class="col-11 cursor-pointer" @click.stop="emit('select', true)">
        <div class="row">
          <div class="col-8">
            <btn-bubbletxt :text="$t('CREDON_' + cred.docCl)" 
              :bub="$t('CREDON_' + cred.docCl + '_bub')"/>
          </div>
          <div class="col-2 text-italic ellipsis">{{cred.docPk || '(na)'}}</div>
          <div class="col-2 justify-end row">
            <btn-cond v-if="cred.props" class="self-start" icon="star" size="md" round
              :disable="!cred.hasDispProps" @ok="cred.dispProps"
              :color="cred.hasDispProps ? 'green-5' : 'grey-5'"/>
            <btn-cond v-if="cred.props" class="self-start" icon="hourglass" size="md" round 
              :disable="!cred.limit"  @ok="cred.dispLimit"
              :color="cred.limit ? 'warning' : 'grey-5'"/>
          </div>
        </div>
        <div class="row">
          <div class="col-10 font-mono fs-md mh text-italic">
            {{cred.props && cred.props.name ?  cred.props.name : '?'}}</div>
          <div class="col-2 ellipsis q-pr-sm">{{cred.credPk}}</div>
        </div>
        <div v-if="comment && cred.name" class="font-mono text-bold">{{ cred.name }}</div>
      </div>
    </div>
</template>

<script setup lang="ts">
import BtnBubbletxt from '../components-fw/BtnBubbletxt.vue'
import BtnCond from '../components-fw/BtnCond.vue'

const props = defineProps({
  cred: Object,
  comment: Boolean
})

const emit = defineEmits(['undo', 'select'])

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.mh { max-height: 1.3rem; overflow: hidden;}
</style>
