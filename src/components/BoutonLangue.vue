<template>
  <span class="flag cursor-pointer">{{ loc.flag }}
    <q-menu dense transition-show="flip-up" transition-hide="flip-down">
      <q-list style="min-width: 7rem">
        <q-item v-for="lg in config.localeOptions" :key="lg.value" @click="choix(lg.value)" clickable v-close-popup>
          <q-item-section class="q-mx-xs fs-lg">{{lg.flag}} {{lg.label}}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip class="ttip">{{$t('langue')}}</q-tooltip>
  </span>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'
// @ts-ignore
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '../stores/config-store'

const i18n = useI18n()
const config:any = useConfigStore()

// const x = config.$t('langue') // test d'accès à $t

const loc = computed(() => config.optionLocale)

function choix (lg: string) : void {
  i18n.locale.value = lg
  config.setLocale(lg)
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
