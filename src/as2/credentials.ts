import { schemaExcAS2 } from '../as2/schema'

import { Registry } from '../src-fw/registry'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Credential } from '../src-fw/documents'

const ok = !schemaExcAS2()
let n = 0

/* Credentials **************************************************************************/
class AS2$Credential_CoDir extends $Credential {
  constructor (obj?: Object) { super(obj) }

  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
if (ok) { n++; Registry.register(AS2$Credential_CoDir) }

class AS2$Credential_Redaction extends $Credential {
  constructor (obj?: Object) { super(obj) }

  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
if (ok) { n++; Registry.register(AS2$Credential_Redaction) }

export class AS2$Credential_Auteur extends $Credential {
  constructor (obj?: Object) { super(obj) }

}
if (ok) { n++; Registry.register(AS2$Credential_Auteur) }

export const AS2nbCreds = () : number => n
