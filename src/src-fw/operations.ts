import { Operation, ADMIN$Status } from '../src-fw/operation'

import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { $Subs } from'../src-fw/subscription'
import { $Credential, $Cred, $DefSigner } from '../src-fw/documents'
import { $Document, Registry, SOA } from '../src-fw/registry'

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
export class FW$Sync {
  op: Operation

  constructor (soa: SOA) {
    this.op = new Operation('FW$Sync', soa.svc, soa.org)
    this.op.args.toSync = []
  }

  add (v: number, docCl:string, docPk?: string, colName?: string) {
    if (!docPk) this.op.args.toSync.push({ def: docCl + '/1', v: v || 0})
    else if (!colName) this.op.args.toSync.push({ def: docCl + '/' + docPk, v: v || 0})
    else this.op.args.toSync.push({ def: docCl + '/' + colName + '/' +  docPk, v: v || 0})
    return this
  }

  async post (noex?: boolean) : Promise<Map<string, $Document>> {
    const signer = Registry.newD(this.op.args.svc, 'DefSigner') as $DefSigner
    signer.op = this.op
    await signer.sign(this.op.args.toSync)
    const docs: Map<string, $Document> = new Map()
    try {
      const res = await this.op.post()
      if (res.syncs) {
        for(const x in res.syncs) {
          const datas = res.syncs[x]
          for (const data of datas) {
            const cl = x.substring(0, x.indexOf('/'))
            const doc = await Registry.compile(this.op.args.svc, cl, this.op.args.org, data)
            docs.set(cl + '/' + doc._pk, doc)
          }
        }
      }
      return docs
    } catch (e) {
      await this.op.ko(e)
      if (!noex) throw e
      return docs
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
