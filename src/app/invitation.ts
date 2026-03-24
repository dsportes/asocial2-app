
import stores from '../stores/all'
import { InvitationA, MsgVal, Accept } from '../src-fw/invitationA'
import { Credential } from '../src-fw/credential'
import { $t } from '../src-fw/util'

import { Crypt, keyToB64 } from '../src-fw/crypt'
import { Operation } from '../src-fw/operation'

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
    let credOk : { ok: boolean, txt: string}
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

  /* Méthode "abstraite": systématiquement surchargée pour 
  s'adapter au traitement spécifique de chaque "major" par un sponsor.
  Génère:
  - l'objet Accept à stocker dans l'invitation,
  - params.txti : le texte de résumé de la proposition d'invitation
  */
  async setAccept (params: Object) : Promise<Accept> {
    switch (this.major) {
      case 'writer' : return this.setAccept_writer(params)
    }
  }

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. Par exemple:
  - enregistrement d'un credential résultant de l'invitation
  */
  async postValidate () {
    switch (this.major) {
      case 'writer' : await this.postValidate_writer()
    }
  }

  async setAccept_writer (params: Object) : Promise<Accept> {
    const a: Accept = {
      role: 'Auteur',
      docId: Crypt.rnd(16),
      cond: {},
      etc: {}
    }
    return a
  }

  async postValidate_writer () : Promise<void> {
    /* Enregistrement du Credential sur "auteur"
    Op 'accept' du sponsor avait généré:
    - role: 'Auteur'
    - docId: l'id de l'auteur
    - etc.credPemS : la clé de signature du credential d'accès à l'auteur
    Op 'InvitValidate' vient d'enregistrer:
    - un document 'Auteur' 
      - docId: ci-dessus
      - nom: label saisi dans la demande.
    - un Credential sur cet auteur avec un pemV
      - issu de la génération du couple pemS et pemV 
    */
    const c = new Credential()
    c.svc = this.SVC
    c.org = this.org
    c.pems = keyToB64(this.etc.credPemS)  
    c.role = this.role
    c.docId = this.docId
    c.name = this.label
    c.skey = ''
    c.time = this.etc.credTime
    c.id = this.etc.credId
    const mcreds: Map<string, Credential> = new Map()
    mcreds.set(c.id, c)
    const status = await stores.safe.updateCreds(mcreds, null, null, null)
    if (status !== 0)
      await stores.ui.diagDisplay($t('HPsfop_' + status))
  }

}