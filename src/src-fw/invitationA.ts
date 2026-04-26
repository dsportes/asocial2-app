// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { Crypt } from './crypt'
import { keyToB64, keyFromB64, toUrl, fromUrl } from '../src-fw/b64'

import stores from '../stores/all'
import { MDOperation, Operation } from '../src-fw/operation'
import { $t } from '../src-fw/util'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type MsgVal = {
  ok: boolean,
  txt: string,
  role: string,
  docId: string
}

export type InvObj = {
  svc?: string // service d'ou l'invitation a été lue (ou préparée à la création)
  org?: string // organisation d'ou l'invitation a été lue (ou préparée à la création)
  v?: number // (lue du service) date-heure de sa dernière évolution, que soit par U ou par un des sponsors.

  invitId?: string  // ID de l'invitation générée aléatoirement à sa création
  userId: string // ID du bénéficiare de l'invitation
  major: string //code majeur 
  minor: string // code mineur
  byU: boolean // la dernière maj est de U
  tab: string // Adroise commune U / sponsors (non cryptée)
  etc: any // objet écrit exclusivement par les sponsors intervenant et contenant toutes les données nécessaires à la _validation_ de l'invitation. En pratique c'est une _sérialisation_ d'un objet.
}

/* ### Document `Invitation` dans la base du service
*/
export class InvitationA {
  svc: string = '' // service d'ou l'invitation a été lue (ou préparée à la création)
  org: string = '' // organisation d'ou l'invitation a été lue (ou préparée à la création)
  v: number = 0 // (lue du service) date-heure de sa dernière évolution, que soit par U ou par un des sponsors.

  invitId?: string = '' // ID de l'invitation générée aléatoirement à sa création
  userId: string = '' // ID du bénéficiare de l'invitation
  major: string = '' //code majeur 
  minor: string = '' // code mineur
  byU: boolean = true // la dernière maj est de U
  tab: string = '' // Adroise commune U / sponsors (non cryptée)
  etc: any = null // objet écrit exclusivement par les sponsors intervenant et contenant toutes les données nécessaires à la _validation_ de l'invitation. En pratique c'est une _sérialisation_ d'un objet.

  static p1 = ['invitId', 'userId', 'major', 'minor', 'byU', 'tab', 'etc']

  constructor (obj?: InvObj) {
    if (obj) {
      this.svc = obj.svc || ''
      this.org = obj.org || ''
      this.v = obj.v || 0
      this.major = obj.major
      this.minor = obj.minor || ''
      this.byU = obj.byU || true
      this.tab = obj.tab || ''
      this.etc = obj.etc || null
    }
    this.invitId = obj && obj.invitId ? obj.invitId : Crypt.rnd(15)
    this.userId = obj && obj.userId ? obj.userId : stores.safe.userId
  }

  toObj () : Object {
    const x = {}
    for (const p of InvitationA.p1) x[p] = this[p] || null
    return x
  }

  async mdInvitSet (lv: boolean) {
    const mop = new MDOperation('$mdInvitSet')
    mop.args['svc'] = this.svc
    mop.args['org'] = this.org
    mop.args['invitId'] = this.invitId
    mop.args['userId'] = this.userId
    mop.args['lv'] = lv
    try {
      await mop.post()
    } catch (e: any) {
      mop.ko(e)
      return
    }
  }

  async createByU () {
    const ui = stores.ui
    const op = new Operation('InvitCreateByU', this.svc, this.org)
    op.args['invObj'] = this.toObj
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return
      }
      await this.mdInvitSet(true)
    } catch (e: any) {
      op.ko(e)
      return
    }
  }

  async updateByU (tab: string) {
    const ui = stores.ui
    const op = new Operation('InvitUpdByU', this.svc, this.org)
    op.args['invitId'] = this.invitId
    op.args['tab'] = tab
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return
      }
      await this.mdInvitSet(true)
    } catch (e: any) {
      op.ko(e)
      return
    }
  }

  async createByS (majorminor: string) {
    const ui = stores.ui
    const op = new Operation('InvitCreateByS', this.svc, this.org)
    op.args['invObj'] = this.toObj
    if (this.minor !== 'Org.manager')
      await op.sign('Sponsor.', majorminor)
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return
      }
      await this.mdInvitSet(false)
    } catch (e: any) {
      op.ko(e)
      return
    }
  }

  async updateByS (majorminor: string, tab: string, etc: any) {
    const ui = stores.ui
    const op = new Operation('InvitUpdByS', this.svc, this.org)
    op.args['invitId'] = this.invitId
    op.args['etc'] = etc
    op.args['tab'] = tab
    if (this.minor !== 'Org.manager')
      await op.sign('Sponsor.', majorminor)
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return
      }
      await this.mdInvitSet(false)
    } catch (e: any) {
      op.ko(e)
      return
    }
  }

  /* Retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitation en status 1.
  Bref pourquoi il n'est pas un SPONSOR acceptable
  */
  async msgVal () : Promise<MsgVal> {
    return { ok: false, txt: 'KO', role: '', docId: '' }
  }

  async validate () {
  }

  /* InvitList liste pour un sponsor les invitations enregistrées pour un "major"
  - soit toutes, avec le credential 'Org.manager' ou 'Sponsor.major'
  - soit uniquement celles du "minor" indiqué pour un 'Sponsor.minor'
  Retourne une liste d'invitations 
  */
  static async InvitList (svc: string, org: string, major: string, minor: string) 
    : Promise<[number, InvitationA[] | null]> {
    const op = new Operation(svc, org)
    try {
      op.args['major'] = major
      op.args['minor'] = minor

      let ok = await op.sign('Org.manager')
      if (!ok) ok = await op.sign('Sponsor.', major)
      if (!ok && minor !== '') ok = await op.sign('Sponsor.', major + '/' + minor)
      if (!ok) 
        return [1, null]

      const res = await op.post() 
      if (res.status !== 0) {
        await stores.ui.diagDisplay($t('MNOcred'))
        return [res.status, null]
      }
      const lst: InvitationA[] = []
      for(const x of res.list) {
        const obj = decode(x) as InvObj
        obj.svc = svc
        obj.org = org
        const inv = new InvitationA(obj)
        lst.push(inv)
      }
      return [0, lst]
    } catch(e: any) {
      op.ko(e)
      return [-1, null]
    }
  }
}

