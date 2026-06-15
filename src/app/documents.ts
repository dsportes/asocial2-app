
import { Registry, Document } from '../src-fw/registry'
import { $Credential } from '../src-fw/documents'
// import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'

class Article extends Document {
  async compile () {}
}
Registry.registerD(Article)

class Auteur extends Document {
  async compile () {}
}
Registry.registerD(Auteur)

class Chat extends Document {
  async compile () {}
}
Registry.registerD(Chat)

class Sujet extends Document {
  async compile () {}
}
Registry.registerD(Sujet)

class Cred_Org extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
}
Registry.registerD(Cred_Org)

class Cred_Auteur extends $Credential {
  constructor (obj?: Object) {
    super(obj)
  }
}
Registry.registerD(Cred_Auteur)

export const nbdoc = Registry.regDoc.size
