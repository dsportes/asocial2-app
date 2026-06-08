// @ts-ignore
import { ref, Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import { $t } from '../src-fw/util'
import { opOfSvcOrg } from '../src-fw/operation'
import { GetTopics } from '../src-fw/operations'

/*
- `subjects`:
  - absent: le topic n'a pas de sujets.
  - `"a b c "`. Valeurs des codes séparées par un espace. Un libellé traduit chacun dans la langue choisie en session.
  - `"@sujet35"` : ID du _singleton_ (du service) portant la liste des codes.
  - `"$sujet35"` : ID du _Property_ (de l'organisation) portant la liste des codes.
  - `"DocCl/alias"` : nom de classe `DocCl` des documents dont `alias` est un propriété dont les valeurs constituent la liste des codes valides.
- `creds`: credentials requis listés par une expression de la forme `A` (_administrateur_) ou  `"c1 c2 c3 ..."` où les `ci` peuvent être:
  - `docCl/1` : les credentials ayant le couple `docCl 1` comme `docCl docId` sont candidats.
  - `docCl/S` : les credentials ayant un couple `docCl docId` où `docId` est égal au `subject` du case sont candidats.
*/
export type TopicDef = {
  id: string
  categ: string
  key: string
  subjects: string
  pubC: Uint8Array
  creds: string[] // [A docCl/S docCl/1]
}
export type LabVal = {
  label: string
  value: string | TopicDef
}

export const useServiceStore = defineStore('service', () => {

  // svc >> categ >> Map(topic)
  const topics: Ref<Map<string, Map<string, Map<string, TopicDef>>>> = ref(new Map())

  const loadTopics = (svc: string, lt: TopicDef[], reset: boolean) => {
    let s = topics.value.get(svc)
    if (!s) { s = new Map(); topics.value.set(svc, s) }
    if (reset) s.clear()
    for(const t of lt) {
      let c = s.get(t.categ)
      if (!c) { c = new Map(); s.set(t.categ, c)}
      c.set(t.id, t)
    }
  }

  const getTopicDefs = (svc: string) : TopicDef[] => {
    const l: TopicDef[] = []
    const mc = topics.value.get(svc)
    if (mc)
      for(const [, mt] of mc)
        for(const [, t] of mt) l.push(t)
    return l
  }

  const nbTopics = (svc: string) : number => {
    const mc = topics.value.get(svc)
    if (!mc) return 0
    let n = 0
    for(const [, mt] of mc) n += mt.size
    return n
  }

  const getTopicsJSON = (svc: string) : string => {
    const x: any[] = []
    const mc = topics.value.get(svc)
    if (mc) {
      for(const [, mt] of mc) {
        for(const [, t] of mt) {
          x.push({ id: t.id, categ: t.categ, key: t.key, subjects: t.subjects, creds: t.creds})
        }
      }
    }
    return JSON.stringify(x, null, '\t')
  }

  const getTopic = (svc: string, id: string) : TopicDef | null => {
    const mc = topics.value.get(svc)
    if (mc)
      for(const [, mt] of mc)
        for(const [, t] of mt) 
          if (t.id === id) return t
    return null
  }

  /* Retourne la liste des categories triée [ label: value: ]
  - ordre de tri: le label traduit. les 2 premiers sont ensuite enlevés
    01Administration ...
  - value est le code
  */ 
  const getCategs = (svc: string) : LabVal[] => {
    const lcategs: string[] = Array.from(topics.value.get(svc).keys())
    if (!lcategs.length) return []
    const l: LabVal[] = []
    for(const categ of lcategs) l.push({ label: $t('CATEG_' + categ), value: categ })
    l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
    for(const x of l) x.label = x.label.substring(2)
    return l
  }

  /* Retourne la liste des topics d'une catégorie triée [ label: value: ]
  - ordre de tri: le label traduit. les 2 premiers sont ensuite enlevés
    01Demande de pouvoir "manager" ...
  - value est le topic
  */ 
  const getTopics = (svc: string, categ: string) : LabVal[] => {
    const e = topics.value.get(svc)
    if (!e) return []
    const ltopics: TopicDef[] = Array.from(e.get(categ).values())
    if (!ltopics.length) return []
    const l: LabVal[] = []
    for(const topic of ltopics) {
      l.push({ label: $t('TOPIC_' + topic.id), value: topic })
    }
    l.sort((a, b) => a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
    for(const x of l) x.label = x.label.substring(2)
    return l
  }

  const loadSvcOrgTopics = async (svc: string, org: string, forceReload?: boolean) => {
    if (!topics.value.has(svc) || forceReload) {
      const oper = await opOfSvcOrg(svc, org)
      const op = new GetTopics(svc, oper)
      const defs = await op.run()
      loadTopics(svc, defs, forceReload)
    }
  }

  const reset = () => { topics.value = new Map() }

  return {
    reset, loadTopics, getCategs, getTopics, getTopicsJSON,
    nbTopics, getTopic, loadSvcOrgTopics, getTopicDefs
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useServiceStore, import.meta.hot));
}
