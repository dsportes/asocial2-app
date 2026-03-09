<template> <!-- Mode incognito ou non -->
<div class="row self-start full-width justify-between items-center q-my-sm">
  <q-toggle class="col q-pr-md" v-model="session.incognito" dense color="negative"
    :label="$t('SESincognito_' + (session.incognito ? '2' : '1'))"/>
  <btn-bubble class="col-auto self-start" size="sm"
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