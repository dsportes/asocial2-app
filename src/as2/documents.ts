import { Registry, $Document, SOA } from '../src-fw/registry'
import { DocDescriptor, FormType } from '../src-fw/docDescriptor'
import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { $Credential } from '../src-fw/documents'
import { Operation } from '../src-fw/operation'

export const AS2docLoading = () => {
  console.log('Document classes loaded: ' + Registry.classes.size)
}

try {
  const svc = 'AS2'

  new DocDescriptor(svc, { name: 'Credential', pk: ['credId'], nohash: true, subClassBy: 'docCl' })
  new DocDescriptor(svc, { name: 'Form', pk: ['formId'], nohash: true, subClassBy: 'type' })
  new DocDescriptor(svc, { name: 'Section', enum: ['roman', 'histoire', 'sf'] })
  new DocDescriptor(svc, { name: 'Auteur', pk: ['autId'] })

  new FormType(svc, 'membrecodir', 'ad', 'k1', ['A'])
  new FormType(svc, 'membreredaction', 'ad', 'k1', ['A'])
  new FormType(svc, 'auteur', 'auteurs', 'k2', ['Redaction/1'])
  // Un Auteur peut aussi nommer un co-auteur
  new FormType(svc, 'coauteur', 'auteurs', 'k2', ['Redaction/1', 'Auteur/$1'])

  console.log('AS2 document descriptors:' + DocDescriptor.size() + ' forms descriptors:' + FormType.size())
} catch (e) {
  window.alert(e.toString())
}

/* Credentials **************************************************************************/
class AS2$Credential_CoDir extends $Credential {
  constructor (obj?: Object) { super(obj) }

  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
Registry.register(AS2$Credential_CoDir)

class AS2$Credential_Redaction extends $Credential {
  constructor (obj?: Object) { super(obj) }

  get hasDispProps () { return true }

  async dispAboutme () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRaboutme', this.props.name))
  }
}
Registry.register(AS2$Credential_Redaction)

export class AS2$Credential_Auteur extends $Credential {
  constructor (obj?: Object) { super(obj) }

}
Registry.register(AS2$Credential_Auteur)

/* Documents **************************************************************************/

export class AS2$Auteur extends $Document {
  // Donne le autid de svc/org/nom
  static autids: Map<string, string> = new Map()

  async compile () {}

  nom: string // nom d'auteur
  section: string // section du Comité de Rédaction en charge de l'auteur

  static async autidParNom (soa: SOA, nom: string) : Promise<string> {
    const k = soa.svc + '/' + soa.org + '/' + nom
    let autid = AS2$Auteur.autids.get(k)
    if (autid) return autid
    const op = new Operation('AutidDeNom', soa.svc, soa.org)
    op.args.nom = nom
    try {
      const res = await op.post()
      autid = res.autid
      if (autid) {
        // Auteur.autids.set(k, autid)
        return autid
      } else return ''
    } catch (e) {
      op.ko(e)
      return ''
    }
  }

  static async get (autid?: string, autPk?: string) : Promise<AS2$Auteur | null> {
    const soa = stores.session.currentOrgSvc
    const op = new Operation('AuteurDeId', soa.svc, soa.org)
    const pk = autPk || Registry.getPk(soa.svc, 'Auteur', { autid: autid })
    op.sign(stores.safe.myCredOfDoc('Auteur', pk))
    op.args.autPk = pk
    try {
      const res = await op.post()
      return res.auteur
    } catch (e) { op.ko(e); return null }
  }

}
Registry.register(AS2$Auteur)
