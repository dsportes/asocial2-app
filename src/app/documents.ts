
import { Registry, Document } from '../src-fw/registry'
import { regForms } from '../app/forms'
import { regCredentials } from '../app/credentials'
// import stores from '../stores/all'
// import { $t, dhcool } from '../src-fw/util'

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

regForms()
regCredentials()
export const nbdoc = Registry.regDoc.size
