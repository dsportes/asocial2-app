
import { InvitationA } from '../src-fw/invitationA'

export class Invitation extends InvitationA {
  static rnd: number = 0

  constructor () { 
    super()
  }

  /* Retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitation en status 1.
  Bref pourquoi il n'est pas un SPONSOR acceptable
  */
  async msgVal () : Promise<string> {
    return Invitation.rnd++ % 2 ? 'pas cap !' : ''
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