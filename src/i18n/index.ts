import en from './en'
import fr from './fr'

const enx: any = {}
for(const e in fr) enx[e] = (fr as any)[e]
for(const e in en) enx[e] = (en as any)[e]

export default {
  'en': enx,
  'fr': fr
}
