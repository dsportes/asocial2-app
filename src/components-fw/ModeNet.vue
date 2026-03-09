<template> <!-- Mode net ou non -->
<div class="row justify-between items-center q-my-sm">
  <q-toggle class="col q-pr-md" v-model="session.noNet" dense color="negative"
    :label="$t('LOGnet_' + (session.noNet ? '2' : '1'))" />
  <btn-bubble class="col-auto self-start" size="sm"
    :text="$t('LOGnet_3')"/>
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