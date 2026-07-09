
import { Registry, $Document } from '../src-fw/registry'
import { regForms } from '../app/forms'
import { regCredentials } from '../app/credentials'
// import stores from '../stores/all'
// import { $t, dhcool } from '../src-fw/util'

class Article extends $Document {
  async compile () {}
}
Registry.registerD(Article)

class Auteur extends $Document {
  async compile () {}

  nom: string // nom d'auteur
  section: string // section du Comité de Rédaction en charge de l'auteur

}
Registry.registerD(Auteur)

class Chat extends $Document {
  async compile () {}
}
Registry.registerD(Chat)

class Sujet extends $Document {
  async compile () {}
}
Registry.registerD(Sujet)

regForms()
regCredentials()
export const nbdoc = Registry.regDoc.size
