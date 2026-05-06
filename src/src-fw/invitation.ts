// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { Crypt } from './crypt'
import { keyToB64, keyFromB64, toUrl, fromUrl } from './b64'

import stores from '../stores/all'
import { MDOperation, Operation } from './operation'
import { $t } from './util'
import { Major } from '../app/major'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type MsgVal = {
  ok: boolean,
  txt: string,
  role: string,
  docId: string
}

export type SpArgs = {
  majorminor: string,
  tab: string, 
  etc: any
}

export type InvObj = {
  svc?: string // service d'ou l'invitation a été lue (ou préparée à la création)
  org?: string // organisation d'ou l'invitation a été lue (ou préparée à la création)
  v?: number // (lue du service) date-heure de sa dernière évolution, que soit par U ou par un des sponsors.

  invitId?: string  // ID de l'invitation générée aléatoirement à sa création
  userId: string // ID du bénéficiare de l'invitation
  major: string //code majeur 
  minor: string // code mineur
  byU?: boolean // la dernière maj est de U
  tab: string // Adroise commune U / sponsors (non cryptée)
  etc?: any // objet écrit exclusivement par les sponsors intervenant et contenant toutes les données nécessaires à la _validation_ de l'invitation. En pratique c'est une _sérialisation_ d'un objet.
}

/* ### Document `Invitation` dans la base du service
*/
export class Invitation {
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

  $t () { return $t('INV$' + this.major) }
  get prefix () { return 'INV$' + this.major }

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

  get toObj () : Object {
    const x = {}
    for (const p of Invitation.p1) x[p] = this[p] || ( p === 'etc' ? null : '')
    return x
  }

  async mdInvitSet (lv: boolean) : Promise<boolean> {
    const op = new MDOperation('$mdInvitSet')
    op.setArgs({ 
      invitId: this.invitId, 
      userId: this.userId, 
      svc: this.svc, 
      org: this.org,
      lv 
    })
    try {
      await op.post()
      stores.ui.diagDisplay($t('INVop_1'), 2)
      return true
    } catch(e: any) {
      op.ko(e)
      return false
    }
  }

  async createByU () : Promise<boolean> {
    this.byU = true
    const ui = stores.ui
    const op = new Operation('InvitCreateByU', this.svc, this.org)
    op.args['invObj'] = this.toObj
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return false
      }
      if (await this.mdInvitSet(true)) {
        ui.diagDisplay($t('INVop_1'), 2)
        return true
      } else return false
    } catch (e: any) {
      op.ko(e)
      return false
    }
  }

  async updateByU (tab: string) : Promise<boolean> {
    this.byU = true
    const ui = stores.ui
    const op = new Operation('InvitUpdByU', this.svc, this.org)
    op.args['invitId'] = this.invitId
    op.args['tab'] = tab
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return false
      }
      if (await this.mdInvitSet(true)) {
        await ui.diagDisplay($t('INVop_2'), 2)
        return true
      } else return false
    } catch (e: any) {
      op.ko(e)
      return false
    }
  }

  /* majorminor
  - si absent, le sponsor est "manager"
  - si présent (par exempele 'Auteur') 
    il doit avoir un credential "Sponsor." / "Auteur"
  */
  async createByS (majorminor: string, tab: string, etc: any)  : Promise<boolean> {
    this.byU = false
    const ui = stores.ui
    this.tab = tab
    this.etc = etc
    const op = new Operation('InvitCreateByS', this.svc, this.org)
    op.args['invObj'] = this.toObj
    if (!majorminor) await op.sign('Sponsor.', majorminor)
      else await op.sign('Org.manager', '')
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return false
      }
      if (await this.mdInvitSet(false)) {
        ui.diagDisplay($t('INVop_1'), 2)
        return true
      } else return false
    } catch (e: any) {
      op.ko(e)
      return false
    }
  }

  async updateByS (majorminor: string, tab: string, etc: any)  : Promise<boolean> {
    this.byU = false
    const ui = stores.ui
    const op = new Operation('InvitUpdByS', this.svc, this.org)
    op.args['invitId'] = this.invitId
    op.args['etc'] = etc
    op.args['tab'] = tab
    if (!majorminor) await op.sign('Sponsor.', majorminor)
      else await op.sign('Org.manager', '')
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return false
      }
      if (await this.mdInvitSet(false)) {
        ui.diagDisplay($t('INVop_2'), 2)
        return true
      } else return false
    } catch (e: any) {
      op.ko(e)
      return false
    }
  }

  async cancel ()  : Promise<boolean> {
    const ui = stores.ui
    const op = new Operation('InvitCancel', this.svc, this.org)
    op.args['invitId'] = this.invitId
    try {
      const res = await op.post()
      if (res.status !== 0) {
        await ui.diagDisplay($t('STINV_' + res.status))
        return false
      }
    } catch (e: any) {
      op.ko(e)
      return false
    }
    if (await this.mdInvitDel()) {
      await ui.diagDisplay($t('INVop_3'), 2)
      return true
    }
    return false
  }

  async mdInvitDel () : Promise<boolean> {
    const mop = new MDOperation('$mdInvitDel')
    mop.args['svc'] = this.svc
    mop.args['org'] = this.org
    mop.args['invitId'] = this.invitId
    mop.args['userId'] = this.userId
    try {
      await mop.post()
      return true
    } catch (e: any) {
      mop.ko(e)
      return false
    }
  }

  /* Méthode "abstraite" : retourne un message d'erreur disant pourquoi l'utilisateur
  ne peut pas "valider / rejeter" l'invitation en status 1.
  Bref pourquoi il n'est pas un SPONSOR acceptable
  */
  msgVal () : MsgVal {
    return Major.msgVal(this)
  }

  editEtc () : string {
    const s = this.major.replaceAll('.', '_').replaceAll('/', '_')
    const m = Major['editEtc_' + s]
    return m ? m(this) : ''
  }

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. 
  Construit le 'majorminor tab etc' de l'invitation depuis les arguments saisis par 
  l'utilisateur sur le formulaire adapté au 'major'.
  */
  async invitation (args: any) : Promise<boolean> {
    const ui = stores.ui
    const s = this.major.replaceAll('.', '_').replaceAll('/', '_')
    const m = Major['invitation_' + s]
    if (!m) { await ui.diagDisplay($t('INVinvbug', [s])); return false }
    const { err, majorminor, tab, etc } = await m(this, args)
    if ( err !== 'ok') { await ui.diagDisplay(err); return false }
    if (this.etc === null)
      return await this.createByS(majorminor, tab, etc)
    else 
      return await this.updateByS(majorminor, tab, etc)
  }

  /* Méthode "abstraite" : surchargée en fonction du 
  "major" de l'invitation. Par exemple:
  - enregistrement d'un credential résultant de l'invitation
  En cas de succès l'invitation a été supprimée par le service, 
  MAIS elle n'a pas encore été supprimée du Master Directory
  ce qui est fait ici.
  */
  async validate (args: any) : Promise<boolean> {
    const ui = stores.ui
    const s = this.major.replaceAll('.', '_').replaceAll('/', '_')
    const m = Major['validate_' + s]
    if (!m) { await ui.diagDisplay($t('INVvalbug', [s])); return false }
    const err = await m(this, args)
    if ( err !== 'ok') { await ui.diagDisplay(err); return false }
    const x = await this.mdInvitDel()
    if (x) await ui.diagDisplay($t('INVop_4'), 2)
    else await ui.diagDisplay($t('INVop_5'))
    return true
  }
}

/* Enregistre une invitation à un user pour être "manager" de l'organisation
Depuis un administrateur seulement : créé une invitation non sollicitée
*/
export const NewManager = async (svc: string, org: string, tab: string, userId: string, userName: string)
 : Promise<boolean> => {
  const invit = new Invitation({svc, org, major: 'Org.manager', minor: '', tab, userId})
  const etc = {
    credId: Crypt.rnd(15),
    name: userName
  }
  return await invit.createByS('', tab, etc)
}

/* InvitList liste pour un sponsor les invitations enregistrées pour un "major"
- soit toutes, avec le credential 'Org.manager' ou 'Sponsor.major'
- soit uniquement celles du "minor" indiqué pour un 'Sponsor.minor'
Retourne une liste d'invitations 
*/
export const InvitList = async (svc: string, org: string, major: string, minor: string) 
  : Promise<Invitation[] | null> => {
  const op = new Operation(svc, org)
  try {
    op.args['major'] = major
    op.args['minor'] = minor

    let ok = await op.sign('Org.manager')
    if (!ok) ok = await op.sign('Sponsor.', major)
    if (!ok && minor !== '') ok = await op.sign('Sponsor.', major + '/' + minor)
    if (!ok) {
      await stores.ui.diagDisplay($t('Invcred'))
      return null
    }
    const res = await op.post() 
    if (res.status !== 0) {
      await stores.ui.diagDisplay($t('Invcred'))
      return null
    }
    const lst: Invitation[] = []
    for(const x of res.list) {
      const obj = decode(x) as InvObj
      obj.svc = svc
      obj.org = org
      const inv = new Invitation(obj)
      lst.push(inv)
    }
    return lst
  } catch(e: any) {
    op.ko(e)
    return null
  }
}
