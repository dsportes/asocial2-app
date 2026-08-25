// @ts-nocheck
import myreadme from '../assets/help/README.md?raw'
import planR from '../assets/help/a_plan.json?raw'

type node = {
  id: string
  children: []
  type: number
}

export const nodes: node[] = []
export const pages: Map<string, string> = new Map()
export const hasPage = (page: string) => { return pages.has(page) }

export const setPlan = () : void => {
  const plan = JSON.parse(planR)
  plan.forEach(p => {
    if (typeof p === 'string') {
      if (pages.has(p)) console.log('Doublon page help: ' + p)
      else {
        pages.set(p, '')
        nodes.push({ id: p, children: [], type: 1 })
      }
    } else {
      node(null, null, p, 1)
    }
  })
}

const node = (chp, parentId, page: string[], n) => { // page est un Array de la liste de la page et de ses sous pages
  if (!page.length) return
  if (pages.has(page[0])) {
    console.log('Doublon page help: ' + page[0])
    return
  }
  pages.set(page[0], parentId)
  const ch : any[] = []
  page.forEach((p, i) => {
    if (i) {
      if (typeof p === 'string') {
        if (pages.has(p)) console.log('Doublon page help: ' + p)
        else {
          pages.set(p, page[0])
          ch.push({ id: p, children: [], type: n + 1 })
        }
      } else {
        node(ch, page[0], p, n + 1)
      }
    }
  })
  const x = chp || nodes
  x.push({ id: page[0], children: ch, type: n })
}


