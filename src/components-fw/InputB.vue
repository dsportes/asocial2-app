<!-- Input stanadrdisé B - voir aussi InputA
InputA et InputB étendent la capacité du <q-input> avec:
- un contrôle syntaxique paramétrable.
- l'appel d'une fonction de validation.

Deux events "change validate" sont émis:
- "change": émis à chaque fois qu'une valeur syntaxiquement correcte est saisie.
- "validate": par un bouton ou la touche Entrée utilisée par l'utilisateur
  pour signifier qu'il a fini de saisir son texte.
- "validate" n'est pas émis si la propriété "noval" existe à true.
  - "noval" est la seule propriété watched: le contrôle de validate peut donc être
    dynamique et géré par le conteneur du composant.

InputA : son model est le string à saisir.
  - le code d'erreur en cours n'est pas accessible et reste interne à InputA.
InputB : son model est un objet { inp, err }
  - inp est la valeur à saisir.
  - err est le code courant de l'erreur courante associée.

InputB permet au composant conteneur d'agir en fonction des codes d'erreurs courants des
composants qu'il contient et de contrôler par la propriété "noval" le droit ou
non à validation de tous ses composants.
InputA est pertinent pour tous les cas où une simple saisie syntaxiquement correcte est suffisante.

Le contrôle syntaxique: "size fncheck"
Il est piloté par la propriété "size" qui désigne
une entrée déclarée dans "constants.sizes" qui est un array de 2 ou 3 termes:
- [0] : taille minimale,
- [1] : taille maximale,
- [2] : facultativement le nom d'une expression régulière déclarée dans "constants.regexp".
  En cas de présence le texte est vérifié selon cette expression.
Il en résulte le texte de l'erreur "err" qui peut être "badform" "tooshort" "toolong" ou "" (pas d'erreur).
L'existence d'une erreur bloque les émissions des events.
Une fonction "fncheck" peut être passée en propriété:
- elle retourne le code d'un message d'erreur si elle en détecte (sinon '').
- elle n'est invoquée que quand les autres tests syntaxiques (taille et expression régulière)
  n'ont pas déjà relevé d'erreur.

"disable"
Si la propriété optionnelle "disable" est fixée, <input-A/B> interdit la saisie.

"initval"
Cette propriété donne la valeur initiale avant saisie:
quand elle est fixée, un bouton "undo" permet de réinitialiser la valeur du model à sa valeur initiale.

Les libellés sont contrôlés par "prefix". Soit XXpfx ce préfixe,
- le dictionnaire linguistique peut avoir plusieurs entrées,
- XXpfx_label donne le label affiché,
- XXpfx_ph si existant donne la valeur du placeholder affiché quand le model est vide,
- XXpfx_bub si existant donne le texte de la "bulle d'aide".

En l'absence de XXpfx, le texte de la bulle d'aide est:
- si size a indiqué un nom d'expression régulière ("b64" par exemple) le texte est REGexp_b64.
- sinon c'est REGexp_all qui indique accepter toutes les valeurs.

En cas d'usage de "fncheck", les valeurs retournées doivent avoir une traduction.
-->
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
      <btn-cond round size="md" icon="close" @ok="model.inp = ''"
        :disable="disable || model.inp.length === 0" color="none"/>
      <btn-cond v-if="hasInitVal && !disable && chg"
        size="md" icon="undo" color="none" round
        @ok="undo" />
      <btn-cond v-if="!nv" size="md" label="OK"
        :disable="disable || model.err !== ''" padding="0 xs"
        @ok="emit('validate', true)" />
      <!--btn-cond v-if="mayStar"
        size="md" icon="star" color="warning" round
        @ok="model.inp = fill(model.inp)"/-->
      <q-btn v-if="list && list.length" size="lg" icon="arrow_drop_down"
        dense padding="none" color="primary">
        <q-menu auto-close>
          <div class="column q-pa-xs items-start">
            <q-btn dense flat no-caps v-for="x in list" :key="x" :label="x"
              @click="model.inp = x; emit('validate', true)"/>
          </div>
        </q-menu>
      </q-btn>
    </template>
    <template v-slot:error>{{model.err ? $t(model.err) : ''}}</template>
  </q-input>
</div>
</template>

<script setup lang="ts">

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

const star = config.K.phrasestar[props.size] || 0

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
  star && !props.disable && model.value.inp.length > star && model.value.inp.endsWith('*'))

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

if (hasInitVal.value) model.value.inp = props.initval

const chg = computed(() => !props.disable && hasInitVal.value && props.initval.value !== model.value.inp)
const hint = computed(() =>
  $t('minmax', sz.value) + (!model.value.err && !nv.value ? $t('pressret') : ''))
const undo = () => {
  if (props.initVal) model.value = props.initVal }

const xe = (inp) => {
  if (reg && inp.length && !reg.test(inp)) return 'badform'
  if (inp.length < sz.value[0]) return 'tooshort'
  if (inp.length > sz.value[1]) return 'toolong'
  if (props.size === 'isotime' && isNaN(Date.parse(inp))) return 'badform'
  return props.fncheck ?  props.fncheck(inp) : ''
}

watch(() => model.value.inp, (v) => {
  model.value.err = xe(model.value.inp)
  if (model.value.err === '' && !props.disable) emit('change', true)
})
model.value.err = xe(model.value.inp)

const val = () => {
  if (!nv.value && !props.disable && (mayStar.value || model.value.err === '')) {
    if (mayStar.value) {
      const s = fill(model.value.inp)
      const e = xe(s)
      if (e === '') {
        model.value.inp = s
        model.value.err = ''
        emit ('validate', true)
      }
    } else  emit ('validate', true)
  }
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
