import { schemaExcAS2 } from '../as2/schema'
import { schemaExcFW } from '../src-fw/schema'
import { Registry, $Document, SOA } from '../src-fw/registry'
import { ADMIN$Status} from '../src-fw/fwdocuments'
import { $DefSigner, $Perimeter, $Credential } from '../src-fw/documents'
import { $SubsGenerator } from '../src-fw/subscription'
import { DocDescriptor } from '../src-fw/docDescriptor'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'

const ok = !schemaExcAS2() && !schemaExcFW()

let n = 0

class AS2$Status extends ADMIN$Status {
}
if (ok) { n++; Registry.register(AS2$Status) }

class AS2$DefSigner extends $DefSigner {
  static _unregistered = true
}
n++; Registry.register(AS2$DefSigner)
 
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

  static async get (org: string, autid?: string, autPk?: string) : Promise<AS2$Auteur | null> {
    const op = new Operation('AuteurDeId', 'AS2', org)
    const pk = autPk || DocDescriptor.get('AS2$Auteur').pkValue({ autid: autid })
    op.sign(stores.safe.myCredOfDoc('AS2', org, 'Auteur', pk))
    op.args.autPk = pk
    try {
      const res = await op.post()
      return res.auteur
    } catch (e) { op.ko(e); return null }
  }

}
if (ok) { n++; Registry.register(AS2$Auteur)}

export class AS2$SubsGenerator extends $SubsGenerator {
  creds: Map<string, $Credential>
  start () {
    this.subs.setTitle('Test auteur')
    this.creds = stores.safe.mySimpleCreds('AS2', this.org)
  }

  processPerimeter (p: $Perimeter) {
    if (p.id.startsWith('Auteur')) {
      const def = p.defs[0]
      const pk = def.split('/')[1]
      let nom = ''
      for(const [,c] of this.creds)
        if (c.docCl === 'Auteur' && c.docPk === pk) nom = c.name || ''
      this.subs.setDef(def, nom ? 'Salut ' + nom : '')
    }
  }

  end () {
  }
}
if (ok) { n++; Registry.register(AS2$SubsGenerator)}

export const AS2nbDocs = () : number => n