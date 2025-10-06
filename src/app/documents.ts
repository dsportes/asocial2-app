
import { Document } from '../src-fw/document'

class Article extends Document {
  compile () {}
}

class Auteur extends Document {
  compile () {}
}

class Chat extends Document {
  compile () {}
}

class Sujet extends Document {
  compile () {}
}

Document.setClasses({ Article, Auteur, Chat, Sujet })