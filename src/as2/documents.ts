import { schemaExc } from '../as2/schema'
import { Registry, $Document, SOA } from '../src-fw/registry'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'

const ok = !schemaExc()

let n = 0

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
if (ok) { n++; Registry.register(AS2$Auteur)}

export const AS2nbDocs = () : number => n