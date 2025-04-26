<template>
  <span class="flag cursor-pointer">{{ loc.flag }}
    <q-menu dense transition-show="flip-up" transition-hide="flip-down">
      <q-list style="min-width: 7rem">
        <q-item v-for="lg in config.localeOptions" :key="lg.value" @click="choix(lg)" clickable v-close-popup>
          <q-item-section class="q-mx-xs fs-lg">{{lg.flag}} {{lg.label}}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip class="ttip">{{$t('langue')}}</q-tooltip>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const i18n = useI18n()

import { useConfigStore } from '../stores/config-store.js'
const config = useConfigStore()

const loc = computed(() => config.optionLocale)

const choix = (lg) => {
  i18n.locale.value = lg.value
  config.setLocale(lg.value)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.flag {
  line-height: 1.7rem;
  font-size: 1.7rem;
  padding: none;
  margin: none
}
</style>
