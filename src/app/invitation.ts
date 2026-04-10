
import stores from '../stores/all'
import { InvitationA, MsgVal } from '../src-fw/invitationA'
import { CredSafe } from '../src-fw/credsafe'
import { $t } from '../src-fw/util'
import { Operation } from '../src-fw/operation'

import { Crypt, keyToB64 } from '../src-fw/crypt'

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

  constructor () { 
    super()
  }

  /* Retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitation en status 1.
  Bref pourquoi il n'est pas un SPONSOR acceptable.

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
  async validate () {
    console.log(this.invitId, this.major, 'validate')
    switch (this.major) {
      case 'Org.manager' : { await this.validate_orgManager(); return }
      case 'Auteur' : { await this.validate_auteur(); return }
    }
  }

  async validate_orgManager () : Promise<void> {
    const op = new Operation('InvitValidate', this.svc, this.org)
    try {
      op.args.invitId = this.invitId
      const res = await op.post()
    } catch (e) {
      op.ko(e)
    }

  }

  async validate_auteur () : Promise<void> {
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
          c.setId()
          mcreds.set(c.id, c)
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
          c.setId()
          mcreds.set(c.id, c)
        }

        const status = await stores.safe.updateCreds(mcreds, null, null, null)
        if (status !== 0)
          await stores.ui.diagDisplay($t('HPsfop_' + status))
      }

    } catch(e) {
      op.ko(e)
    }
  }

}