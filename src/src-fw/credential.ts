import { Crypt, fromPem, keyFromB64, keyToB64 } from './crypt'
// import { u8ToB64 } from './util'
import stores from '../stores/all'
import { Credential } from '../src-fw/documents'

const encoder = new TextEncoder()

/* Credential en Safe
*/
export class CredSafe {
  static lp1 = [ 'svc', 'org', 'role', 'docId', 'time', 'pems', 'comment' ]

  static getId (svc: string, org: string, docId: string, role: string) { 
    return Crypt.shaS(encoder.encode(svc + '/' + org + '/' + role + '/' + docId || ''))
  }

  id: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  time: number = 0 // epoch en seconde de génération

  pems: string = '' // clé PRIVEE de signature, le texte de 400c.
  comment: string = '' // un texte court libre de l'utilisateur.
  
  constructor (obj?: Object) {
    if (obj) {
      for (const p of CredSafe.lp1) this[p] = obj[p] || null
      this.setId()
    }
  }

  setId () : CredSafe{ 
    this.id = CredSafe.getId(this.svc, this.org, this.role, this.docId)
    return this
  }

  get $trole () : string { return 'ROLE' + this.role.replace('.', '_')}

  get getPk () : string { return Crypt.shaS(encoder.encode(
    stores.safe.userId + '/' + this.role + '/' + this.docId)) }

  get toObj () : Object {
    const obj = {}
    for (const p of CredSafe.lp1) obj[p] = this[p] || null
    obj['id'] = this.id
    return obj
  }

  get subRole () : string {
    const i = this.role.indexOf('.')
    return i === -1 ? '' : this.role.substring(i+ 1)
  }

  get docClass () : string {
    const i = this.role.indexOf('.')
    return i === -1 ? this.role : this.role.substring(0, i)
  }

  clone () : CredSafe { return new CredSafe(this.toObj) }

  get toJson () : string { return JSON.stringify(this.toObj, null, '\t') }

  setComment (s: string) { this.comment = s }

  static async buildCreds (
    svc: string,
    org: string,
    targetId: string, // target U
    role: string,
    docId: string,
    comment: string,
    limit: number,
  ) : Promise<[CredSafe, Credential]> {
    const { pub, priv } = await Crypt.getSVKeyPair()
    const cs = new CredSafe({ svc, org, role, docId, pems: keyToB64(priv), comment })
    const c = Credential.fromCredSafe(cs, targetId, keyToB64(pub), limit)
    return [cs, c]
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
  svc: string = ''
  args: Object = ''
  userId: string
  sessionId: string
  time: number
  userSign: Uint8Array | null
  // Object par role / docId : [token]
  signatures: Object | null

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
    this.userSign = sf.auth && sf.auth.S ? await Crypt.sign(fromPem(sf.auth.S), this.challenge) : null
  }

  get toObj() {
    return { userId: this.userId, sessionId: this.sessionId, time: this.time, 
      signatures: this.signatures, userSign: this.userSign }
  }

  async sign (svc: string, org: string, role: string, docId?: string) {
    const session = stores.session
    for(const [id, c] of session.creds) {
      if (c.svc === svc && c.org === org
        && c.role === role && (docId ? c.docId === docId : true)) {
        const x = await Crypt.sign(keyFromB64(c.pems), this.challenge)
        const sign = new Uint8Array(x)
        if (!this.signatures) this.signatures = {}
        this.signatures[c.role + '/' + (c.docId || '')] = sign
      }
    }
  }

}
