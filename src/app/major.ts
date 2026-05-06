
import stores from '../stores/all'
import { Invitation, MsgVal } from '../src-fw/invitation'
import { CredSafe } from '../src-fw/documents'
import { $t } from '../src-fw/util'
import { Operation } from '../src-fw/operation'

import { Crypt } from '../src-fw/crypt'
import { keyToB64 } from '../src-fw/b64'

const encoder = new TextEncoder()

type InvVal = {
  pemvA: string, // pemV pour le credential d'accès à l'auteur
  pemvS: string, // pemV pour le credential Sponsor (s'il y a lieu)
  time: number // time de l'application pour ces deux credentials
}

/* "Fausse" classe statique implémentant pour chaque "Major"
les méthodes "editEtc" et "validate" dont le paramètre "self"
est une Invitation.
  svc: string = '' // service d'ou l'invitation a été lue (ou préparée à la création)
  org: string = '' // organisation d'ou l'invitation a été lue (ou préparée à la création)
  v?: number = 0 // (lue du service) date-heure de sa dernière évolution, que soit par U ou par un des sponsors.

  invitId?: string = '' // ID de l'invitation générée aléatoirement à sa création
  userId: string = '' // ID du bénéficiare de l'invitation
  major: string = '' //code majeur 
  minor: string = '' // code mineur
  byU: boolean = true // la dernière maj est de U
  tab: string = '' // Adroise commune U / sponsors (non cryptée)
  etc: any = null // objet écrit exclusivement par les sponsors intervenant et contenant toutes les données nécessaires à la _validation_ de l'invitation. En pratique c'est une _sérialisation_ d'un objet.

Cred
  credId: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  privs: string = '' // clé PRIVEE de signature en base64.
  comment: string = '' // texte court libre de l'utilisateur.
  recK: any = null // record libre (crypté par la clé K et en base64 en _safe_).
*/
export class Major {

  /* Retourne un message d'erreur disant pourquoi le "sponsor"
  ne peut pas intervenir sur l'invitation.
  Logique applicative choisie ici:
  - un "manager" est toujours un sponsor valide.
  - un utilisateur qui a un credential Sponsor pour le "major" de l'invitation
    est un sponsor valide (quelque soit le "minor").
  - un utilisateur qui a un credential Sponsor pour le "major.minor" de l'invitation
    est un sponsor valide (à condition bien sur que l'invitation ait un minor).
  */
  static msgVal (self: Invitation) : MsgVal {
    let credOk : MsgVal | null = null
    const creds : Map<string, CredSafe> = stores.safe.mySafeCreds
    for (const [,c] of creds) {
      if (c.org !== self.org || c.svc !== self.svc) continue
      if (c.role === 'Org.manager') {
        const x = $t('INVsponsor_1')
        credOk = { ok: true, txt: x, role: 'Org.manager', docId: '' }
        return credOk
      }
      if (c.role === 'Sponsor.') {
        if (c.docId === self.major) {
          credOk = { ok: true, txt: $t('INVsponsor_2', [self.$t]), role: 'Sponsor.', docId: c.docId }
          return credOk
        }
        if (c.docId === self.major + '/' + self.minor) {
          credOk = { ok: true, txt: $t('INVsponsor_3', [self.$t + ' / ' + self.minor]),
            role: 'Sponsor.', docId: c.docId }
          return credOk
        }
      }
    } 
    return { ok: false, txt: $t('INVsponsor_0'), role: '', docId: '' }
  }

  static editEtc_Org_manager (self: Invitation) : string {
    return ''
  }

  static async validate_Org_manager (self: Invitation, args: any) : Promise<string> {
    const op = new Operation('InvitValidate', self.svc, self.org)
    const { pub, priv } = await Crypt.getSVKeyPair()
    try {
      op.args.invitId = self.invitId
      op.args.validArgs = { pubV: keyToB64(pub) }
      const res = await op.post()
      if (res.status !== 0) return $t('INVvalOMst_' + res.status)
      const credSafe = new CredSafe({
        credId: self.etc.credId,
        svc: self.svc,
        org: self.org,
        role: 'Org.manager',
        docId: '',
        comment: $t('nocomment'),
        privs: keyToB64(priv)
      })
      credSafe.recK = null
      const status = await stores.safe.createCred(credSafe)
      return status === 0 ? 'ok' : $t('STSF_', status)
    } catch (e) {
      op.ko(e)
      return 'ko'
    }
  }

  static editEtc_Auteur (self: Invitation) : string {
    return ''
  }

  static async validate_Auteur (self: Invitation, args: any) : Promise<string> {
    /* 
    Post: invVal avec les pemvA, pemvS, time des credentials
    Puis, enregistrement,
      - du Credential Safe sur "Auteur"
      - optionnellement du credential "Sponsor".
    */
    const op = new Operation('InvitValidate', self.svc, self.org)
    try {
      let privA: string = '', privS: string = ''
      const invVal: InvVal = {
        time: Date.now(),
        pemvA: '',
        pemvS: ''
      }
      if (self.etc.newA === 1) {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvA = keyToB64(pub)
        privA = keyToB64(priv)
      }
      if (self.etc.option > 1) {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvS = keyToB64(pub)
        privS = keyToB64(priv)
      }
      op.args.invitId = self.invitId
      op.args.invVal = invVal
      const res = await op.post()
      if (res.status) await stores.ui.diagDisplay($t('INVopret_' + res.status))
      else { 

        // Enregistrement du ou des credential "Safe"
        // static lp1 = [ 'svc', 'org', 'role', 'docId', 'time', 'privs', 'name', 'comment' ]
        const mcreds: Map<string, CredSafe> = new Map()
        if (self.etc.newA === 1) {
          const c = new CredSafe({ // Credential "Safe"
            svc: op.SVC || '',
            org: self.org,
            privs: privA,
            role: self.etc.role,
            docId: self.etc.docId,
            name: self.etc.label,
            time: invVal.time
          })
          // c.setId()
          mcreds.set(c.credId, c)
        }

        if (self.etc.option > 1) {
          const docId = 'Auteur' + (self.etc.option === 2 ? '' : ('/' + self.etc.categ))
          const c = new CredSafe({ // Credential "Safe"
            svc: op.SVC || '',
            org: self.org,
            privs: privA,
            role: 'Sponsor.',
            docId: self.etc.docId,
            name: self.etc.label,
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
