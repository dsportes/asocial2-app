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
      const c: Credential = new Credential(obj)
      if (c && c.id) m.set(c.id, c)
    }
    return m
  }

  static clone (src: Credential) : Credential{
    return new Credential(src.toObj)
  }

  static toJson (creds: Credential[]) : string{
    const t = []
    creds.forEach(c => t.push(c.toJson))
    return '[\n' + t.join(',\n') + '\n]'
  }

  static rndPassphrase () {
    const u8 = Crypt.random(24)
    return u8ToB64(u8).replaceAll('+', '1').replaceAll('/', '2')
  }

  id: string // id: déduite des propriétés identifiantes idProps
  about: string // A propos du credential
  org: string // organisation (ou '*' exceptionellement)
  type: string // code du type de credential
  scope: Object // scope fonctionnel: les propriétés ne sont QUE des strings
  pp?: string // (fac) hash d'une phrase secrète ou passphrase elle-même
  sign?: Uint8Array // (fac) clé de signature - donné en base64 dans la forme obj

  constructor (obj: Object) {
    for (const p of ['id', 'about', 'org', 'type']) this[p] = obj[p] || ''
    if (obj['pp']) this.pp = obj['pp']
    if (obj['sign']) this.sign = b64ToU8(obj['sign'])
    this.scope = {}
    const x = obj['scope']
    if (x) for (const p of Object.keys(x)) 
      if (typeof p === 'string') this.scope[p] = x[p]
  }

  get toObj () :Object {
    const obj = { scope: {} }
    for (const p of ['id', 'about', 'org', 'type']) obj[p] = this[p] || ''
    if (this['pp']) obj['pp'] = this.pp
    if (obj['sign']) obj['sign'] = u8ToB64(this.sign, true)
    for (const p of Object.keys(this.scope)) obj.scope[p] = this.scope[p]
    return obj
  }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  get computedId () :string {
    const x = [ this.org, this.type ]
    const l = Object.keys(this.scope)
    l.sort()
    for (const p of l) { x.push(p); x.push(this.scope[p] ) }
    return Crypt.shaS(encode(x))
  }

  setAbout (s: string) { this.about = s }
}

export function testCred () : Map<string, Credential> {
  const c1 = new Credential({
    about: 'cred #1',
    org: 'doda', type:'LOGIN', pp: 'totoestbeau', scope: { rien: 'quedalle' }
  })
  c1.id = c1.computedId

  const c2 = new Credential({
    about: 'cred #2',
    org: 'doda', type:'LOGIN', 
    pp: 'totoestbeau',
    scope: { troisfoisrien: 'pasgrandchose' }
  })
  c2.id = c2.computedId
  
  const c3 = new Credential({
    about: 'cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3 cred #3',
    org: 'doda', type:'ZARBI', 
    sign: '1234AZERTY',
    scope: { troisfoisrien: 'pasgrandchose' }
  })
  c3.id = c3.computedId

  const c4 = new Credential({
    about: 'cred #1',
    org: '*', type:'BOF', pp: 'totoestmoche'
  })
  c4.id = c4.computedId

  const s = Credential.toJson([c1, c2, c3, c4])
  // console.log(s)
  const cred = Credential.parse(s)

  console.log(Credential.toJson(Array.from(cred.values())))

  return cred
}
