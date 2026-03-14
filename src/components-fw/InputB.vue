<!-- Input stanadrdisé A -->
<template>
<div class="row">
  <btn-bubble class="col-auto q-mr-sm self-start" :text="$t(bubble)"/>
  <q-input class="col" v-model="model.inp" counter dense
    :disable="disable"
    filled
    input-class="font-mono"
    :type="ui.visibility ? 'text' : 'password'"
    :label="$t(prefix + '_label')"
    :placeholder="ph"
    bottom-slots
    :error="model.err !== ''"
    :hint="hint"
    @keydown.enter.prevent="val">
    <template v-slot:append>
      <btn-cond round size="md" :icon="ui.visibility ? 'visibility' : 'visibility_off'"
        @ok="ui.visibility = !ui.visibility" color="none"/>
      <btn-cond round size="md" icon="close" @ok="model = ''"
        :disable="disable || model.inp.length === 0" color="none"/>
      <btn-cond v-if="hasInitVal && !disable && chg"
        size="md" icon="undo" color="none" round 
        @ok="undo" />
      <btn-cond v-if="!nv && !disable && model.err === ''" 
        size="md" icon="check" color="warning" round
        @ok="emit('validate', true)" />
      <btn-cond v-if="mayStar" 
        size="md" icon="star" color="warning" round
        @ok="model.inp = fill(model.inp)"/>
      <q-btn v-if="list && list.length" size="lg" icon="arrow_drop_down"
        dense padding="none" color="primary">
        <q-menu auto-close>
          <div class="column q-pa-xs items-start">
            <q-btn dense flat no-caps v-for="x in list" :key="x" :label="x"
              @click="model.inp = x"/>
          </div>
        </q-menu>
      </q-btn>
    </template>
    <template v-slot:error>{{$t(model.err)}}</template>
  </q-input>
</div>
</template>

<script setup lang="ts">
/*
Ce composant étend la capacité du <q-input> avec:
- un contrôle syntaxique
- l'appel d'une fonction de validation.

Le contrôle syntaxique est piloté par la propriété "size" qui désigne
une entrée déclarée dans "constants.sizes" qui est un array de 2 ou 3 termes:
- [0] : taille minimale,
- [1] : taille maximale,
- [2] : facultativement le nom d'une expression régulière déclarée dans "constants.regexp".
  En cas de présence le texte est vérifié selon cette expression.
Il en résulte le texte de l'erreur "err" qui peut être "badform" "tooshort" "toolong" ou "" (pas d'erreur).
L'existence d'une erreur bloque l'appel de la fonction de validation.
Le composant parent peut accéder à tout instant:
- à la valeur courante saisi (puisque c'est le "model"),
- au code l'erreur courante dans la propriété "err" d'un objet passé sur la propriété "objerr":
de cette façon le parent peut, s'il le souhaite, gérer à tout instant si le texte saisi est correct syntaxiquement ou non.

Si la propriété optionnelle "disable" est fixée, <input-A> interdit la saisie.
Cette propriété est dynamique et réévaluée si sa valeur change, typiquement quand le
composant affiche la valeur courante d'une liste qui est balayée.

La propriété optionnelle "initval" donne la valeur initiale avant saisie:
quand elle est fixée, un bouton "undo" permet de réinitialiser la valeur du model à sa valeur initiale.
Cette propriété est dynamique et réévaluée si sa valeur change.

SAUF si 'noval', l'appui sur le bouton "check" ou la touche "Entrée" émet l'event 'validate'.
Event émis ssi,
- le model n'est "disable",
- il n'y a pas d'erreur syntaxique,
- le résultat de l'appel de la fonction "valctrl" (si elle a été donnée) est true.
- valeur: true si éditée (changée), false sinon

Quand un objet "objctrl" est donnée en propriété, il donne au composant parent le moyen de
contrôler si la valeur en cours de saisie est "validable" ou non en fonction du contexte
détenu par la parent et non pas seulment sur la seule valeur intrinséque du model.
Cet objet a UNE propriété "ok" : si true, la valeur en cours de saisie est
validable en fonction du contexte d'appel.
Cet objet n'est checké que si le model n'est pas disable et n'a pas d'eereur syntaxique.

Events:
- "change" : à chaque 
Les libellés sont contrôlés par "prefix". Soit XXpfx ce préfixe,
- le dictionnaire linguistique peut avoir plusieurs entrées,
- XXpfx_label donne le label affiché,
- XXpfx_ph si existant donne la valeur du placeholder affiché quand le model est vide,
- XXpfx_bub si existant donne le texte de la "bulle d'aide".

En l'absence de XXpfx, le texte de la bulle d'aide est:
- si size a indiqué un nom d'expression régulière ("b64" par exemple) le texte est REGexp_b64.
- sinon c'est REGexp_all qui indique accepter toutes les valeurs.
*/

// @ts-ignore
import { ref, computed, watch } from 'vue'
import stores from '../stores/all'
import { $t, hasMessage } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'

const ui = stores.ui
const config = stores.config

const model = defineModel() // Dans le script accessible par model.value
const emit = defineEmits(['validate', 'change'])

const props = defineProps({
  size: String, // obligatoire
  prefix: String, // obligatoire
  initval: String,
  disable: Boolean,
  noval: Boolean, // pas d'émission de 'validate' (ni 'check', ni 'Enter')
  list: Array,
  fncheck: Function
})

const star = config.K.phrasestar.has(props.size)

const nv = ref(props.noval || false)

watch(() => props.noval, (v) => {
  nv.value = v
})

const sz = ref(stores.config.K.sizes[props.size] || [0, 80])

const reg = sz.value.length > 2 ? config.K.regexp[sz.value[2]] || null : null

const bubble = computed(() => {
  let b = props.prefix + '_bub'
  if (hasMessage(b)) return b
  if (sz.value.length > 2) {
    b = 'REGexp_' + sz.value[2]
    if (reg && hasMessage(b)) return b
  }
  return 'REGexp_all'
})

const mayStar = computed(() => 
  star && !props.disable && model.value.inp.length > 2 && model.value.inp.endsWith('*'))
const mayVal = ref(false)

const ph = computed(() => {
  const e = (props.prefix || '') + '_ph'
  return hasMessage(e) ? $t(e) : ''
})

const fill = (v) => {
  const x = v.substring(0, v.length - 1)
  let s = ''; while (s.length < sz.value[1]) s += x
  return s
}

const hasInitVal = computed(() => props.initval && props.initval.length )
const chg = computed(() => !props.disable && hasInitVal.value && props.initval.value !== model.value.inp)
const hint = computed(() => 
  $t('minmax', sz.value) + (!model.value.err && !nv.value ? $t('pressret') : ''))
const undo = () => {
  if (_initval.value !== null) model.value = _initval.value }

const xe = () => {
  if (reg && !reg.test(model.value.inp)) return 'badform'
  if (model.value.inp.length < sz.value[0]) return 'tooshort'
  if (model.value.inp.length > sz.value[1]) return 'toolong'
  if (props.size === 'isotime' && isNaN(Date.parse(model.value.inp))) return 'badform'
  return props.fncheck ?  props.fncheck(model.value.inp) : ''
}

watch(() => model.value.inp, (v) => { 
  model.value.err = xe()
  if (model.value.err === '' && !props.disable) emit('change', true)
})
model.value.err = xe()

const val = () => {
  if (!nv.value && !props.disable && model.value.err === '')
    emit ('validate', true)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
