// @ts-ignore
// import { decode } from '@msgpack/msgpack'

import { Operation } from './operation'
import { $t } from '../src-fw/util'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { keyToB64, keyFromB64, toUrl, fromUrl } from '../src-fw/b64'

import { subsToSync } from '../stores/data-store'
import { Subscription } from'../src-fw/subscription'
import { Invitation } from '../app/invitation'
import { Invit } from '../stores/safe-store'
import { Credential } from '../src-fw/documents'

export class Bug extends Operation {
  constructor (SVC: string, org: string) { super('Bug', SVC, org) }

  async run () : Promise<void> {
    try {
      const res = await this.post(true)
      return res
    } catch(e) {
      this.ko(e)
    }
  }
}

export class  SvcOpIsAdmin extends Operation {
  constructor (SVC: string, $OP: string) { super('SvcOpIsAdmin', SVC, '', $OP) }

  async run () {
    try {
      const res = await this.post()
      return res['isadmin']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class  GetSvcOpStatus extends Operation {
  constructor (SVC: string, $OP: string) { super('GetSvcOpStatus$', SVC, '', $OP) }

  async run () {
    try {
      const res = await this.post(true)
      return res['svcStatus']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class  GetSvcOrgStatus extends Operation {
  constructor (SVC: string, org: string) { super('GetSvcOrgStatus', SVC, org) }

  async run () {
    try {
      const res = await this.post(true)
      return res['orgStatus']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class SetSvcOpStatus extends Operation {
  constructor (SVC: string, $OP: string) { super('SetSvcOpStatus$', SVC, '', $OP) }

  async run (st: number, txt: string) {
    try {
      this.args.st = st
      this.args.txt = txt || ''
      const res = await this.post()
      return res['svcOpStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetSvcOrgStatus extends Operation {
  constructor (SVC: string, org: string) { super('SetSvcOrgStatus', SVC, org) }

  async run (st: number, txt: string) {
    try {
      this.args.st = st
      this.args.txt = txt || ''
      const res = await this.post()
      return res['svcOpStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class GetOrgConfig extends Operation {
  constructor (SVC: string, org: string) { super('GetOrgConfig$', SVC, org) }

  async run () {
    try {
      const res = await this.post()
      return res['orgconfig']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetOrgConfig extends Operation {
  constructor (SVC: string, org: string) { super('SetOrgConfig$', SVC, org) }

  async run (db?: string, st?: string ) {
    try {
      this.args.db = db || ''
      this.args.st = st || ''
      const res = await this.post()
      return res['orgconfig']
    } catch(e) {
      this.ko(e)
    }
  }
}

/* SetSubscription enregistre la souscription d'une session *************************
- Supprime la précédente s'il y en avait une
- Créé une nouvelle si l'argument subscription n'est pas null
*/
export class SetSubscription extends Operation {
  constructor (SVC: string, org: string) { super('SetSubscription', SVC, org) }

  async run (subscription: Subscription, longLife: boolean ) {
    try {
      // const subJSON = stores.session.subJSON
      this.args.subscription = subscription
      this.args.longLife = longLife 
      const res = await this.post()
    } catch(e) {
      this.ko(e)
    }
  }
}

/* UpdateSubscription enregistre la mise à jour d'une souscription d'une session
*/
export class UpdateSubscription extends Operation {
  constructor (SVC: string, org: string) { super('UpdateSubscription', SVC, org) }

  async run (title: string, url: string, defs: Object ) {
    try {
      // const subJSON = stores.session.subJSON
      this.args.title = title
      this.args.url = url
      this.args.defs = defs
      const res = await this.post()
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Sync : synchronise les souscriptions citées *************************
- toSync = subsToSync[]
subsToSync = {
  def: string,
  v: number - version 'vs' la plus récente détenue en session
}
Pour chaque 'def' retourne la sous-collection 'clazz/colName/colValue' des documents (par exemple: Article/auteurs/Zola)
- si vs est absent: connue actuellement (à now)
- changements (documents ajoutés ou partis de la sous-collection ou zombifiés) depuis la version vs
    de la sous-collection connue en session.
- { def0: [Uint8Array], def1: Uint8array, def2: { pk: data | v ... }}
  Pour les 'def2', un objet { pk: data | v ... }
  - v: version du document si n'est PLUS dans la collection
  - data: data du document s'il est dans la collection
*/
export class Sync extends Operation {
  constructor (SVC: string, org: string) { super('Sync', SVC, org) }

  async run (subsToSync: subsToSync) {
    try {
      // const org = subsToSync.org
      // const type = subsToSync.def.split('/').length - 1
      const dataSt = stores.data
      this.args.toSync = [subsToSync]
      const res = await this.post()
      const x = res[subsToSync.def] // data[] / data / data[]
      const opTime = res['now']
      await dataSt.retSync(opTime, this.args.org, subsToSync.def, x)
    } catch(e) {
      this.ko(e)
    }
  }
}

export class RevokeCred extends Operation {
  constructor (SVC: string, org: string) { super('RevokeCred', SVC, org) }

  async run (userId: string, role: string, docId: string) { 
    try {
      this.args.revokeReq = { userId, role, docId }
      const res = await this.post()
      return res.status
    } catch(e) {
      this.ko(e)
    }
  }
}

export type ListMgrs = {
  userId: string
  time: number
  limit: number
  cond: Object
}

export class ListManagers extends Operation {
  constructor (SVC: string, org: string) { super('ListManagers', SVC, org) }

  async run (mgr?: boolean) : Promise<ListMgrs[] | undefined>{
    try {
      // if (mgr) this.sign('Org.manager')
      const res = await this.post()
      const l = res['list'] as ListMgrs[]
      const s = res['status']
      return [s, l]
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Enregistre un user en tant que "manager" de l'organisation
Créé une invitation (proposition directe).
*/
export const NewManager = async (
  svc: string, 
  org: string, 
  safeStore: string, // de la cible U 
  idu: string, // id de la cible U
  pubcu: string // de la cible U 
  ) : Promise<boolean> => {

  // Enregistrement dans le safe de U
  const invitId = Crypt.rnd(8)
  const time = Math.floor(Date.now() / 1000)
  const major = 'Org.manager'

  const sf = stores.safe
  const invit : Invit = {
    svc: svc,
    org: org,
    invitId,
    time,
    major,
    minor: '',
    status: 2,
    comment: ''
  }
  const aes = await Crypt.getAESKey(keyFromB64(pubcu), keyFromB64(sf.auth.D))
  const status = await sf.invitCreate(invit, idu, aes, sf.auth.C, safeStore)
  if (status !== 0) return false

  // Création et enregistrement de l'invitation en DB du service
  const inv = new Invitation()
  inv.invitId = invitId
  inv.major = major
  inv.time = time
  inv.status = 2
  inv.userId = idu // de la cible U
  inv.safeStore = safeStore // de la cible U
  inv.pubu = pubcu // clé C de la cible U
  inv.pubs = sf.auth.C // clé C du sponsor
  inv.etc = null // Impératif
  const op = new InvitCreate(svc, org)
  return await op.run(inv) === 0
}

export class InvitCreate extends Operation {
  constructor (SVC: string, org: string) { super('InvitCreate', SVC, org) }

  async run ( invitation: Invitation ) : Promise<number> {
    try {
      this.args.invObj = invitation.toObj()
      const res = await this.post()
      return res.status
    } catch(e) {
      this.ko(e)
      return -1
    }
  }
}

export class InvitList extends Operation {
  constructor (SVC: string, org: string) { super('InvitList', SVC, org) }

  async run ( major: string, minor: string, isSp: boolean ) : Promise<Invitation[] | undefined> {
    try {
      this.args.major = major
      this.args.minor = minor
      this.args.isSp = isSp
      if (!isSp) this.sign('Org.manager')
      else { // sponsor
        // On tente toujours le "major" seul
        this.sign('Sponsor.', major) 
        // Le cas échéant on tente le major.minor
        if (minor !== '') this.sign('Sponsor.', major + '/' + minor)
      }
      const res = await this.post()
      if (res.status) {
        await stores.ui.diagDisplay($t('MNOcred'))
        return []
      }
      const lst: Invitation[] = []
      for(const x of res.list) {
        const inv = new Invitation()
        lst.push(await inv.fromList(x, this.args.org, this.SVC) as Invitation)
      }
      return lst
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Lecture d'une invitation par son ID par son propriétaire */
export class InvitGet extends Operation {
  constructor (SVC: string, org: string) { super('InvitGet', SVC, org) }

  async run ( invitId: string ) : Promise<Invitation | null> {
    try {
      this.args.invitId = invitId
      const res = await this.post()
      if (!res.status) {
        const inv = new Invitation()
        await inv.fromList(res.invitation, this.args.org, this.SVC)
        return inv
      }
      await stores.ui.diagDisplay($t('INVopret_' + res.status))
      return null
    } catch(e) {
      this.ko(e)
      return null
    }
  }
}

export type SCred = {
  id: string
  role: string
  docId: string
  time: number
  limit: number
  cond: any
}

export class ListUserCreds extends Operation {
  constructor (SVC: string, org: string) { super('ListUserCreds', SVC, org) }

  async run ( ) : Promise<Map<string, Credential>> {
    const lp = [ 'id', 'role', 'docId', 'limit', 'cond' ]

    const m = new Map<string, Credential>()
    try {
      const res = await this.post()
      for(const x of res.list as SCred[]) {
        const c = new Credential()
        for(const p of lp) c[p] = x[p]
        c.timeSvc = x.time
        c.from = 2
        m.set(x.id, c)
      }
      return m
    } catch(e) {
      this.ko(e)
      return m
    }
  }
}
