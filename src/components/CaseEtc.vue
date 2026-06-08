<!--
Edite le etc d'un case propsition par un sponsor
  TOPIC_manager: '01Attribuer un pouvoir de "manager"',
  TOPIC_coredaction: '01Etre membre du comité de "Rédaction"',
  TOPIC_crauteur: '02Création d\'un nouvel auteur',
  TOPIC_joinauteur: '02Devenir co-auteur d\'un auteur',
-->
<template>
  <div>
    <div v-if="case.topicId === 'manager'">
    </div>

    <div v-if="case.topicId === 'coredaction'">
    </div>

    <div v-if="case.topicId === 'crauteur'">
    </div>

    <div v-if="case.topicId === 'joinauteur'">
    </div>

  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, Ref, computed, watch } from 'vue'
// @ts-ignore
import { $t } from '../src-fw/util'
import { Case } from '../src-fw/documents'
// import stores from '../stores/all'

const props = defineProps({
  case: Case
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>