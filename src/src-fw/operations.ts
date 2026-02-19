import { Operation } from './operation'
import { sleep } from './util'
import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { Subscription } from'./document'
import { AuthRecord } from './credential'

export class EchoText extends Operation {
  constructor () { super('EchoText') }

  async run (org: string, toecho: string) {
    try {
      await sleep(1000)
      const res = await this.post({ org, text: toecho })
      return res['echo']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class  GetSrvStatus extends Operation {
  constructor () { super('GetSrvStatus') }

  async run (svc: string) {
    try {
      const res = await this.post({ }, svc)
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetSrvStatus extends Operation {
  constructor () { super('SetSrvStatus') }

  async run (svc: string, st: number, txt: string) {
    try {
      const authRecord = new AuthRecord(svc, '*')
      await authRecord.sign('admin', '')
      const args = { authRecord, st, txt: txt || ''}
      const res = await this.post(args, svc)
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class NewOrg extends Operation {
  constructor () { super('NewOrg') }

  async run (svc: string, neworg: string, st: number, db: string) {
    try {
      const authRecord = new AuthRecord(svc, '*')
      await authRecord.sign('admin', '')
      const args = { authRecord, neworg, st, db}
      const res = await this.post(args, svc)
      return res['status']
    } catch(e) {
      this.ko(e)
      return -1
    }
  }
}

/* SetSubscription enregistre la souscription d'une session *************************
- Supprime la précédente s'il y en avait une
- Créé une nouvelle si l'argument subscription n'est pas null
*/
export class SetSubscription extends Operation {
  constructor () { super('SetSubscription') }

  async run (org: string, subscription: Subscription, longLife: boolean ) {
    try {
      const session = stores.session
      const subJSON = session.subJSON
      const sessionId = session.sessionId
      const authRecord = {
        sessionId,
        time: Date.now(),
        tokens : [ ]
      }
      const res = await this.post({ authRecord, org, subscription, longLife })
    } catch(e) {
      this.ko(e)
    }
  }
}

/* UpdateSubscription enregistre la mise à jour d'une souscription d'une session
*/
export class UpdateSubscription extends Operation {
  constructor () { super('UpdateSubscription') }

  async run (org: string, title: string, url: string, defs: Object ) {
    try {
      const session = stores.session
      const subJSON = session.subJSON
      const sessionId = session.sessionId
      const authRecord = {
        sessionId,
        time: Date.now(),
        tokens : [ ]
      }
      const res = await this.post({ authRecord, org, title, url, defs })
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
  constructor () { super('TestAuth') }

  async run (subsToSync: subsToSync) {
    try {
      const org = subsToSync.org
      const type = subsToSync.def.split('/').length - 1
      const dataSt = stores.data
      const session = stores.session
      const authRecord = {
        sessionId : session.sessionId,
        time: Date.now(),
        tokens : [
        ]
      }
      const res = await this.post({ authRecord, org, toSync: [subsToSync] })
      const x = res[subsToSync.def] // data[] / data / data[]
      const opTime = res['now']
      await dataSt.retSync(opTime, org, subsToSync.def, x)
    } catch(e) {
      this.ko(e)
    }
  }
}

export class GrantNewManager extends Operation {
  constructor () { super('GrantNewManager') }

  async run (org: string, comment: string, pemv: string) {
    try {
      const authRecord = new AuthRecord('as2svc', '*')
      await authRecord.sign('admin', '')
      const args = { authRecord, org, comment, pemv}
      const res = await this.post(args)
    } catch(e) {
      this.ko(e)
    }
  }
}

export class RevokeManager extends Operation {
  constructor () { super('RevokeManager') }

  async run (org: string, revoke: string, hpems: string) {
    try {
      const authRecord = new AuthRecord('as2svc', '*')
      await authRecord.sign('admin', '')
      const args = { authRecord, org, revoke, hpems}
      const res = await this.post(args)
    } catch(e) {
      this.ko(e)
    }
  }
}

export type ListMgrs = {
  orguserId: string
  hpems: string
  ctime: number
  dtime: number
  comment: string
  revoke: string
}

export class ListManagers extends Operation {
  constructor () { super('RevokeManager') }

  async run (org: string) : Promise<ListMgrs[]>{
    try {
      const args = { org }
      const res = await this.post(args)
      return res['list'] as ListMgrs[]
    } catch(e) {
      this.ko(e)
    }
  }
}
