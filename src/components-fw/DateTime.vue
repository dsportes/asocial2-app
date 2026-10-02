<template>
<div class="row items-center">
  <q-toggle class="col-auto q-mr-sm" v-model="valid" dense 
    :disable="disable" size="sm" color="green"/>
  <q-input filled v-model="model" :label="label"
    :disable="disable" style="width:250px"
    :placeholder="$t('startPh')">
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
import { $t } from '../src-fw/util'

const model = defineModel()
const emit = defineEmits(['ok']) 
const props = defineProps({
  checkfn: Function,
  label: String,
  noOkBtn: Boolean,
  disable: Boolean,
  undoFn: Function
})
const diag = ref('')

const valid = ref(model.value !== '')
watch(valid, (v) => {
  if (!v) model.value = ''})

watch(() => model.value, (v) => {
  if (!v) valid.value = false
})

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