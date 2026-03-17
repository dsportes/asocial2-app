import { Crypt, fromPem, keyFromB64, keyToB64 } from './crypt'
import { u8ToB64, b64ToU8 } from './util'
import stores from '../stores/all'
import { Invit } from '../stores/safe-store'
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

  id: string // ID du credential.
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
    if (!this.id)
      this.id = this.getId()
    return this
  }

  get toObj () : Object {
    const obj = {}
    for (const p of Credential.props) obj[p] = this[p] || null
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

  get $trole () : string { return 'ROLE' + this.role.replace('.', '_')}

  get idStr () { return this.svc + '/' + this.org + '/' + this.role + '/' + (this.docId || '') }

  get pkStr () { return stores.safe.userId + '/' + this.role + '/' + (this.docId || '') }

  getId () { return Crypt.shaS(encoder.encode(this.idStr))}

  getPk () { return Crypt.shaS(encoder.encode(this.pkStr)) }

  clone () : Credential {
    return new Credential().fromObj(this.toObj)
  }

  get toJson () :string {
    return JSON.stringify(this.toObj, null, '\t')
  }

  setComment (s: string) { this.comment = s }

  static async buildCreds (
    svc: string,
    org: string,
    targetId: string, // target U
    role: string,
    docId: string,
    skey: Uint8Array,
    name: string,
    limit: number
  ) : Promise<[Credential, CredRequest]> {
    const { pub, priv } = await Crypt.getSVKeyPair()
    const c = new Credential()
    c.svc = svc
    c.org = org
    c.pems = keyToB64(priv)
    c.role = role
    c.docId = docId || ''
    c.name = name || ''
    c.skey = skey ? u8ToB64(skey) : ''
    c.time = Date.now()
    c.id = c.getId()
    const cr: CredRequest = {
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
    return { userId: this.userId, sessionId: this.sessionId, time: this.time, 
      signatures: this.signatures, userSign: this.userSign }
  }

  async sign (svc: string, org: string, role: string, docId?: string) {
    const session = stores.session
    for(const [id, c] of session.creds) {
      if (c.svc === svc && c.org === org
        && c.role === role && (docId ? c.docId === docId : true)) {
        const sign = new Uint8Array(await Crypt.sign(keyFromB64(c.pems), this.challenge))
        if (!this.signatures) this.signatures = {}
        this.signatures[c.role + '/' + (c.docId || '')] = sign
      }
    }
  }

}

type MajorDescr = {
  hasKey: boolean,
  hasLabel: boolean,
  hasMinor: boolean
}

/* ### Document `Invitation` dans la base du service
*/
export class Invitation {
  org: string // organisation
  invitId: string // ID de l'invitation
  major: string //code majeur 
  minor: string // code mineur
  time: number // date-heure de création epoch en SECONDES. Ceci détermine aussi sa date d'auto-destruction.
  status: number // 1: déposée, 2: validée, 3: rejetée, 4: acceptée, 5: déclinée
  userId: string // ID de U (demandeur)
  safeStore: string // URL du store hébergeant le safe de U
  skeyK: Uint8Array // clé symétrique générée par U, cryptée par sa clé K. Requise ou non selon le `major`.
  pemU: string // clé publique C de U.
  txtm: string // texte de motivation de la demande d'invitation (en clair).
  txtx: string // quand déclinée, texte d'explication de U (en clair).
  label: string // pour les codes `major` qui en exige un, _label_ en clair à faire figurer dans le document à créer.
  // Données fixées par le sponsor**
  pemS: string // clé publique du sponsor traitant l'invitation.
  txti: string | Uint8Array // texte de réponse du sponsor, crypté par pemS / U.
      // - si acceptation: termes explicatifs des conditions.
      // - si rejet: justificatif textuel de rejet par le sponsor.
  role: string // rôle du credential associé (et classe du document associé).
  docId: string // `docId` du credential associé (et du document associé le cas échéant).
  cond: any // données à faire figurer en `cond` du credential.
  etc: any // autres données nécessaires pour créer le document associé. U n'a pas à connaître ni interpréter `etc` (_opaque_ pour lui) et qui ne sert qu'à l'opération de création de l'objet / enregistrement du credential.

  async init (
      org: string, 
      major: string,
      minor: string,
      txtm: string,
      label: string
    ) : Promise<Invitation> {
    this.org = org
    this.invitId = Crypt.rnd(8)
    this.status = 1
    this.major = major
    this.minor = minor || ''
    this.time = Math.floor(Date.now() / 1000)
    this.label = label || ''
    this.txtm = txtm || ''
    const sf = stores.safe
    const majorDescr = stores.config.K.majorInvits[this.major] as MajorDescr
    this.userId = sf.userId
    this.safeStore = sf.safeStore
    this.skeyK = majorDescr.hasKey ? await Crypt.crypt(sf.keyK, Crypt.random(32)) : null
    this.pemU = sf.auth.C
    return this
  }

  static props = ['invitId', 'major', 'minor', 'time', 'status', 'userId', 'safeStore',
    'skeyK', 'pemU', 'txtm', 'label']

  toObj () : Object {
    const x = {}
    for (const p of Invitation.props) x[p] = this[p] || null
    x['ttl'] = Math.floor(this.time / 60)
    return x
  }

  toInvit (svc: string, comment: string) : Invit {
    return {
      svc, comment,
      org: this.org,
      invitId: this.invitId,
      time: this.time,
      major: this.major,
      minor: this.minor,
      status: this.status
    }
  }

}
