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
  sign: string // PEM de la clé de signature

  constructor (obj: Object) {
    for (const p of ['id', 'about', 'org', 'type', 'sign'])
      this[p] = obj[p] || ''
    const x = obj['scope']
    const lp = x ? Object.keys(x) : []
    if (lp.length) {
      this.scope = {}
      for (const p of lp)
        if (typeof p === 'string') this.scope[p] = x[p]
      if (Object.keys(this.scope).length === 0)
        this.scope = null
    } else this.scope = null

  }

  get toObj () :Object {
    const obj = {
      id: this.id,
      about: this.about,
      org: this.org,
      type: this.type,
      scope: this.scope ? {} : null,
      sign: this.sign
    }
    if (this.scope) {
      const lp = Object.keys(this.scope)
      lp.sort()
      for (const p of lp) obj.scope[p] = this.scope[p]
    } else delete obj.scope
    return obj
  }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  get computedId () :string {
    const x = [ this.org, this.type ]
    const l = this.scope ? Object.keys(this.scope) : null
    if (l && l.length) {
      l.sort()
      for (const p of l) { x.push(p); x.push(this.scope[p] ) }
    }
    return Crypt.shaS(encode(x))
  }

  setAbout (s: string) { this.about = s }
}

export function testCred () : Map<string, Credential> {
  const c1 = new Credential({
    about: 'cred #1',
    org: 'doda', type:'LOGIN', sign: 'totoestbeau', scope: { rien: 'quedalle' }
  })
  c1.id = c1.computedId

  const c2 = new Credential({
    about: 'cred #2',
    org: 'doda', type:'LOGIN',
    sign: 'totoestbeau',
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
    org: '*', type:'BOF', sign: 'totoestmoche'
  })
  c4.id = c4.computedId

  const s = Credential.toJson([c1, c2, c3, c4])
  // console.log(s)
  const cred = Credential.parse(s)

  console.log(Credential.toJson(Array.from(cred.values())))

  return cred
}
