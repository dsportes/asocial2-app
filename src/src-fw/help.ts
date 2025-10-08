import { $t } from './util'

type node = {
  id: string
  label: string
  children: []
  type: number
}

export class Help {
  static help: Help
  static readme: string
  
  static setPlan (plan: Object, readme: string) { 
    Help.help = new Help(plan) 
    Help.readme = readme
  }

  static hasPage (page: string) {
    return Help.help.pages.has(page)
  }

  static pages () { return Help.help.pages }
  static tree () { return Help.help.tree }

  tree: node[]
  pages: Map<string, string>

  constructor (plan) {

    this.tree = []
    this.pages = new Map()

    plan.forEach(p => {
      if (typeof p === 'string') {
        if (this.pages.has(p)) console.log('Doublon page help: ' + p)
        else {
          this.pages.set(p, null)
          this.tree.push({ id: p, label: $t('A_' + p), children: [], type: 1 })
        }
      } else {
        this.node(null, null, p, 1)
      }
    })
  }

  node (chp, parentId, page: string[], n) { // page est un Array de la liste de la page et de ses sous pages
    if (!page.length) return
    if (this.pages.has(page[0])) {
      console.log('Doublon page help: ' + page[0])
      return
    }
    this.pages.set(page[0], parentId)
    const ch = []
    page.forEach((p, i) => {
      if (i) {
        if (typeof p === 'string') {
          if (this.pages.has(p)) console.log('Doublon page help: ' + p)
          else {
            this.pages.set(p, page[0])
            ch.push({ id: p, label: $t('A_' + p), children: [], type: n + 1 })
          }
        } else {
          this.node(ch, page[0], p, n + 1)
        }
      }
    })
    const x = chp || this.tree
    x.push({ id: page[0], label: $t('A_' + page[0]), children: ch, type: n })
  }
}
