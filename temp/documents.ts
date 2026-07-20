
import { Registry, $Document } from '../src/src-fw/registry'
import { regForms } from '../src/as2/forms'
import { regCredentials } from './credentials'
import { Operation } from '../src/src-fw/operation'
import { SOA, $Credential } from '../src/src-fw/documents'
import { DocType } from './doctypes'
import stores from '../src/stores/all'
// import { $t, dhcool } from '../src-fw/util'

class Article extends $Document {
  async compile () {}
}
// Registry.registerD(Article)

export class Auteur extends $Document {
  // Donne le autid de svc/org/nom
  static autids: Map<string, string> = new Map()

  async compile () {}

  nom: string // nom d'auteur
  section: string // section du Comité de Rédaction en charge de l'auteur

  static async autidParNom (soa: SOA, nom: string) : Promise<string> {
    const k = soa.svc + '/' + soa.org + '/' + nom
    let autid = Auteur.autids.get(k)
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

  static async get (autid?: string, autPk?: string) : Promise<Auteur | null> {
    const soa = stores.session.currentOrgSvc
    const op = new Operation('AuteurDeId', soa.svc, soa.org)
    const pk = autPk || DocType.getPk('Auteur', { autid: autid })
    op.sign(stores.safe.myCredOfDoc('Auteur', pk))
    op.args.autPk = pk
    try {
      const res = await op.post()
      return res.auteur
    } catch (e) { op.ko(e); return null }
  }

}
Registry.register(Auteur)


regForms()
regCredentials()
export const nbdoc = 0 // Registry.regDoc.size
