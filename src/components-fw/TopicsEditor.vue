<template>
<div>
  <div class="titre-md text-italic q-my-sm">
    {{ $t('APnbtopics', nbTopics, {count: nbTopics}) }}
  </div>
  <div class="column q-gutter-sm items-center">
    <btn-cond :label="$t('APtopicload')" @ok="getTopics"/>
    <text-zoom v-if="nbTopics !== 0"
      :label="$t('APtopicjson')" :rows="20" :text="jsonTopics"/>
  </div>

  <q-expansion-item v-model="upd"
    class="q-my-md full-width" dense dense-toggle header-class="tbs"
      :label="$t('APupdtopics')" >
    <div class="row full-width">
      <q-input type="textarea" :row="10" v-model="json" 
        class="col q-mr-md q-pa-xs font-mono bord1"/>
      <btn-cond :label="$t('ok')" class="col-auto self-start"
        padding="none xs" @ok="saveTopics"/>
    </div>
  </q-expansion-item>

  <topic-menu :disable="nbTopics === 0" @select="selTopic"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed } from 'vue'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { keyToB64 } from '../src-fw/b64'
import { GetTopics, UpdTopics } from '../src-fw/operations'

import BtnCond from '../components-fw/BtnCond.vue'
import TextZoom from '../components-fw/TextZoom.vue'
import TopicMenu from '../components-fw/TopicMenu.vue'

const svc = stores.service
const ui = stores.ui

const props = defineProps({ 
  svc: String,
  op: String,
})

const upd = ref(false)

const getTopics = async () => {
  const op = new GetTopics(props.svc, props.op)
  const n = await op.run()
  console.log(n)
}

const jsonTopics = computed(() => svc.getTopicsJSON(props.svc))
const nbTopics = computed(() => svc.nbTopics(props.svc))

const json = ref('')
const saveTopics = async () => {
  const op = new UpdTopics(props.svc, props.op)
  await op.run(json.value)
  upd.value = false
  await getTopics()
  await ui.diagDisplay($t('APupddone'))
}

const selTopic = async (topic) => {
  const ls = topic.subjects ? topic.subjects.join(' ') : '-'
  const pc = keyToB64(topic.pubC)
  await ui.diagDisplay($t('APtopicdet', [topic.id, topic.key, ls, pc]))
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
