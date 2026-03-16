import { Operation, SafeOperation } from './operation'
// import { sleep } from '../src-fw/util'
import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { Subscription } from'../src-fw/document'
import { Credential, Invitation } from '../src-fw/credential'
import { Invit } from '../stores/safe-store'

export class  SvcOpIsAdmin extends Operation {
  constructor (SVC: string) { super('SvcOpIsAdmin', SVC) }

  async run ($OP: string) {
    try {
      this.args = { $OP }
      const res = await this.post()
      return res['isadmin']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class  GetSvcOpStatus extends Operation {
  constructor (SVC: string) { super('GetSvcOpStatus', SVC) }

  async run ($OP: string) {
    try {
      this.args = { $OP }
      const res = await this.post(true)
      return res['svcStatus']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class  GetSvcOrgStatus extends Operation {
  constructor (SVC: string) { super('GetSvcOrgStatus', SVC) }

  async run (org: string) {
    try {
      this.args = { org }
      const res = await this.post(true)
      return res['orgStatus']
    } catch(e) {
      this.ko(e)
      throw e
    }
  }
}

export class SetSvcOpStatus extends Operation {
  constructor (SVC: string) { super('SetSvcOpStatus', SVC) }

  async run ($OP: string, st: number, txt: string) {
    try {
      this.args = { $OP, st, txt: txt || ''}
      const res = await this.post()
      return res['svcOpStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetSvcOrgStatus extends Operation {
  constructor (SVC: string) { super('SetSvcOrgStatus', SVC) }

  async run (org: string, st: number, txt: string) {
    try {
      this.args = { org, st, txt: txt || ''}
      const res = await this.post()
      return res['svcOpStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class GetOrgConfig extends Operation {
  constructor (SVC: string) { super('GetOrgConfig', SVC) }

  async run (org: string) {
    try {
      this.args = { org}
      const res = await this.post()
      return res['orgconfig']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetOrgConfig extends Operation {
  constructor (SVC: string) { super('SetOrgConfig', SVC) }

  async run (org: string, db: string, st: string ) {
    try {
      this.args = { org, db, st}
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
  constructor (SVC: string) { super('SetSubscription', SVC) }

  async run (org: string, subscription: Subscription, longLife: boolean ) {
    try {
      // const subJSON = stores.session.subJSON
      this.args = { org, subscription, longLife }
      const res = await this.post()
    } catch(e) {
      this.ko(e)
    }
  }
}

/* UpdateSubscription enregistre la mise à jour d'une souscription d'une session
*/
export class UpdateSubscription extends Operation {
  constructor (SVC: string) { super('UpdateSubscription'), SVC }

  async run (org: string, title: string, url: string, defs: Object ) {
    try {
      // const subJSON = stores.session.subJSON
      this.args = { org, title, url, defs }
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
  constructor (SVC: string) { super('Sync', SVC) }

  async run (subsToSync: subsToSync) {
    try {
      const org = subsToSync.org
      // const type = subsToSync.def.split('/').length - 1
      const dataSt = stores.data
      this.args = { org, toSync: [subsToSync] }
      const res = await this.post()
      const x = res[subsToSync.def] // data[] / data / data[]
      const opTime = res['now']
      await dataSt.retSync(opTime, org, subsToSync.def, x)
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Enregistre un user en tant que "manager" de l'organisation
créé son Credential et le stocke "en attente" dans son safe
*/
export class GrantNewManager extends Operation {
  constructor (SVC: string) { super('GrantNewManager', SVC) }

  async run(safeStore: string, targetId: string, pubC: string, org: string, info: string) {
    try {
      const sf = stores.safe
      const [ cred, credRequest] =
        await Credential.buildCreds(
          this.SVC, org, targetId, 'Org.manager', '', null, '', 0)
      credRequest.cond = { info: info}

      // écriture du credential dans le store de la cible
      await sf.transmitCred(safeStore, targetId, pubC, cred)

      // enregistrement du credential dans le service
      this.args = { org, credRequest }
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
  constructor (SVC: string) { super('ListManagers', SVC) }

  async run (org: string, mgr?: boolean) : Promise<ListMgrs[]>{
    try {
      this.args = { org }
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

export class CreateInvit extends Operation {
  constructor (SVC: string) { super('CreateInvit', SVC) }

  async run (
    org: string, 
    major: string,
    minor: string,
    txtm: string,
    label: string,
    comment: string,
  ) : Promise<Invit> {
    try {
      const invitation = new Invitation()
      await invitation.init(org, major, minor, txtm, label)
      this.args = { org, invitation}
      const res = await this.post()
      return res.status === 0 ? invitation.toInvit(this.SVC, comment) : null
    } catch(e) {
      this.ko(e)
    }
  }
}
