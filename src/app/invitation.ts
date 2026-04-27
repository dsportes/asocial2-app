
import stores from '../stores/all'
import { InvitationA, MsgVal } from '../src-fw/invitationA'
import { CredSafe } from '../src-fw/documents'
import { $t } from '../src-fw/util'
import { MDOperation, Operation } from '../src-fw/operation'

import { Crypt } from '../src-fw/crypt'
import { keyToB64 } from '../src-fw/b64'

const encoder = new TextEncoder()

type InvVal = {
  pemvA: string, // pemV pour le credential d'accès à l'auteur
  pemvS: string, // pemV pour le credential Sponsor (s'il y a lieu)
  time: number // time de l'application pour ces deux credentials
}

type InvitValOM = { // arguments de validation d'un Credential Org.manager
  time: number // date-heure des credentials associés, etc.
  pubv: string // clé publique de vérification du credential
  name: string // nom / pseudo facultatif pour information à stocker en cond
}

export class Invitation extends InvitationA {
  static rnd: number = 0

  constructor (svc: string, org: string, major: string, minor: string, tab: string, userId: string) { 
    super({svc, org, major, minor, tab, userId})
  }

  /* Retourne un message d'erreur disant pourquoi le "sponsor"
  ne peut pas intervenir sur l'invitation.
  Logique applicative choisie ici:
  - un "manager" est toujours un sponsor valide.
  - un utilisateur qui a un credential Sponsor pour le "major" de l'invitation
    est un sponsor valide (quelque soit le "minor").
  - un utilisateur qui a un credential Sponsor pour le "major.minor" de l'invitation
    est un sponsor valide (à condition bien sur que l'invitation ait un minor).
  */
  async msgVal () : Promise<MsgVal> {
    let credOk : MsgVal = { ok: false, txt: '', role: '', docId: ''}
    const creds : Map<string, CredSafe> = stores.safe.mySafeCreds
    for (const [,c] of creds) {
      if (c.org !== this.org || c.svc !== this.svc) continue
      if (c.role === 'Org.manager') 
        return { ok: true, txt: $t('INVsponsor_1'), role: 'Org.manager', docId: '' }
      if (c.role === 'Sponsor.') {
        if (c.docId === this.major)
          return { ok: true, txt: $t('INVsponsor_2', [$t('INV_' + this.major)]), role: 'Sponsor.', docId: c.docId }
        if (c.docId === this.major + '/' + this.minor)
          credOk = { ok: true, txt: $t('INVsponsor_3', [$t('INV_' + this.major) + ' / ' + this.minor]),
            role: 'Sponsor.', docId: c.docId }
      }
    } 
    return credOk || { ok: false, txt: $t('INVsponsor_0'), role: null, docId: null }
  }

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. Par exemple:
  - enregistrement d'un credential résultant de l'invitation
  */
  async validate () : Promise<boolean> {
    const ui = stores.ui
    const s = this.major.replaceAll('.', '_').replaceAll('/', '_')
    const m = this['validate_' + s]
    if (m) {
      const err = await m()
      if (err === 'ok') {
        ui.diagDisplay($t('INVop_4'), 2)
        return true
      } else {
        if (err !== 'ko') await ui.diagDisplay(err)
        return false
      }
    } else {
      await ui.diagDisplay($t('INVvalbug', [s]))
      return false
    }
  }

  /*
  credId: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  privs: string = '' // clé PRIVEE de signature en base64.
  comment: string = '' // texte court libre de l'utilisateur.
  recK: any = null // record libre (crypté par la clé K et en base64 en _safe_).
  */
  async validate_Org_manager () : Promise<string> {
    const op = new Operation('InvitValidate', this.svc, this.org)
    const { pub, priv } = await Crypt.getSVKeyPair()
    try {
      op.args.invitId = this.invitId
      op.args.validArgs = { pubV: keyToB64(pub) }
      const res = await op.post()
      if (res.status !== 0) return $t('INVvalOMst_' + res.status)
      const credSafe = new CredSafe({
        credId: this.etc.credId,
        svc: this.svc,
        org: this.org,
        role: 'Sponsor.',
        docId: 'Org.manager',
        privs: keyToB64(priv)
      })
      credSafe.recK = null
      const ret = stores.safe.createCred(credSafe)
      return ret.status === 0 ? 'ok' : $t('STSF_', ret.status)
    } catch (e) {
      op.ko(e)
      return 'ko'
    }
  }

  async validate_Auteur () : Promise<string> {
    /* 
    Post: invVal avec les pemvA, pemvS, time des credentials
    Puis, enregistrement,
      - du Credential Safe sur "Auteur"
      - optionnellement du credential "Sponsor".
    */
    const op = new Operation('InvitValidate', this.svc, this.org)
    try {
      let privA: string = '', privS: string = ''
      const invVal: InvVal = {
        time: Date.now(),
        pemvA: '',
        pemvS: ''
      }
      if (this.etc.newA === 1) {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvA = keyToB64(pub)
        privA = keyToB64(priv)
      }
      if (this.etc.option > 1) {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvS = keyToB64(pub)
        privS = keyToB64(priv)
      }
      op.args.invitId = this.invitId
      op.args.invVal = invVal
      const res = await op.post()
      if (res.status) await stores.ui.diagDisplay($t('INVopret_' + res.status))
      else { 

        // Enregistrement du ou des credential "Safe"
        // static lp1 = [ 'svc', 'org', 'role', 'docId', 'time', 'privs', 'name', 'comment' ]
        const mcreds: Map<string, CredSafe> = new Map()
        if (this.etc.newA === 1) {
          const c = new CredSafe({ // Credential "Safe"
            svc: op.SVC || '',
            org: this.org,
            privs: privA,
            role: this.etc.role,
            docId: this.etc.docId,
            name: this.etc.label,
            time: invVal.time
          })
          // c.setId()
          mcreds.set(c.credId, c)
        }

        if (this.etc.option > 1) {
          const docId = 'Auteur' + (this.etc.option === 2 ? '' : ('/' + this.etc.categ))
          const c = new CredSafe({ // Credential "Safe"
            svc: op.SVC || '',
            org: this.org,
            privs: privA,
            role: 'Sponsor.',
            docId: this.etc.docId,
            name: this.etc.label,
            time: invVal.time
          })
          mcreds.set(c.credId, c)
        }

        const status = await stores.safe.updateCreds(mcreds, null, null, null)
        if (status !== 0)
          await stores.ui.diagDisplay($t('HPsfop_' + status))
      }
      return 'ok'
    } catch(e) {
      op.ko(e)
      return 'ko'
    }
  }
}

/* Enregistre une invitation à un user pour être "manager" de l'organisation
Depuis un administrateur seulement : créé une invitation non sollicitée
*/
export const NewManager = async (svc: string, org: string, tab: string, userId: string, userName: string)
 : Promise<boolean> => {
  const invit = new Invitation(svc, org, 'Org.manager', '', tab, userId)
  invit.etc = {
    credId: Crypt.rnd(15),
    name: userName
  }
  return await invit.createByS('')
}