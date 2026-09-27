<template>
<div style="max-width:280px">
  <q-input filled v-model="model" :label="label">
    <template #prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="model" mask="YYYY-MM-DD HH:mm" today-btn>
            <div class="row items-center justify-end">
              <q-btn v-close-popup :label="$t('close')" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>

    <template #append>
      <div class="row items-center q-gutter-sm">
        <q-icon name="access_time" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time v-model="model" mask="YYYY-MM-DD HH:mm" format24h now-btn>
              <div class="row items-center justify-end">
                <q-btn v-close-popup :label="$t('close')" color="primary" flat />
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
        <btn-cond v-if="model" flat icon="close" color="negative" @ok="model = ''"/>
        <btn-cond v-if="undoFn" flat icon="undo" color="none" @ok="undoFn()"/>
        <btn-cond v-if="!noOkBtn" round icon="check" color="warning" @ok="dook"/>
      </div>
    </template>
  </q-input>
  <div v-if="diag" class="msg q-my-xs">{{ diag }}</div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, reactive, watch } from 'vue'
import BtnCond from '../components-fw/BtnCond.vue'

const model = defineModel()
const emit = defineEmits(['ok']) 
const props = defineProps({
  checkfn: Function,
  label: String,
  noOkBtn: Boolean,
  undoFn: Function
})
const diag = ref('')

const dook = () => {
  const v = model.value
  diag.value = props.checkfn ? props.checkfn(v) : ''
  if (!diag.value) emit('ok', v)
}

diag.value = props.checkfn ? props.checkfn(model.value) : ''

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>