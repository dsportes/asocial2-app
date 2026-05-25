
import { DocRegistry, Document } from '../src-fw/docregistry'
import { CredSafeA } from '../src-fw/documents'
import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'

class Article extends Document {
  async compile () {}
}
DocRegistry.registerD(Article)

class Auteur extends Document {
  async compile () {}
}
DocRegistry.registerD(Auteur)

class Chat extends Document {
  async compile () {}
}
DocRegistry.registerD(Chat)

class Sujet extends Document {
  async compile () {}
}
DocRegistry.registerD(Sujet)

class CredSafe extends CredSafeA {
  constructor (obj?: Object) {
    super(obj)
  }
}
DocRegistry.registerD(CredSafe)
DocRegistry.registerD(CredSafeA)

class CredOrg extends CredSafe {
  constructor (obj?: Object) {
    super(obj)
  }
}
DocRegistry.registerD(CredOrg)

