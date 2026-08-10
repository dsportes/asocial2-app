// @ts-ignore
import { decode } from '@msgpack/msgpack'

import { Operation, ADMIN$Status } from '../src-fw/operation'

// import stores from '../stores/all'
// import { subsToSync } from '../stores/data-store'

import { $Credential, $Cred, $DefSigner } from '../src-fw/documents'
import { getStore } from'../stores/docs'
import { $Document, Registry, SOA, CollData } from '../src-fw/registry'

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
