// @ts-ignore
// import { decode } from '@msgpack/msgpack'

import { Operation } from './operation'
import { $t } from '../src-fw/util'
import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { Subscription } from'../src-fw/document'
import { Credential } from '../src-fw/credential'
import { Invitation } from '../app/invitation'
import { Invit } from '../stores/safe-store'

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
  constructor (SVC: string, $OP: string) { super('GetSvcOpStatus', SVC, '', $OP) }

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
  constructor (SVC: string, $OP: string) { super('SetSvcOpStatus', SVC, '', $OP) }

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
  constructor (SVC: string, org: string) { super('GetOrgConfig', SVC, org) }

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
  constructor (SVC: string, org: string) { super('SetOrgConfig', SVC, org) }

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
      await dataSt.retSync(opTime, this.org, subsToSync.def, x)
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Enregistre un user en tant que "manager" de l'organisation
créé son Credential et le stocke "en attente" dans son safe
*/
export class GrantNewManager extends Operation {
  constructor (SVC: string, org: string) { super('GrantNewManager', SVC, org) }

  async run(safeStore: string, targetId: string, pubC: string, info: string) {
    try {
      const sf = stores.safe
      const [ cred, credRequest] =
        await Credential.buildCreds(
          this.SVC, this.org, targetId, 'Org.manager', '', null, '', 0)
      credRequest.cond = { info: info}

      // écriture du credential dans le store de la cible
      await sf.transmitCred(safeStore, targetId, pubC, cred)

      // enregistrement du credential dans le service
      this.args.credRequest = credRequest
      await this.post()
      return true
    } catch(e) {
      this.ko(e)
      return false
    }
  }
}

// TODO
export class RevokeManager extends Operation {
  constructor (SVC: string) { super('RevokeManager', SVC) }

  async run (svc: string, revoke: string, hpems: string) {
    try {
      this.args = { revoke, hpems}
      const res = await this.post()
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

  async run (mgr?: boolean) : Promise<ListMgrs[]>{
    try {
      if (mgr)
        this.sign('Org.manager')
      const res = await this.post()
      const l = res['list'] as ListMgrs[]
      const s = res['status']
      return [s, l]
    } catch(e) {
      this.ko(e)
      return null
    }
  }
}

export class InvitCreate extends Operation {
  constructor (SVC: string, org: string) { super('InvitCreate', SVC, org) }

  async run (
    major: string,
    minor: string,
    txtm: string,
    label: string,
    comment: string,
  ) : Promise<Invit> {
    try {
      const invitation = new Invitation()
      await invitation.init(this.args.org, major, minor, txtm, label)
      this.args.invObj = invitation.toObj()
      const res = await this.post()
      return invitation.toInvit(this.SVC, comment)
    } catch(e) {
      this.ko(e)
    }
  }
}

export class InvitList extends Operation {
  constructor (SVC: string, org: string) { super('InvitList', SVC, org) }

  async run ( major: string, mgr?: boolean ) : Promise<Invitation[]> {
    try {
      this.args.major = major
      if (mgr)
        this.sign('Org.manager')
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

  async run ( invitId: string ) : Promise<Invitation> {
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
    }
  }
}
