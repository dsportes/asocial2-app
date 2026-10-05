import { Operation } from '../src-fw/operation'
import { $Credential, EmbedCred } from '../src-fw/documents'

export class UpdateCredentialSusp extends Operation {
  constructor (svc: string, org: string) { super('UpdateCredentialSusp', svc, org) }

  async run (cred: EmbedCred, props: Object, reqCred: $Credential) {
    try {
      this.setArgs({ credId: cred.credId, docCl: cred.docCl, docPk: cred.docPk, props } )
      if (reqCred) {
        this.args['reqCred'] = reqCred
        await this.sign(reqCred)
      }
      const res = await this.post()
      return res.status
    } catch(e) {
      await this.ko(e)
    }
  }
}
