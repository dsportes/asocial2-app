import en from './en'
import fr from './fr'

const enx = {}
for(const e in fr) enx[e] = fr[e]
for(const e in en) enx[e] = en[e]

export default {
  'en': enx,
  'fr': fr
}
