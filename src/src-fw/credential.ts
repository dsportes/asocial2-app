import { Crypt } from './crypt'
import { u8ToB64, b64ToU8 } from './util'
// @ts-ignore
import { encode } from '@msgpack/msgpack'

const encoder = new TextEncoder()

export class Credential {

  static parse (inp: string) : Map<string, Credential> {
    const m = new Map<string, Credential>()
    const objs: Object[] = JSON.parse(inp)
    for (const obj of objs) {
      const c: Credential = Credential.newCredential(obj)
      if (c) m.set(c.id, c)
    }
    return m
   }

  static newCredential (obj: Object) :  Credential {
    switch (obj['clazz']) {
      case 'base' : return new Credential(obj)
      case 'phrase' : return new CredPhrase(obj)
      case 'rich' : return new CredRich(obj)
    }
    return null
  }

  static clone (src: Credential) {
    const obj = src.toObj
    return Credential.newCredential(obj)
  }

  static toJson (creds: Credential[]) {
    const t = []
    creds.forEach(c => t.push(c.toJson))
    return '[\n' + t.join(',\n') + '\n]'
  }

  static rndPassphrase () {
    const u8 = Crypt.random(24)
    return u8ToB64(u8).replaceAll('+', '1').replaceAll('/', '2')
  }

  clazz: string // classe du credential
  id: string // id: déduite des propriétés identifiantes idProps
  st?: number // pour le CredsMgr: 1:ajouté 2:maj about 3:retiré
  about: string // A propos du credential
  org: string // organisation (ou '*' exceptionellement)
  type: string // code du type de credential

  static props = ['id', 'about', 'type', 'org']
  static idProps = ['org', 'type']

  constructor (obj: Object) {
    this.clazz = 'Credential'
    for (const p of Credential.props) this[p] = obj[p] || ''
  }

  get toObj () :Object {
    const obj = { clazz: 'base' }
    for (const p of Credential.props) if (this[p]) obj[p] = this[p]
    return obj
  }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  get computedId () :string {
    const x = []
    for (const p of Credential.idProps) x.push(this[p])
    return Crypt.shaS(encode(x))
  }

  setAbout (s: string) { this.about = s }
}

/****************************************************************
Credential constitué d'un password / passphrase:
- si c'est un password hp représente son strongHash en base 64
- si c'est une passphrase générée aléatoirement, c'est directement celle-ci
****************************************************************/
export class CredPhrase extends Credential {
  pp: string // hash d'une phrase secrète ou passphrase elle-même

  static idProps = ['org', 'type']

  constructor (obj: Object) {
    super(obj)
    this.clazz = 'phrase'
    this.pp = obj['pp']
  }

  get toObj () :Object {
    const obj = super.toObj
    obj['clazz'] = 'phrase'
    obj['pp'] = this['pp']
    return obj
  }

  get computedId () :string {
    const x = []
    for (const p of CredPhrase.idProps) x.push(this[p])
    return Crypt.shaS(encode(x))
  }
}

/****************************************************************
Credential complet
- l'une des deux options pp ou sign est obligatoire
- en externe les u8 sont en b64 URL
****************************************************************/
export class CredRich extends Credential {
  flags?: string // (fac) complement du type
  source?: string // id de l'objet source / auteur des actions - si toutes sources, rien
  target?: string // id de l'objet cible de l'action - si toutes cibles, rien
  limit?: number // (fac) date limite de validité sous forme YYYYMMDD
  aes?: Uint8Array // (fac) clé de cryptage associée au credential
  pp?: string // (fac) hash d'une phrase secrète ou passphrase elle-même
  sign?: Uint8Array // (fac) clé de signature

  static idProps = ['org', 'type', 'flags', 'source', 'target']

  constructor (obj: Object) {
    super(obj)
    this.clazz = 'rich'
    if (obj['flags']) this.flags = obj['flags']
    if (obj['source']) this.source = obj['source']
    if (obj['target']) this.target = obj['target']
    if (obj['limit']) this.limit = parseInt(obj['limit'])
    if (obj['aes']) this.aes = b64ToU8(obj['aes'])
    if (obj['pp']) this.pp = obj['pp']
    if (obj['sign']) this.sign = b64ToU8(obj['sign'])
  }

  get toObj () :Object {
    const obj = super.toObj
    obj['clazz'] = 'rich'
    if (this.flags) obj['flags'] = this.flags
    if (this.source) obj['source'] = this.source
    if (this.target) obj['target'] = this.target
    if (this.limit) obj['limit'] = '' + this.limit
    if (this.aes) obj['aes'] = u8ToB64(this.aes)
    if (this.pp) obj['pp'] = this.pp
    if (this.sign) obj['sign'] = u8ToB64(this.sign)
    return obj
  }

  get computedId () :string {
    const x = []
    for (const p of CredRich.idProps) x.push(this[p] || null)
    return Crypt.shaS(encode(x))
  }

  async signIt (time: number, sessionId: string) : Promise<string> {
    return u8ToB64(await Crypt.sign(this.sign, encoder.encode(sessionId + '/' + time)))
  }
}

export function testCred () : Map<string, Credential> {
  const c1 = new CredPhrase({
    about: 'cred #1',
    org: 'doda', type:'LOGIN', pp: 'totoestbeau'
  })
  c1.id = c1.computedId

  const c2 = new CredRich({
    about: 'cred #2',
    org: 'doda', type:'LOGIN', 
    flags: 'rw', source: 'toto', target: 'titi',
    limit: '20260116', aes: 'abcd',
    pp: 'totoestbeau'
  })
  c2.id = c2.computedId
  
  const c3 = new CredRich({
    about: 'cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3',
    org: 'doda', type:'ZARBI', 
    source: 'ducon',
    sign: '1234AZERTY'
  })
  c3.id = c3.computedId

  const c4 = new CredPhrase({
    about: 'cred #1',
    org: '*', type:'BOF', pp: 'totoestmoche'
  })
  c4.id = c4.computedId

  const s = Credential.toJson([c1, c3])
  console.log(s)
  const cred = Credential.parse(s)

  console.log(Credential.toJson(Array.from(cred.values())))

  return cred
}