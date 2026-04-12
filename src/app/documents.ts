
import { DocRegistry, Document } from '../src-fw/docregistry'

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
