<!-- Component de fixation du mode incognito ou non -->
<template>
<div class="row self-start full-width justify-between items-center q-my-sm">
  <q-toggle class="col q-pr-md" v-model="session.noLocal" dense color="negative"
    :label="$t('SESincognito_' + (session.noLocal ? '2' : '1'))"/>
  <btn-bubble class="col-auto self-start"
    :text="$t('SESmodes')"/>
</div>
</template>

<script setup lang="ts">
import stores from '../stores/all'
import BtnBubble from '../components-fw/BtnBubble.vue'

const session = stores.session

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>