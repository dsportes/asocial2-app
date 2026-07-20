import { Registry } from '../src/src-fw/registry'
import { $Credential } from '../src/src-fw/documents'
import stores from '../src/stores/all'
import { $t, dhcool } from '../src/src-fw/util'

/*
  async dispPower () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRpower', [JSON.stringify(this.power, null, '\t')]))
  }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', [JSON.stringify(this.aboutme, null, '\t')]))
  }
*/

class $Credential_CoDir extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
// Registry.registerD($Credential_CoDir)

class $Credential_Redaction extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
// Registry.registerD($Credential_Redaction)

// TODO ???????????????
class $Credential_Section extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
}
// Registry.registerD($Credential_Section) 

class $Credential_Auteur extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
}
// Registry.registerD($Credential_Auteur)

export const regCredentials = () => {
  console.log('Credentials registered')
}