
import { Registry, $Document } from '../src-fw/registry'
import { regForms } from '../app/forms'
import { regCredentials } from '../app/credentials'
import { Operation } from '../src-fw/operation'
import { SOA, $Credential } from '../src-fw/documents'
import stores from '../stores/all'
// import { $t, dhcool } from '../src-fw/util'

class Article extends $Document {
  async compile () {}
}
Registry.registerD(Article)

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
    if (autid) op.args.autid = autid
    else op.args.autPk = autPk
    try {
      const res = await op.post()
      return res.auteur
    } catch (e) { op.ko(e); return null }
  }

}
Registry.registerD(Auteur)

class Chat extends $Document {
  async compile () {}
}
Registry.registerD(Chat)

class Sujet extends $Document {
  async compile () {}
}
Registry.registerD(Sujet)

regForms()
regCredentials()
export const nbdoc = Registry.regDoc.size
