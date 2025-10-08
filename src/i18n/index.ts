import enEN from './en-EN'
import frFR from './fr-FR'

const en = {}
for(const e in frFR) en[e] = frFR[e]
for(const e in enEN) en[e] = enEN[e]

export default {
  'en': en,
  'fr': frFR
}
