import { Crypt, fromPem, keyFromB64, keyToB64 } from './crypt'
import { u8ToB64, b64ToU8 } from './util'
import stores from '../stores/all'
// @ts-ignore
import { encode } from '@msgpack/msgpack'
import { Operation } from './operation'

const encoder = new TextEncoder()

/* Quand destiné à la construction d'un credential,
- id et hpems ne sont pas utilisé mais reconstruit
*/
export type CredObj = {
  xid: string // ID "absolu" hash court de `[svc, role, org, entid, hpems]`.
  svc: string // code du service
  about: string // un texte court _à propos_ du `entid`.
  role: string // un des codes de rôle connu du service.
  org: string // le code de l'organisation.
  entid: string // identifiant d'une entité interprétable pour le service.
  entkey: string // clé AES spécifique de l'entité, cryptée par la clé K de l'utilisateur et mise en base 64.
  pems: string // clé PRIVEE de signature, le texte de 400c.
  hpems: string // hash court de `pems`.
}

export type CredRequest = {
  id: string
  userId: string
  role: string
  docId: string
  time: number
  pemv: string
  limit: number
  cond: Object
}

export class Credential {
  static props = [ 'id', 'svc', 'org', 'role', 'docId', 'time', 'pems', 'skey', 'comment' ]

  id: string // ID de la version du credential.
  svc: string // code du service
  org: string // le code de l'organisation.
  role: string // docClass.role : un des codes de rôle connu du service.
  docId: string // identifiant du document cible du credential.
  time: number // epoch en seconde de génération
  pems: string // clé PRIVEE de signature, le texte de 400c.
  name: string // libellé / label etc. lisible de docId
  skey: string // clé AES spécifique de docId, cryptée par la clé K de l'utilisateur et mise en base 64.
  comment: string // un texte court libre de l'utilisateur.

  fromObj (obj: Object) : Credential {
    for (const p of Credential.props) this[p] = obj[p] || null
    return this
  }

  get toObj () : Object {
    const obj = {}
    for (const p of Credential.props) obj[p] = this[p] || null
    return obj
  }

  get skeyId () { return this.svc + '/' + this.role + '/' + this.docId}
  get skeyId2 () { return this.svc + '/' + this.docClass + '/' + this.docId}

  get subRole () : string {
    const i = this.role.indexOf('.')
    return i === -1 ? '' : this.role.substring(i+ 1)
  }

  get docClass () : string {
    const i = this.role.indexOf('.')
    return i === -1 ? this.role : this.role.substring(0, i)
  }

  get $trole () : string { return 'ROLE' + this.role.replace('.', '_')}

  setId () { this.id = Crypt.rnd(18) }

  clone () : Credential {
    return new Credential().fromObj(this.toObj)
  }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  setComment (s: string) { this.comment = s }

  static async buildCreds (
    targetId: string, // target U
    role: string,
    docId: string,
    skey: Uint8Array,
    name: string,
    limit: number
  ) : Promise<[Credential, CredRequest]> {
    const c = new Credential()
    c.setId()
    const { pub, priv } = await Crypt.getSVKeyPair()
    c.pems = keyToB64(priv)
    c.role = role
    c.docId = docId || ''
    c.name = name || ''
    c.skey = skey ? u8ToB64(skey) : ''
    c.time = Math.floor(Date.now() / 1000)
    const cr: CredRequest = {
      id: c.id,
      userId: targetId,
      pemv: keyToB64(pub),
      role,
      docId: docId || '',
      time: c.time,
      limit: limit || 0,
      cond: null
    }
    return [c, cr]
  }
}

/*
Toute opération requérant la présence d'au moins un credential est sollicitée en passant
en arguments un objet de classe `AuthRecord`, construit par l'application et ayant les propriétés suivantes:
- `userId`: de l'utilisateur.
- `sessionId`: identifiant de session.
- `time`: date-heure en seconde de création du record.
- _challenge_: propriété virtuelle _userId + '/' + time_
- `userSign`: signature par la clé privée de signature de l'utilisateur, du _challenge_.
- `signatures`: objet ayant une propriété par ID de credential inscrit dans le record
  donnant la signature du challenge par la clé privée de signature du credential.
*/
export class AuthRecord {
  svc: string
  args: Object
  userId: string
  sessionId: string
  time: number
  userSign: Uint8Array
  // Object par role / entid : [token]
  signatures: Object

  get challenge () : Uint8Array { return encoder.encode(this.userId + '/' + this.time) }

  constructor () {
    const sf = stores.safe
    const session = stores.session
    this.userId = sf.userId
    this.sessionId = session.sessionId
    this.time = Date.now()
    this.signatures = null
    this.userSign = null
  }

  async signUser () {
    const sf = stores.safe
    this.userSign = await Crypt.sign(fromPem(sf.auth.S), this.challenge)
  }

  get toObj() {
    return { userId: this.userId, sessionId: this.sessionId, time: this.time, signatures: this.signatures }
  }

  async sign (svc: string, org: string, role: string, docId?: string) {
    const session = stores.session
    for(const [id, c] of session.creds) {
      if (c.svc === svc && c.org === org
        && c.role === role && (docId ? c.docId === docId : true)) {
        const sign = new Uint8Array(await Crypt.sign(keyFromB64(c.pems), this.challenge))
        if (!this.signatures) this.signatures = {}
        this.signatures[c.id] = sign
      }
    }
  }

}
