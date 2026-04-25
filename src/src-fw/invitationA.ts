// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { Crypt } from './crypt'
import { keyToB64, keyFromB64, toUrl, fromUrl } from '../src-fw/b64'

import stores from '../stores/all'
import { CredSafe } from '../src-fw/documents'
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
  svc: string = '' // service d'ou l'invitation a été lue (ou préparée à la création)
  org: string = '' // organisation d'ou l'invitation a été lue (ou préparée à la création)

  // Toujours présentes, dès la création de l'invitation
  invitId: string = '' // ID de l'invitation générée aléatoirement à sa création
  userId: string = '' // ID du bénéficiare de l'invitation
  major: string = '' //code majeur 
  minor: string = '' // code mineur
  // v: number = 0 // date-heure de sa dernière évolution, que soit par U ou par un des sponsors.
  waiting: boolean = true //
  tab: string = '' // Adroise commune U / sponsors (non cryptée)
  etc: any = null // objet écrit exclusivement par les sponsors intervenant et contenant toutes les données nécessaires à la _validation_ de l'invitation. En pratique c'est une _sérialisation_ d'un objet.
  spCredId: string = '' // ID du credential de sponsoring sous lequel le dernier sponsor est intervenu.
  // challenge: string = ''
  // sign: string = '' // signature par le credential `spCredId` du challenge (en base 64).

  init (major: string, minor: string, tab: string ) {
    const sf = stores.safe
    this.invitId = Crypt.rnd(15)
    this.waiting = true
    this.major = major
    this.minor = minor || ''
    this.tab = tab || ''
    this.userId = sf.userId
  }

  constructor (svc: string, org: string, major: string, minor: string, tab: string) {
    this.svc = svc
    this.org = org
    this.invitId = Crypt.rnd(15)
    this.waiting = true
    this.major = major
    this.minor = minor || ''
    this.tab = tab || ''
  }

  // Complète l'objet créé par son contructor quand il est créé par U */
  initByU () {
    const sf = stores.safe
    this.userId = sf.userId
  }

  /* Complète l'objet créé par son contructor quand il est créé par un sponsor
  - La fourniture de etc et de sa signature sont requises ensuite
  */
  initByS (userId: string, etc: any, credId: string) {
    this.userId = userId
    this.waiting = false
    this.etc = keyToB64(encode(etc))
    this.spCredId = credId
  }

  updByU (tab: string, waiting: boolean) {
    
  }

  async sign () {
    const sf = stores.safe
    const challenge = Crypt.rnd(24)
    let x : string
    if (this.userId === sf.userId) {
      x = sf.auth.S
    } else {
    
    if (!cred) {
      this.spCredId = stores.safe.userId
      x = sf.auth.S
    } else {
      this.spCredId = cred.credId
      x = cred.privs
    }
    const challenge = Crypt.rnd(24)
    const signature = keyToB64(await Crypt.sign(keyFromB64(x), encoder.encode(this.challenge)))
  }

  /*
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
  */

  static p1 = ['invitId', 'userId', 'major', 'minor', 'waiting', 'tab', 'etc', 'spCredId', 'challenge', 'sign']

  toObj () : Object { // TODO
    const x = {}
    for (const p of InvitationA.p1) x[p] = this[p] || null
    return x
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
  
  async setAccept (params: Object) : Promise<Accept | null> {
    return null
  }

  async accept ( accept: Accept, txt: string, msgVal: MsgVal ) {
    console.log(this.invitId, 'accept')
    const sf = stores.safe
    const op = new Operation('InvitAR', this.svc, this.org)
    try {
      op.args.accept = accept
      const aes = await Crypt.getAESKey(keyFromB64(this.pubu), keyFromB64(sf.auth.D))
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
    const op = new Operation('InvitAR', this.svc, this.org)
    try {
      const aes = await Crypt.getAESKey(keyFromB64(this.pubu), keyFromB64(sf.auth.D))
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

  async decline (txtx: string) {
    console.log(this.invitId, 'decline')
    const op = new Operation('InvitDC', this.svc, this.org)
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
    const op = new Operation('InvitDC', this.svc, this.org)
    try {
      op.args.invitId = this.invitId
      const res = await op.post()
      if (res.status)
        await stores.ui.diagDisplay($t('INVopret_' + res.status))
    } catch(e) {
      op.ko(e)
    }
  }
  */

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. Par exemple:
  - enregistrement d'un credential résultant de l'invitation
  */
  async validate () {
  }

}
