import { Crypt, fromPem } from './crypt'
import { u8ToB64, b64ToU8 } from './util'
import stores from '../stores/all' 
// @ts-ignore
import { encode } from '@msgpack/msgpack'

const encoder = new TextEncoder()

/* Quand destiné à la construction d'un credential,
- id et hpems ne sont pas utilisé mais reconstruit
*/
export type CredObj = {
  svc: string // code du service
  id: string // hash court de `[role, org, entid]`.
  about: string // un texte court _à propos_ du `entid`.
  role: string // un des codes de rôle connu du service.
  org: string // le code de l'organisation.
  entid: string // identifiant d'une entité interprétable pour le service.
  entkey: string // clé AES spécifique de l'entité, cryptée par la clé K de l'utilisateur et mise en base 64.
  pems: string // clé PRIVEE de signature, le texte de 400c.
  hpems: string // hash court de `pems`.
}

export class Credential {

  static parse (inp: string) : Map<string, Credential> {
    const m = new Map<string, Credential>()
    const objs: CredObj[] = JSON.parse(inp)
    for (const obj of objs) {
      const c: Credential = new Credential(obj)
      if (c) m.set(c.xid, c)
    }
    return m
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

  /* Construit un credential depuis un object de type CredObj
  reçu par transmission d'un transmetteur T:
  - keyK : clé du destinatoire D
  - aes: clé obtenue depuis pubT / privD
  La donnée entkey est décryptée / ré-encryptée
  */
  static async fromTObj (obj: CredObj, keyK: Uint8Array, aes: Uint8Array )
    : Promise<Credential> {

    const c = new Credential(obj)
    if (obj.entkey) {
      const dc = await Crypt.decrypt(aes, b64ToU8(obj.entkey))
      c.entkey = u8ToB64(await Crypt.crypt(keyK, dc))
    }
    return c
  }

  constructor (obj: CredObj) {
    this.svc = obj.svc
    this.id = Crypt.shaS(encode([obj.role, obj.org, obj.entid]))
    this.about = obj.about
    this.role = obj.role
    this.org = obj.org
    this.entid = obj.entid
    this.entkey = obj.entkey
    this.pems = obj.pems
    this.hpems = Crypt.shaS(encoder.encode(obj.pems))
  }

  get toObj () : CredObj {
    return {
      svc: this.svc,
      id: this.id,
      about: this.about,
      org: this.org,
      role: this.role,
      entid: this.entid,
      entkey: this.entkey,
      pems: this.pems,
      hpems: this.hpems
    }
  }

  async toTObj (keyK: Uint8Array, aes: Uint8Array) : Promise<CredObj> {
    const obj = this.toObj
    if (obj.entkey) {
      const dc = await Crypt.decrypt(keyK, b64ToU8(obj.entkey))
      this.entkey = u8ToB64(await Crypt.crypt(aes, dc))
    }
    return obj
  }

  clone () : Credential {
    return new Credential(this.toObj)
  }

  svc: string // code du service
  id: string // hash court de `[role, org, entid]`.
  about: string // un texte court _à propos_ du `entid`.
  role: string // un des codes de rôle connu du service.
  org: string // le code de l'organisation.
  entid: string // identifiant d'une entité interprétable pour le service.
  entkey: string // clé AES spécifique de l'entité, cryptée par la clé K de l'utilisateur et mise en base 64.
  pems: string // clé PRIVEE de signature, le texte de 400c.
  hpems: string // hash court de `pems`.

  get xid () :string { return this.svc + '.' + this.id }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  setAbout (s: string) { this.about = s }
}

type AuthToken = {
  id: string
  role: string
  entid: string
  hpems: string
  sign: Uint8Array
}

export class AuthRecord {
  svc: string
  org: string
  orguserId: string
  sessionId: string
  time: number
  // Object par role / entid
  tokens: Object

  constructor (svc: string, org: string) {
    const session = stores.session
    this.svc = svc
    this.org = org
    this.orguserId = Crypt.shaS(encoder.encode(org + '/' + session.userId)),
    this.sessionId = session.sessionId
    this.time = Date.now()
    this.tokens = {}
  }

  get challenge() { return encoder.encode(this.orguserId + '/' + this.time)}

  async sign (role: string, entid: string) {
    const session = stores.session
    const cid = Crypt.shaS(encode([role, this.org, entid || '']))
    const id = this.svc + '.' + cid
    const c: Credential = session.creds.get(id)
    if (!c) return
    const ch = encoder.encode(this.orguserId + '/' + this.time)
    const sign = new Uint8Array(await Crypt.sign(fromPem(c.pems), ch))
    let e = this.tokens[role]
    if (!e) {
      e = {}
      this.tokens[role] = e
    }
    e[entid || ''] = {id, role, entid: entid || '', hpems: c.hpems, sign }
  }

}
