import { AppExc } from '../src-fw/log'
import { Registry } from '../src-fw/registry'
import { Descriptor } from '../src-fw/descriptor'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Credential} from '../src-fw/documents'
import { $Perimeter } from '../src-fw/subscription'

let n = 0, nf = 0, exc: AppExc | undefined

/* Classe ayant des sous-classes: *****************************************************
- aucun document n'est instantiable avec cette classe
*/
class AS2$Credential extends $Credential {
  static _descriptor = Descriptor.doc('AS2', 'Credential', 
    { pk: ['credId'], nohash: true, subClassBy: 'docCl' })
}
if (!exc) { n++; exc = Registry.register(AS2$Credential) }

/* Sous classes de AS2$Credentials ******************************************************
- N'A PAS de _descriptor
- est register en tant que sous-classe de AS2@Credential
*/
class AS2$Credential_CoDir extends $Credential {
  static _manager = true
  static _role = 'ad'

  get hasDispProps () { return true }

  async dispProps () { 
    const ui = stores.ui
    await ui.diagDisplay($t('TYPE_AS2_membrecodir_det', [this.props.name]))
  }
}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Credential_CoDir, AS2$Credential, 'CoDir') }

class AS2$Credential_Redaction extends $Credential {
  static _manager = true
  static _role = 'ad'

  getPerimeters () : $Perimeter[] {
    return [ 
      new $Perimeter(this.svc, this.org, '', 'Redaction', '1', 'AS2_ad', false, ['Redaction'], this.name )
    ]
  }
  get hasDispProps () { return true }

  async dispProps () { 
    const ui = stores.ui
    await ui.diagDisplay($t('TYPE_AS2_membreredaction_det', [this.props.name]))
  }
}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Credential_Redaction, AS2$Credential, 'Redaction') }

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
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Credential_Auteur, AS2$Credential, 'Auteur') }

export const AS2CredentialsReport = () : AppExc | undefined => {
  if (!exc)
    console.log(`AS2CredentialsLoading: ${n} documents, ${nf} forms`)
  else {
    console.log(`AS2CredentialsLoading FAILED: ${exc.toString()}`)
    return exc
  }
}
