import { schemaExcAS2 } from '../as2/schema'
import { schemaExcFW } from '../src-fw/schema'
import { Registry, $Document, SOA } from '../src-fw/registry'
import { ADMIN$Status } from '../src-fw/fwdocuments'
import { $Credential, EmbedCred } from '../src-fw/documents'
import { $SubsGenerator, $Perimeter } from '../src-fw/subscription'
import { DocDescriptor } from '../src-fw/docDescriptor'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'

const ok = !schemaExcAS2() && !schemaExcFW()

let n = 0

class AS2$Status extends ADMIN$Status {
}
if (ok) { n++; Registry.register(AS2$Status) }

export class AS2$EmbedCred extends EmbedCred {
  constructor (credId: string, props: any, docCl: string, docPk: string) { 
    super(credId, props, docCl, docPk) }
}

export class AS2$Auteur extends $Document {
  // Donne le autid de svc/org/nom
  static autids: Map<string, string> = new Map()

  async compile () {}

  nomAuteur: string // nom d'auteur
  section: string // section du Comité de Rédaction en charge de l'auteur
  creds?: Map<string, AS2$EmbedCred>

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

  static async listeParSection (org: string, section: string, cred: $Credential) 
  : Promise<AS2$Auteur[]> {
    const lst: AS2$Auteur[] = []
    const op = new Operation('ListeAuteursSection', 'AS2', org)
    try {
      op.args.section = section
      const c = cred
      await op.sign(c)
      const res = await op.post()
      for(const obj of res.lst) {
        const creds = obj.creds
        delete obj.creds
        const a = (await Registry.compile('AS2', 'Auteur', org, obj) as unknown) as AS2$Auteur
        a.creds = new Map()
        for(const credId in creds) 
          a.creds.set(credId, new AS2$EmbedCred(credId, creds[credId], a._clazz, a._pk))
        lst.push(a)
      }
      return lst
    } catch (e) {
      await op.ko(e)
    }
  }

}
if (ok) { n++; Registry.register(AS2$Auteur)}

export class AS2$SubsGenerator extends $SubsGenerator {

  processPerimeters (lp: $Perimeter[]) {
    this.subs.setTitle('Test auteur')
    for(const p of lp)
      if (p.docCl === 'Auteur') {
        if (this.roles.has('AS2_auteurs')) {
          const def = p.defs[0]
          const cred = this.credOf('Auteur', def.pk)
          const nom = cred ? cred.name || '' : ''
          this.subs.setDef(def, nom ? 'Salut ' + nom : '')
        }
      }
  }
}
if (ok) { n++; Registry.register(AS2$SubsGenerator)}

export const AS2nbDocs = () : number => n