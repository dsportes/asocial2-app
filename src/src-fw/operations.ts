// @ts-ignore
import { decode } from '@msgpack/msgpack'

import { Operation } from './operation'
import { $t } from '../src-fw/util'
import stores from '../stores/all'

import { subsToSync } from '../stores/data-store'
import { Subscription } from'../src-fw/subscription'
import { Invitation, InvObj } from './invitation'
import { Cred, Credential, DocCase, Case } from '../src-fw/documents'
import { TopicDef } from 'src/stores/service-store'

export class Bug extends Operation {
  constructor (SVC: string, org: string) { super('Bug', SVC, org) }

  async run () : Promise<void> {
    try {
      const res = await this.post(true)
      return res
    } catch(e) {
      await this.ko(e)
    }
  }
}

export class ErrorTest extends Operation {
  constructor (SVC: string, org: string) { super('ErrorTest', SVC, org) }

  async run () : Promise<void> {
    try {
      await this.post()
    } catch(e) {
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
      throw e
    }
  }
}

export class  GetTopics extends Operation {
  constructor (SVC: string, $OP: string) { super('GetTopics$', SVC, '', $OP) }

  async run () : Promise<TopicDef[]> {
    try {
      const svc = stores.service
      const res = await this.post(true)
      return res['topics'] || []
    } catch(e) {
      await this.ko(e)
      return []
    }
  }
}

export class  UpdTopics extends Operation {
  constructor (SVC: string, $OP: string) { super('UpdTopics$', SVC, '', $OP) }

  async run (json: string) {
    try {
      this.args['json'] = json
      const res = await this.post()
    } catch(e) {
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
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
      await this.ko(e)
    }
  }
}

// TODO en discussion (vor service)
export class RevokeCred extends Operation {
  constructor (SVC: string, org: string) { super('RevokeCred', SVC, org) }

  async run (userId: string, role: string, docId: string) { 
    try {
      this.args.revokeReq = { userId, role, docId }
      const res = await this.post()
      return res.status
    } catch(e) {
      await this.ko(e)
    }
  }
}

export class AutoRevokeCred extends Operation {
  constructor (SVC: string, org: string) { super('AutoRevokeCred', SVC, org) }

  async run (credId: string, docCl: string, docId: string) : Promise<boolean> { 
    try {
      this.setArgs({ credId, docCl, docId: docId || '' })
      await this.sign(docCl, docId )
      await this.post()
      return true
    } catch(e) {
      await this.ko(e)
      return false
    }
  }
}

export class ListManagers extends Operation {
  constructor (SVC: string, org: string) { super('ListManagers', SVC, org) }
  async run () : Promise<Cred[]>{
    try {
      const res = await this.post()
      return res['creds'] as Cred[]
    } catch(e) {
      await this.ko(e)
      return []
    }
  }
}

/* Lecture d'un document Case par son propriétaire */
export class CaseGet extends Operation {
  constructor (SVC: string, org: string) { super('CaseGet', SVC, org) }

  async run ( caseId: string ) : Promise<DocCase | null> {
    try {
      this.args.caseId = caseId
      const res = await this.post()
      const c = res.case as DocCase | null
      if (!c) return null
      c.svc = this.SVC
      c.org = this.args.org
      return c
    } catch(e) {
      await this.ko(e)
      return null
    }
  }

}

// Met à jour un Credential avec les données [v, more] de son document en DB
export class SyncCred extends Operation {
  constructor (SVC: string, org: string) { super('GetCredUpdates', SVC, org) }

  async run (c: Credential ) : Promise<boolean> {
    try {
      this.setArgs({ credId: c.credId, docCl: c.docCl, docPk: c.docPk || ''})
      await this.sign(c.docCl, c.docPk)
      const res = await this.post()
      const x = res.more
      if (x) {
        c.v = x[0]
        c.more = x[1]
        return true
      } else return false
    } catch(e) {
      await this.ko(e)
      return false
    }
  }
}

/* InvitList liste, pour un sponsor, les invitations enregistrées pour un "major"
- soit toutes, avec le credential 'Org.manager' ou 'Sponsor.major'
- soit uniquement celles du "minor" indiqué pour un 'Sponsor.minor'
Retourne une liste d'invitations 
*/
export class InvitList extends Operation {
  constructor (SVC: string, org: string) { super('InvitList', SVC, org) }

  async run ( major: string, minor: string, isSp: boolean ) : Promise<Invitation[]> {
    try {
      this.args.major = major
      this.args.minor = minor
      if (!isSp) this.sign('Org.manager')
      else { // sponsor
        // On tente toujours le "major" seul
        this.sign('Sponsor.', major) 
        // Le cas échéant on tente le major.minor
        if (minor !== '') this.sign('Sponsor.', major + '/' + minor)
      }
      const res = await this.post()
      const status = res.status
      if (status !== 0) {
        await stores.ui.diagDisplay($t('INVcred'))
        return []
      }
      const lst: Invitation[] = []
      for(const data of res.list) {
        const obj = decode(data)
        obj.svc = this.SVC
        obj.org = this.args.org
        const inv = new Invitation(obj)
        lst.push(inv)
      }
      return lst
    } catch(e) {
      await this.ko(e)
      return []
    }
  }
}
