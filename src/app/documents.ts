
import { Document } from '../src-fw/document'

class Article extends Document {
  async compile () {}
}

class Auteur extends Document {
  async compile () {}
}

class Chat extends Document {
  async compile () {}
}

class Sujet extends Document {
  async compile () {}
}

Document.setClasses({ Article, Auteur, Chat, Sujet })