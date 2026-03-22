
import { InvitationA } from '../src-fw/invitationA'

export class Invitation extends InvitationA {

  constructor () { super() }

  /* Retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitatio,
  bref n'est pas un SPONSOR acceptable
  */
  async mayValidate () : Promise<string> {
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