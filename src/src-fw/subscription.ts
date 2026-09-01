// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

// import { IDB } from './hasIDB'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'
import { $Credential } from '../src-fw/documents'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { $ADocument, $Document } from '../src-fw/registry'

// Map par svc/org des périmètres identifiés par leur id
export type $Perims = Map<string, Map<string, $Perimeter>>
// Map par svc/org du set des périmètres dont chaque def fait partie
export type $DefsXref = Map<string, Map<string, Set<string>>>

export const buildXref = () => {
  const session = stores.session
  const m0: Map<string, Map<string, Set<string>>> = new Map() 
  for(const [so, m] of session.perims) {
    for(const [pid, p] of m) {
      for(const def of p.defs) {
        const id = def.definition
        let m1 : Map<string, Set<string>> = m0.get(so)
        if (!m1) { m1 = new Map(); m0.set(so, m1)}
        let s: Set<string> = m1.get(id)
        if (!s) { s = new Set(); m1.set(id, s)}
        s.add(pid)
      }
    }
  }
  session.setDefsXref(m0)
}

/* versions d'une souscription: sur le serveur, détenue localement
si versions[0] === versions[1] la souscription est à jour en session 
*/
export type versions = [number, number]

export type $SubsObj = {
  sessionId: string
  subJSON: string
  url: string
  title: string
  defs: string[]
  msgs: Object
}

/* Classe immutable de définition d'un document ou d'une collection */
export class $Def {
  /* 1: docCl/pk : le document de classe docCl de clé pk
    2: docCl : la collection des documents de classe docCl
    3: docCl/colName/pk : la collection des documents de classe docCl 
    dont la propriété colName vaut pk
  */
  readonly type: number
  readonly docCl: string
  readonly pk?: string
  readonly colName?: string

  get definition () : string {
    return this.type === 2 ? this.docCl : 
      (this.type === 1 ? this.docCl + '/' + this.pk : this.docCl + '/' + this.colName + '/' + this.pk)
  }

  get isColl () { return this.type !== 1 }
  colClass (svc: string) : string{ 
    const dd = DocDescriptor.get(svc + '$' + this.docCl)
    return dd ? dd.colClass(this.colName) : '' 
  }
  
  constructor (definition: string) {
      const defx = definition.split('/')
      this.type = defx.length === 1 ? 2 : (defx.length === 2 ? 1 : 3)
      this.docCl = defx[0]
      if (this.type !== 2) this.pk = this.type === 1 ? defx[1] : defx[2]
      if (this.type === 3) this.colName = defx[1]
  }
}

/* Classe immutable de définition d'un périmètre
id est de la forme: docCl@code/docPk OU de la forme docCl/docPk
*/
export class $Perimeter {
  readonly svc: string
  readonly org: string

  readonly docCl: string
  readonly code: string
  readonly docPk: string 

  readonly role: string
  readonly plane: boolean
  readonly _name: string
  readonly defs: $Def[]

  get id () { return this.code + '/' + this.docCl + '/' + this.docPk }

  credential () { 
    const session = stores.session
    if (session.planeMode) return null
    const sf = stores.safe
    return sf.myCredOfDoc(this.svc, this.org, this.docCl, this.docPk)
  }

  get name () { 
    const c = this.credential()
    return c ? c.name : this._name }

  constructor (svc: string, org: string, code: string, docCl: string, docPk: string, 
    role: string, plane: boolean, definitions: string[], name: string) {
    this.svc = svc; this.org = org
    this.docCl = docCl; this.code = code; this.docPk = docPk
    this.role = role; this.plane = plane || false; this.defs = []
    this._name = name
    for(const d of definitions) this.defs.push(new $Def(d))
  }

  toObj () {
    const obj = { docCl: this.docCl, code: this.code, docPk: this.docPk,
      role: this.role, plane: this.plane, name: this._name || '?', defs: [] }
    for(const def of this.defs) obj.defs.push(def.definition)
    return obj
  }

}

/* Classe immuable après construction / setDef - Souscription d'une organisation */
export class $Subs extends $Document {
  title: string = '' // titre des notifications web-push
  msgs: Object = {} // messages des définitions
  // { def: msg ... } - def: sa définition. msg: est un message ou ''
  url: string = '' // url de l'application à ouvrir par le terminal sur web-push
  defs: string[] = [] // définitions de la souscription

  /* Mise à jour d'une souscription enregistrée: possibilités ...
  - setTitle, setUrl, setDef  */
  setTitle (title: string) { this.title = title; return this }

  setUrl (url: string) { this.url = url; return this}

  setDef (def: $Def, msg?: string) {
    const i = this.defs.indexOf(def.definition)
    if (i === -1) this.defs.push(def.definition)
    if (msg) this.msgs[def.definition] = msg
    return this
  }

  /* Enregistrement de la souscription au serveur */
  async subscribe (svc: string, org: string, longLife: boolean) : Promise<boolean> {
    const session = stores.session
    const config = stores.config
    const op = new Operation('FW$setSubscription', svc, org)
    try {
      op.args.subscription = {
        sessionId: session.sessionId,
        subJSON: session.subJSON,
        url: this.url || config.location,
        title: this.title || (config.K.APPNAME + ' - ' + op.args.org),
        defs: this.defs,
        msgs: this.msgs
      }
      op.args.longLife = longLife
      const res = await op.post()
      return true
    } catch(e) {
      await op.ko(e)
      return false
    }
  }
  
}

export class $SubsGenerator extends $ADocument {
  subs: $Subs
  svc: string
  org: string
  creds: Map<string, $Credential>
  pref: Object
  roles: Set<string> = new Set()

  init (svc: string, org: string) {
    this.svc = svc    
    this.org = org
    this.creds = stores.safe.mySimpleCreds(svc, org)

    const session = stores.session
    for(const x of session.orgRoles) {
      const i = x.indexOf('/')
      if (x.substring(0, i) === org) this.roles.add(x.substring(i + 1))
    }
    this.pref = session.currentPref || {}
    
    this.subs = new $Subs()
    return this
  }

  credOf (docCl: string, pk: string) : $Credential | null {
    for(const [,c] of this.creds)
      if (c.docCl === docCl && c.docPk === pk) return c
    return null
  }

  processPerimeters (lp: $Perimeter[]) {
    for(const p of lp)
      for(const def of p.defs) this.subs.setDef(def)
  }
}

class $DefSigner {
  svc: string
  creds: Map<string, $Credential> 

  constructor (svc: string, org: string) {
    this.svc = svc
    this.creds = new Map()
    const sc = stores.safe.mySimpleCreds(svc, org)
    for(const [ ,c] of sc)
      this.creds.set(c.docCl + '/' + c.docPk, c)
  }

  getCred (def: $Def): $Credential {
    switch (def.type) {
      case 1 : return this.creds.get(def.definition)
      case 2 : return this.creds.get(def.docCl + '/1')
      case 3 : return this.creds.get(def.colClass(this.svc) + '/' + def.pk)
    }
  }

}

/* Les appels à FW$Sync se font à deux occasions:
- pour charger des documents / collections A LA PREMIERE demande 
  au cours de la session, APRES avoir déclaré les souscriptions
- sur réception d'une notification
L'appel est STRICTEMENT SERIALISE: des appels parallèles conduiraient
à des corruptions de données (principalement les collections).

FW$Sync : synchronise les defs des souscriptions citées 
- toSync = SubsToSync[]
subsToSync = {
  def: string, 
  v: number - version la plus récente détenue en session
    - si v == 0, INTEGRALE, sinon INCREMENTALE
}
Pour chaque 'def' retourne la sous-collection 'clazz/colName/colValue' 
des documents par exemple: 
  - type 0: Auteur : collection de 0-N éléments.
  - type 1: Auteur/sh(Zola) : 0-1 élément.
  - type 2: Article/auteurs/sh(Zola) : collection de 0-N éléments.
- pour chaque def d'entrée, un élément syncs[def] est retourné
  - type 0 et 2: { incr, v, datas: Uint8Array[], datasD: Uint8Array[], datasM: Uint8Array[] } 
  - type 1: { incr, v, data: Uint8Array | null } datas 0 ou 1 élément

- INTEGRALE: tous les éléments connus actuellement.
  - pour le type 1 
    - le document n'existe PAS : v == 0, data: absent
    - le document existe : v: sa version data: son contenu
  - pour les types 0 et 2 
    - la collection est vide : v == 0 (datas moved deleted sont absents)
    - la collection n'est PAS vide:
      - datas : liste des contenus des documents
      - v : version du document le plus récent de datas

- INCREMENTAL, liste des changements depuis vs:
  - pour le type 1
    - document ayant disparu DEPUIS vs: v version de disparition, data: null
    - document ayant changé (pas disparu): v est sa version, data: son contenu
    - document inchangé: v: 0
  - pour les types 0 et 2, 
    - collection inchangée: v: 0 (datas dels sont absents)
    - collection changée: v et 1 à 3 listes
      - v : version du changement le plus récent
      - datas : [Uint8Array]
        - ceux ajoutés à la collection depuis vs avec leur data complète
        - ceux qui sont dans la collection et ont changé depuis vs avec data complète
      - moved : [Uint8Array] type 2 seulement
        - ceux ayant quitté la collection depuis vs avec leur data complète
      - deleted : couples des [pk, v] des documents supprimés 
        où v est leur dh de supression

Retour:
- syncs[def]: { v, data: Uint8Array[], 
  datas: Uint8Array[], moved :Uint8Array[], deleted: [[pk, v], ...]}
  - si v == -1: credential non trouvé (autres éléments null)
- now : date-heure de l'opération IMPORTANTE. C'est la dh d'ASSERTION,
  à cette date-heure l'image de la collection est celle-ci.
*/
export class FW$Sync {
  svc: string
  op: Operation
  signer: $DefSigner
  creds: $Credential[] = []

  constructor (svc: string, org: string) {
    this.svc = svc
    this.op = new Operation('FW$Sync', svc, org)
    this.signer = new $DefSigner(svc, org)
    this.op.args.toSync = []
  }

  // Retourne true si un credential existe
  addDef (def: $Def, v: number) : boolean {
    const cred = this.signer.getCred(def)
    if (cred) {
      this.creds.push(cred)
      this.op.args.toSync.push({ def: def.definition, v })
      return true
    } else return false
  }


  async post () : Promise<[number, Object]> {
    try {
      for(const cred of this.creds)
        await this.op.sign(cred)
      const res = await this.op.post()
      return [res.now, res.syncs]
    } catch (e) {
      await this.op.ko(e, this.svc)
      return [0, null]
    }
  }
}
