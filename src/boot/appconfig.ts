// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import { docTypeErrors } from '../app/docschema'
import { DocType } from '../src-fw/doctypes'
import { K } from '../app/constants'
import stores from '../stores/all'
import { Help } from '../src-fw/help'

import readme from '../assets/README.md?raw'
import plan from '../assets/help/a_plan.json'
import bientot_fr from '../assets/help/bientot_fr.md?raw'
import bientot_en from '../assets/help/bientot_en.md?raw'
import boite_automaj_fr from '../assets/help/boite_automaj_fr.md?raw'
import defaut$png from '../assets/help/defaut.png?inline'
import dial_editeur_fr from '../assets/help/dial_editeur_fr.md?raw'
import DOCpg_fr from '../assets/help/DOCpg_fr.md?raw'
import pages_fr from '../assets/help/pages_fr.md?raw'
import pages_struct_fr from '../assets/help/pages_struct_fr.md?raw'
import panel_outils_fr from '../assets/help/panel_outils_fr.md?raw'
import top_bar_fr from '../assets/help/top_bar_fr.md?raw'
import top_bar$png from '../assets/help/top_bar.png'

export default defineBoot(async ({ app }) => {
  stores.config.initK(K, window.location)
  
  if (docTypeErrors.length) {
    console.error(docTypeErrors.join('\n'))
    window.alert('appconfig: ' + docTypeErrors.length + ' compile schema errors')
  } else console.log('appconfig: ' + DocType.docTypes.size + ' document classes')

  const helpPages = { 
    bientot_fr, bientot_en, boite_automaj_fr, defaut$png, dial_editeur_fr,
    DOCpg_fr, pages_fr, pages_struct_fr, panel_outils_fr, top_bar_fr, top_bar$png
  }

  const helpLabels = {
    fr: {
      boite_automaj: 'Mise à jour automatique des données d\'une session',
      dial_editeur: 'L\'éditeur des textes',
      DOCpg: 'L\'application "a-social"',
      pages: 'Pages de l\'application',
      pages_struct: 'Disposition générale d\'une page',
      panel_outils: 'Boîte à outils',
      top_bar: 'Barre du haut',
      dial: 'Dialogues ...'
    },
    en: {

    }
  }

  Help.setPlan(plan, readme, helpPages, helpLabels)

})
