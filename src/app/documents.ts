
import { Document } from '../src-fw/document'

export function loading() {
  console.log('loading app/document: ', Document.sizeD())
}

class Article extends Document {
  async compile () {}
}
Document.registerD(Article)

class Auteur extends Document {
  async compile () {}
}
Document.registerD(Auteur)

class Chat extends Document {
  async compile () {}
}
Document.registerD(Chat)

class Sujet extends Document {
  async compile () {}
}
Document.registerD(Sujet)
