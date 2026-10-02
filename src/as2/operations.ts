import { Operation } from '../src-fw/operation'
import { $Credential } from '../src-fw/documents'

export class UpdateCredentialRedaction extends Operation {
  constructor (svc: string, org: string) { super('UpdateCredentialRedaction', svc, org) }

  async run (credId: string, docCl: string, docPk: string, props: Object, cred: $Credential) {
    try {
      this.setArgs({ credId, docCl, docPk, props } )
      await this.sign(cred)
      const res = await this.post()
      return res.status
    } catch(e) {
      await this.ko(e)
    }
  }
}
