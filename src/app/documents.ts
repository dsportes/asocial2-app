
import { Registry, Document } from '../src-fw/registry'
import { CredSafe, Case, CaseMin, MsgVal } from '../src-fw/documents'
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

class Cred_Org extends CredSafe {
  constructor (obj?: Object) {
    super(obj)
  }
}
Registry.registerD(Cred_Org)

class Case_admin extends Case { //TOPIC_admin: '01Attribuer un pouvoir de "manager"'
  constructor (obj: CaseMin) {
    super(obj)
  }

  msgVal () : MsgVal {
    return { ok: false, txt: 'KO', docCl: '', docId: ''}
  }

  editEtc () : string {
    return ''
  }

  async validate (args: any) : Promise<number> {
    return 0
  }
}
Registry.registerD(Case_admin)

class Case_crauteur extends Case { // TOPIC_crauteur: '02Création d\'un nouvel auteur'
  constructor (obj: CaseMin) {
    super(obj)
  }

  msgVal () : MsgVal {
    return { ok: false, txt: 'KO', docCl: '', docId: ''}
  }

  editEtc () : string {
    if (!this.etc) return ''
    const self: any = { ...this.etc }
    const t: string[] = []
    if (self.newA === 1) t.push($t('INV$Auteur_t1', [self.docId]))
    if (self.newA === 2) t.push($t('INV$Auteur_t0'))
    if (self.option === 2) t.push($t('INV$Auteur_t2'))
    if (self.option === 3) t.push($t('INV$Auteur_t2', self.categ))
    return t.join('\n')
  }

  async validate (args: any) : Promise<number> {
    return 0
  }
}
Registry.registerD(Case_crauteur)

class Case_joinauteur extends Case { // TOPIC_joinauteur: '02Devenir co-auteur d\'un auteur'
  constructor (obj: CaseMin) {
    super(obj)
  }

  msgVal () : MsgVal {
    return { ok: false, txt: 'KO', docCl: '', docId: ''}
  }

  editEtc () : string {
    return ''
  }

  async validate (args: any) : Promise<number> {
    return 0
  }
}
Registry.registerD(Case_joinauteur)
