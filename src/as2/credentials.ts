import { schemaExcAS2 } from '../as2/schema'

import { Registry } from '../src-fw/registry'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Credential } from '../src-fw/documents'
import { $Perimeter } from '../src-fw/subscription'

const ok = !schemaExcAS2()
let n = 0

/* Credentials **************************************************************************/
class AS2$Credential_CoDir extends $Credential {
  static _manager = true
  static _role = 'ad'

  get hasDispProps () { return true }

  async dispProps () { 
    const ui = stores.ui
    await ui.diagDisplay($t('TYPE_AS2_membrecodir_det', [this.props.name]))
  }
}
if (ok) { n++; Registry.register(AS2$Credential_CoDir) }

class AS2$Credential_Redaction extends $Credential {
  static _manager = true
  static _role = 'ad'

  get hasDispProps () { return true }

  async dispProps () { 
    const ui = stores.ui
    await ui.diagDisplay($t('TYPE_AS2_membreredaction_det', [this.props.name]))
  }
}
if (ok) { n++; Registry.register(AS2$Credential_Redaction) }

export class AS2$Credential_Auteur extends $Credential {

  getPerimeters () : $Perimeter[] {
    return [ 
      new $Perimeter(this.svc, this.org, '', 'Auteur', this.docPk, 'AS2_auteurs', true, ['Auteur/' + this.docPk], this.name )
    ]
  }
  get hasDispProps () { return true }

  async dispProps () { 
    const ui = stores.ui
    let m = $t('TYPE_AS2_auteur_det', [this.props.name])
    if (this.props.trig) m += ' \n ' + $t('TYPE_AS2_auteur_trigramme_det', [this.props.trig])
    await ui.diagDisplay(m)
  }
}
if (ok) { n++; Registry.register(AS2$Credential_Auteur) }

export const AS2nbCreds = () : number => n
