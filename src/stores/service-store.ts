// @ts-ignore
import { ref, Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
import { $t } from '../src-fw/util'

export type TopicDef = {
  id: string
  categ: string
  key: string
  subjects: string[] | null
  pubC: Uint8Array
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
          x.push({ id: t.id, categ: t.categ, key: t.key, subjects: t.subjects})
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

  const reset = () => { topics.value = new Map() }

  return {
    reset, loadTopics, getCategs, getTopics, getTopicsJSON, nbTopics, getTopic
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useServiceStore, import.meta.hot));
}
