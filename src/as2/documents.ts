import { Registry, $Document, SOA } from '../src-fw/registry'
import { ADMIN$Status } from '../src-fw/fwdocuments'
import { $Credential, EmbedCred } from '../src-fw/documents'
import { $SubsGenerator, $Perimeter } from '../src-fw/subscription'
import { Descriptor, FormType, type collection, type idx, propType  } from '../src-fw/descriptor'
import { AppExc } from '../src-fw/log'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'

let n = 0, nf = 0, exc: AppExc | undefined
Descriptor.registerService('AS2')

/*********************************************************************************/
class AS2$Status extends ADMIN$Status {
  static _descriptor = Descriptor.doc('AS2', 'Status', { })
}
if (!exc) { n++; exc = Registry.register(AS2$Status) }

/*********************************************************************************/
export class AS2$EmbedCred extends EmbedCred {
  constructor (credId: string, props: any, docCl: string, docPk: string) { 
    super(credId, props, docCl, docPk) }
}

/* Virtuels et enums **************************************************************/
export class AS2$CoDir extends $Document {
  static _descriptor = Descriptor.doc('AS2', 'Codir', { virtual: true })
}
if (!exc) { n++; exc = Registry.register(AS2$CoDir) }

export class AS2$Redaction extends $Document {
  static _descriptor = Descriptor.doc('AS2', 'Redaction', { virtual: true })
}
if (!exc) { n++; exc = Registry.register(AS2$Redaction) }

export class AS2$Section extends $Document {
  static _descriptor = Descriptor.enum('AS2', 'Section', { virtual: true, enumCred: 'Redaction' })
}
if (!exc) { n++; exc = Registry.register(AS2$Section) }

export class AS2$Sujet extends $Document {
  static _descriptor = Descriptor.enum('AS2', 'Sujet', { virtual: true, enumCred: 'CoDir' })
}
if (!exc) { n++; exc = Registry.register(AS2$Sujet) }

/*********************************************************************************/
export class AS2$Auteur extends $Document {
  static _descriptor = Descriptor.doc('AS2', 'Auteur', { pk: ['autid'] })

  // Donne le autid de svc/org/nom
  static autids: Map<string, string> = new Map()

  async compile () {}

  nomAuteur: string = '' // nom d'auteur
  autid: string = ''
  section: string = '' // section du Comité de Rédaction en charge de l'auteur
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
    const pk = autPk || AS2$Auteur._descriptor.pkValue({ autid: autid })
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
          a.creds.set(credId, new AS2$EmbedCred(credId, creds[credId], 'Auteur', a._pk))
        lst.push(a)
      }
      return lst
    } catch (e) {
      await op.ko(e)
      return []
    }
  }

}
if (!exc) { n++; exc = Registry.register(AS2$Auteur) }

/*********************************************************************************/
export class AS2$SubsGenerator extends $SubsGenerator {
  static _descriptor = Descriptor.doc('AS2', 'SubsGenerator', { })

  processPerimeters (lp: $Perimeter[]) {
    this.subs.setTitle('Test auteur')
    for(const p of lp)
      if (p.docCl === 'Auteur') {
        if (this.roles.has('AS2_auteurs')) {
          const def = p.defs[0]
          const cred = this.credOf('Auteur', def.pk || '')
          const nom = cred ? cred.name || '' : ''
          this.subs.setDef(def, nom ? 'Salut ' + nom : '')
        }
      }
  }
}
if (!exc) { n++; exc = Registry.register(AS2$SubsGenerator) }

/********************************************************************************
Publication: 
- Clés _identifiantes et de synchronisation_
  - pk: [id]
  - auteur: autid
  - sujets: [sujets]
- Index _de filtrage_
  - volume: volume, entier
*/
export class AS2$Publication extends $Document {
  static _descriptor = Descriptor.doc('AS2', 'Publication', { pk: ['pubid'], sync: true },
    new Map<string, collection>([
      ['sujets',  { key: ['sujets'], list: true, mutable: true, class: 'Sujet' }],
      ['auteur',  { key: ['autid'], mutable: false, class: "Auteur" }]
    ]),
    new Map<string, idx>([
      ['volume',  { type: propType.INTEGER, key: ['volume'] }]
    ]))
 
  async compile () {}

  id: string = '' // générée aléatoirement
  sujets: string[] = [] // liste des sujets traités par la publication
  autid: string = '' // ID de l'auteur
  resume: string = '' // court de résumé de la publication
  volume: number = 0 // volume total des fichiers attachés

}
if (!exc) { n++; exc = Registry.register(AS2$Publication) }

export const AS2report = () : AppExc | undefined => {
  if (!exc)
    console.log(`AS2loading: ${n} documents, ${nf} forms`)
  else {
    console.log(`AS2loading FAILED: ${exc.toString()}`)
    return exc
  }
}