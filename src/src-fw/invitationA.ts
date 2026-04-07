// @ts-ignore
import { decode } from '@msgpack/msgpack'

import { Crypt, keyToB64, keyFromB64 } from './crypt'
import stores from '../stores/all'
import { Invit } from '../stores/safe-store'
import { Operation } from '../src-fw/operation'
import { $t } from '../src-fw/util'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type Accept = {
  role: string // rôle du credential associé (et classe du document associé).
  docId: string // `docId` du credential associé (et du document associé le cas échéant).
  cond: any // données à faire figurer en `cond` du credential.
  etc: any // autres données nécessaires pour créer le document associé. 
    // U n'a pas à connaître ni interpréter `etc` (_opaque_ pour lui)
    // ne sert qu'à l'opération de création de l'objet / enregistrement du credential.
}

type MajorDescr = {
  hasKey: boolean,
  hasLabel: boolean,
  hasMinor: boolean
}

export type MsgVal = {
  ok: boolean,
  txt: string,
  role: string,
  docId: string
}

/* ### Document `Invitation` dans la base du service
*/
export class InvitationA {
  // Toujours présentes, dès la création de l'invitation
  org: string = ''// organisation
  invitId: string = '' // ID de l'invitation générée aléatoirement à sa création
  major: string = '' //code majeur 
  minor: string = '' // code mineur
  time: number = 0 // date-heure de création epoch en SECONDES. Ceci détermine aussi sa date d'auto-destruction.
  status: number = 0 // traduit l'état d'avancement dans le temps SEULE PROPRIETE NON immuable
  /*
  - (1) : demande déposée par U,
  - (2) : proposition faite par S,
  - (3) : proposition validée par U,
  - (4) : demande de U annulée par U,
  - (5) : demande de U rejetée par S,
  - (6) : proposition de S déclinée par U.
  */
  userId: string = '' // ID de U (demandeur)
  pubu: string = '' // clé publique C de cryptage de U en base64

  // Dès la "demande" (pour un cycle complet seulement)
  req ?: string // texte en clair fourni par U pour exprimer ses souhaits / exigences / motivation.

  // Dès la phase "proposition" (première en cycle court et seconde en cycle complet) ou "rejet"
  pubs ?: string // clé publique C de cryptage du sponsor en base 64

  // Dès la phase "proposition" (première en cycle court et seconde en cycle complet)
  etc ?: any // Objet contenant toutes les données nécessaires à la validation:
  /* 
  Crypté par la clé AES obtenu du couple de clés `pub-U/priv-S` (ou `pub-S/pub-U`, c'est la même). 
  Cette clé sera transmise en arguments de l'opération de validation.
  En session de U, etc peut être décrypté : un texte humainement lisible par U (dans sa langue) 
  est généré pour lui afficher les clauses la proposition.
  */

  txt ?: string // texte humainement lisible 
  /*
  - soit Phase rejet : S explicite les raisons de son refus de faire une proposition à U.
  - soit Phase déclinaison: U explicite les raisons qui rendent les conditions (dans etc) non acceptables pour lui. 
  - crypté par la clé AES obtenu du couple de clés `pub-U/priv-S` (ou `pub-S/pub-U`, c'est la même)
  */

  isSP ?: boolean // user est le SPONSOR TRAITANT de la demande
  isU ?: boolean // user est le user DEMANDEUR
  svc ?: string // service d'ou l'invitation a été lue
  aes ?: Uint8Array // clé AES obtenue de pubu / pubs

  async init (org: string, major: string, minor: string, req: string ) : Promise<InvitationA> {
    const sf = stores.safe

    this.org = org
    this.invitId = Crypt.rnd(8)
    this.status = 1
    this.major = major
    this.minor = minor || ''
    this.time = Math.floor(Date.now() / 1000)
    this.req = req || ''

    this.userId = sf.userId
    this.pubu = keyToB64(sf.auth.C)
    return this
  }

  async fromList (bin : Uint8Array, org: string, svc: string) : Promise<InvitationA> {
    const sf = stores.safe
    const x = decode(bin)
    this.org = org
    this.svc = svc
    this.userId = x.userId
    this.invitId = x.invitId
    this.status = x.status
    this.major = x.major
    this.minor = x.minor || ''
    this.time = x.time
    this.req = x.req || ''

    this.pubu = x.pubu
    this.pubs = x.pubs || ''
    this.isSP = x.status > 1 && x.pubs === keyToB64(sf.auth.C)
    this.isU = x.userId === sf.userId

    if (x.pubu && x.pubs) {
      if (this.isSP) this.aes = await Crypt.getAESKey(keyFromB64(x.pubu), keyFromB64(sf.auth.D))
      else this.aes = await Crypt.getAESKey(keyFromB64(x.pubs), keyFromB64(sf.auth.D))
    } // else this.aes undefined

    if (this.aes && x.txt) this.txt = decoder.decode(await Crypt.decrypt(this.aes, x.txt) as AllowSharedBufferSource)
    else this.txt = ''

    if (this.aes && x.etc) this.etc = decoder.decode(await Crypt.decrypt(this.aes, x.etc) as AllowSharedBufferSource)
    else this.etc = null

    return this
  }

  static props = ['invitId', 'major', 'minor', 'time', 'status', 'userId', 'pubu', 'req']

  toObj () : Object { // TODO
    const x = {}
    for (const p of InvitationA.props) x[p] = this[p] || null
    x['ttl'] = Math.floor(this.time / 60)
    return x
  }

  toInvit (svc: string, comment: string) : Invit { // TODO
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
  async msgVal () : Promise<MsgVal> {
    return { ok: false, txt: 'KO', role: '', docId: '' }
  }

  /* Méthode "abstraite": systématiquement surchargée pour 
  s'adapter au traitement spécifique de chaque "major" par un sponsor.
  Génère:
  - l'objet Accept à stocker dans l'invitation,
  - params.txti : le texte de résumé de la proposition d'invitation
  */
  async setAccept (params: Object) : Promise<Accept | null> {
    return null
  }

  async accept ( accept: Accept, txt: string, msgVal: MsgVal ) {
    console.log(this.invitId, 'accept')
    const sf = stores.safe
    const op = new Operation('InvitAR', this.SVC, this.org)
    try {
      op.args.accept = accept
      const aes = await Crypt.getAESKey(fromPem(this.pemU, true), fromPem(sf.auth.D))
      op.args.txti = await Crypt.crypt(aes, encoder.encode(txt))
      op.args.invitId = this.invitId
      op.sign(msgVal.role, msgVal.docId)
      const res = await op.post()
      if (res.status)
        await stores.ui.diagDisplay($t('INVopret_' + res.status))
    } catch(e) {
      op.ko(e)
    }
  }

  async reject (txt: string, msgVal: MsgVal) {
    const sf = stores.safe
    console.log(this.invitId, 'reject')
    const op = new Operation('InvitAR', this.SVC, this.org)
    try {
      const aes = await Crypt.getAESKey(fromPem(this.pemU, true), fromPem(sf.auth.D))
      op.args.txti = await Crypt.crypt(aes, encoder.encode(txt))
      op.args.invitId = this.invitId
      op.sign(msgVal.role, msgVal.docId)
      const res = await op.post()
      if (res.status)
        await stores.ui.diagDisplay($t('INVopret_' + res.status))
    } catch(e) {
      op.ko(e)
    }
  }

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. Par exemple:
  - enregistrement d'un credential résultant de l'invitation
  */
  async validate () {
  }

  async decline (txtx: string) {
    console.log(this.invitId, 'decline')
    const op = new Operation('InvitDC', this.SVC, this.org)
    try {
      op.args.invitId = this.invitId
      op.args.txtx = txtx
      const res = await op.post()
      if (res.status)
        await stores.ui.diagDisplay($t('INVopret_' + res.status))
    } catch(e) {
      op.ko(e)
    }
  }

  async cancel () {
    console.log(this.invitId, 'cancel')
    const op = new Operation('InvitDC', this.SVC, this.org)
    try {
      op.args.invitId = this.invitId
      const res = await op.post()
      if (res.status)
        await stores.ui.diagDisplay($t('INVopret_' + res.status))
    } catch(e) {
      op.ko(e)
    }
  }

}
