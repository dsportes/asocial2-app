
import stores from '../stores/all'
import { InvitationA, MsgVal } from '../src-fw/invitationA'
import { Credential } from '../src-fw/credential'
import { $t } from '../src-fw/util'

import { keyToB64 } from '../src-fw/crypt'

const encoder = new TextEncoder()

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
  async postValidate () {
    switch (this.major) {
      case 'auteur' : await this.postValidate_auteur()
    }
  }

  async postValidate_auteur () : Promise<void> {
    /* Enregistrement du Credential Safe sur "Auteur"
    Op 'accept' du sponsor avait généré:
    - role: 'Auteur'
    - docId: l'id de l'auteur
    - etc.credA
      - pemS : la clé de signature du credential d'accès à l'auteur
      - id: id du credential
      - time: du credential
    Op 'InvitValidate' vient d'enregistrer:
    - un document 'Auteur' 
      - docId: ci-dessus
      - nom: label saisi dans la demande.
    - un Credential sur cet auteur avec un pemV
      - issu de la génération du couple pemS et pemV
    - optionnellement un credential "Sponsor" décrit dans etc.credS
     qui accorde à U un droit de Sponsor pour traiter les demandes
     d'autres auteurs.
    */
    const mcreds: Map<string, Credential> = new Map()
    if (this.etc.credA) {
      const c = new Credential() // Credential "Safe"
      c.svc = this.SVC
      c.org = this.org
      c.pems = keyToB64(this.etc.credA.pemS)  
      c.role = this.role
      c.docId = this.docId
      c.name = this.label
      c.skey = ''
      c.time = this.etc.credA.time
      c.id = this.etc.credA.id
      mcreds.set(c.id, c)
    }

    if (this.etc.credS) {
      const c = new Credential() // Credential "Safe"
      c.svc = this.SVC
      c.org = this.org
      c.pems = keyToB64(this.etc.credS.pemS)  
      c.role = 'Sponsor.'
      c.docId = this.etc.credS.docId
      c.name = this.label
      c.skey = ''
      c.time = this.etc.credS.time
      c.id = this.etc.credS.id
      mcreds.set(c.id, c)
    }

    const status = await stores.safe.updateCreds(mcreds, null, null, null)
    if (status !== 0)
      await stores.ui.diagDisplay($t('HPsfop_' + status))
  }

}