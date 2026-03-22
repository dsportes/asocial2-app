// @ts-ignore
import { decode } from '@msgpack/msgpack'

import { Crypt, fromPem } from './crypt'
import stores from '../stores/all'
import { Invit } from '../stores/safe-store'
// import { Operation } from './operation'

type MajorDescr = {
  hasKey: boolean,
  hasLabel: boolean,
  hasMinor: boolean
}

/* ### Document `Invitation` dans la base du service
*/
export class InvitationA {
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
  isSP ?:boolean // user est le SPONSOR TRAITANT de la demande
  isU ?: boolean // user est le user DEMANDEUR

  async init (
      org: string, 
      major: string,
      minor: string,
      txtm: string,
      label: string
    ) : Promise<InvitationA> {
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

  async fromList (bin : Uint8Array, org: string) : Promise<InvitationA> {
    const x = decode(bin)
    this.org = org
    this.invitId = x.invitId
    this.status = x.status
    this.major = x.major
    this.minor = x.minor || ''
    this.time = x.time
    this.label = x.label || ''
    this.txtm = x.txtm || ''
    const sf = stores.safe
    this.userId = x.userId
    this.safeStore = x.safeStore
    this.skeyK = null
    this.isSP = x.status > 1 && x.pemS === sf.auth.C
    this.isU = x.userId === sf.userId
    if (this.isSP) { // user est le traitant de la demande
      const aes = await Crypt.getAESKey(fromPem(x.pemU, true), fromPem(sf.auth.D))
      this.txti = await Crypt.decrypt(aes, x.txti)
    } else this.txti = ''
    if (this.status === 2 || this.status >= 4) {
      this.role = x.role
      this.docId = x.docId
      this.cond = x.cond
      this.etc = x.etc
    } else {
      this.role = null
      this.docId = null
      this.cond = null
      this.etc = null
    }
    return this
  }

  static props = ['invitId', 'major', 'minor', 'time', 'status', 'userId', 'safeStore',
    'skeyK', 'pemU', 'txtm', 'label']

  toObj () : Object {
    const x = {}
    for (const p of InvitationA.props) x[p] = this[p] || null
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

  /* Retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitation en status 1.
  Bref pourquoi il n'est pas un SPONSOR acceptable
  */
  async msgVal () : Promise<string> {
    return ''
  }

  async validate () {
    console.log(this.invitId, 'validate')
  }

  async reject (txt: string) {
    console.log(this.invitId, 'reject')
  }

  async accept () {
    console.log(this.invitId, 'accept')
  }

  async decline () {
    console.log(this.invitId, 'decline')
  }

  async cancel () {
    console.log(this.invitId, 'cancel')
  }

}
