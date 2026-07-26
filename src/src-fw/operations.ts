import { Operation, ADMIN$Status } from '../src-fw/operation'

import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { Subscription } from'../src-fw/subscription'
import { $Credential, $Cred } from '../src-fw/documents'

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

export const FW$getStatus = async (svc: string, org: string) : Promise<ADMIN$Status> => {
  const op = new Operation ('FW$getStatus', svc, org)
  try {
    const res = await op.post(true)
    return res['status']
  } catch(e) {
    await op.ko(e)
    return { st: 0, at: 0, txt: '' }
  }
}

export const FW$setStatus = async (svc: string, org: string, st: number, txt: string) 
  : Promise<ADMIN$Status> => {
  const op = new Operation ('FW$setStatus', svc, org)
  try {
    op.args.st = st
    op.args.txt = txt || ''
    const res = await op.post(true)
    return res['status']
  } catch(e) {
    await op.ko(e)
    return { st: 0, at: 0, txt: '' }
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

export class ListManagers extends Operation {
  constructor (svc: string, org: string) { super('ListManagers', svc, org) }
  async run () : Promise<$Cred[]>{
    try {
      const res = await this.post()
      return res['creds'] as $Cred[]
    } catch(e) {
      await this.ko(e)
      return []
    }
  }
}

export class UpdateCredential extends Operation {
  constructor (svc: string, org: string) { super('UpdateCredential', svc, org) }

  async run (credId: string, docCl: string, docPk: string, props: Object) {
    try {
      this.setArgs({ credId, docCl, docPk, props } )
      const res = await this.post()
      return res.status
    } catch(e) {
      await this.ko(e)
    }
  }
}

export class AutoRevokeCred extends Operation {
  constructor (SVC: string, org: string) { super('AutoRevokeCred', SVC, org) }

  async run (c: $Credential) : Promise<boolean> {
    try {
      this.setArgs({ credId: c.credId, docCl: c.docCl, docPk: c.docPk })
      await this.sign(c)
      await this.post()
      return true
    } catch(e) {
      await this.ko(e)
      return false
    }
  }
}

/* Met à jour un $Credential avec les données [v, more] de son document en DB */
export class GetCredProps extends Operation {
  constructor (SVC: string, org: string) { super('GetCredProps', SVC, org) }

  async run (c: $Credential ) : Promise<boolean> {
    try {
      this.setArgs({ credId: c.credId, docCl: c.docCl, docPk: c.docPk || ''})
      await this.sign(c)
      const res = await this.post()
      const x = res.vprops
      if (x) {
        c.v = x[0]
        c.props = x[1]
        return true
      } else return false
    } catch(e) {
      await this.ko(e)
      return false
    }
  }
}
