
import stores from '../stores/all'
import { InvitationA, MsgVal } from '../src-fw/invitationA'
import { Credential } from '../src-fw/credential'
import { $t } from '../src-fw/util'

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
    let credOk
    const creds : Map<string, Credential> = stores.safe.mySafeCreds
    for (const [,c] of creds) {
      if (c.org !== this.org || c.svc !== this.SVC) continue
      if (c.role === 'Org.manager') 
        return { ok: true, txt: $t('INVsponsor_1') }
      if (c.role === 'Sponsor.') {
        if (c.docId === this.major)
          return { ok: true, txt: $t('INVsponsor_2', [$t('INV_' + this.major)]) }
        if (c.docId === this.major + '.' + this.minor)
          credOk = { ok: true, txt: $t('INVsponsor_3', [$t('INV_' + this.major) + ' / ' + this.minor]) }
      }
    } 
    return credOk || { ok: false, txt: $t('INVsponsor_0') }
  }

  async validate () {
    console.log(this.invitId, 'validate dans Invitation')
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