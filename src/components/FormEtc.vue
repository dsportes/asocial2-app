<!--
Edite le etc d'un Form
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])
-->
<template>
  <div>
    <div v-if="form.type === 'membrecodir'">
    </div>

    <div v-if="form.type === 'membreredaction'">
    </div>

    <div v-if="form.type === 'auteur'">
    </div>

    <div v-if="form.type === 'coauteur'">
    </div>

  </div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { ref, Ref, computed, watch } from 'vue'
// @ts-ignore
import { $t } from '../src-fw/util'
import { $Form } from '../src-fw/documents'
// import stores from '../stores/all'

const props = defineProps({
  form: $Form,
  etc: Object
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord1 { border: 1px solid $grey-5; border-radius: 5px; }
</style>