
import stores from '../stores/all'
import { InvitationA, MsgVal } from '../src-fw/invitationA'
import { Credential } from '../src-fw/credential'
import { $t } from '../src-fw/util'
import { Operation } from '../src-fw/operation'

import { Crypt, keyToB64, toPem } from '../src-fw/crypt'

const encoder = new TextEncoder()

type InvVal = {
  pemvA: string, // pemV pour le credential d'accès à l'auteur
  pemvS: string, // pemV pour le credential Sponsor (s'il y a lieu)
  time: number // time de l'application pour ces deux credentials
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
    let credOk : MsgVal
    const creds : Map<string, Credential> = stores.safe.mySafeCreds
    for (const [,c] of creds) {
      if (c.org !== this.org || c.svc !== this.SVC) continue
      if (c.role === 'Org.manager') 
        return { ok: true, txt: $t('INVsponsor_1'), role: 'Org.manager', docId: '' }
      if (c.role === 'Sponsor.') {
        if (c.docId === this.major)
          return { ok: true, txt: $t('INVsponsor_2', [$t('INV_' + this.major)]), role: 'Sponsor.', docId: c.docId }
        if (c.docId === this.major + '.' + this.minor)
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
      case 'auteur' : { await this.validate_auteur(); return }
    }
  }

  async validate_auteur () : Promise<void> {
    /* 
    Post: invVal avec les pemvA, pemvS, time des credentials
    Puis, eEnregistrement,
      - du Credential Safe sur "Auteur"
      - optionnellement du credential "Sponsor".
    */
    const op = new Operation('InvitValidate', this.SVC, this.org)
    try {
      let privA, privS
      const invVal: InvVal = {
        time: Date.now(),
        pemvA: '',
        pemvS: ''
      }
      {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvA = toPem(pub, true)
        privA = keyToB64(priv)
      }
      if (this.etc.option > 1) {
        const { pub, priv } = await Crypt.getSVKeyPair()
        invVal.pemvS = toPem(pub, true)
        privS = keyToB64(priv)
      }
      op.args.invitId = this.invitId
      op.args.invVal = invVal
      const res = await op.post()
      if (res.status) await stores.ui.diagDisplay($t('INVopret_' + res.status))
      else { 

        // Enregistrement du ou des credential "Safe"
        const mcreds: Map<string, Credential> = new Map()
        {
          const c = new Credential() // Credential "Safe"
          c.svc = this.SVC
          c.org = this.org
          c.pems = privA  
          c.role = this.role
          c.docId = this.docId
          c.name = this.label
          c.skey = ''
          c.time = invVal.time
          c.id = c.getId()
          mcreds.set(c.id, c)
        }

        if (this.etc.option > 1) {
          const docId = 'Auteur' + (this.etc.option === 2 ? '' : ('.' + this.etc.categ))
          const c = new Credential() // Credential "Safe"
          c.svc = this.SVC
          c.org = this.org
          c.pems = privS  
          c.role = 'Sponsor.'
          c.docId = docId
          c.name = this.label
          c.skey = ''
          c.time = invVal.time
          c.id = c.getId()
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