// @ts-ignore
import { encode } from '@msgpack/msgpack'

// Liste ordonnnée de noms de propriétés identifiantes
export type props = string[]

// Type de variable : INTEGER correspond à un int 32 bits
export enum varType { STRING, INTEGER, FLOAT }

// Index spécifique d'un document : nom, type de valeur
export type idx = [ string, varType ]

const regvar = /^[a-z][a-zA-Z0-9]*$/
export function isVarName (n: string) { return regvar.test(n)}
const regdoc = /^[A-Z][a-zA-Z_$0-9]*$/
export function isDocName (n: string) { return regdoc.test(n)}
const regbag = /^[A-Z][a-zA-Z_$0-9]*$/
export function isBagName (n: string) { return regbag.test(n)}

/* Un type de document est défini par:
- son nom: nom de la classe qui l'implémente
- ses clés (nommées 0 à N) : chaque clé est une liste de propriétés identifiantes
  - keys[0] est la clé primaire, keys[1...] sont les clés secondaires
  - en l'absence de keys, c'est un singleton
  - les propriétés citées en clés secondaires font partie de la clé primaire
  Un index N définit une sous-collection de documents.
- ses indexes éventuels. Chaque index a pour nom celui d'UNE propriété du document.
  - son type peut être STRING, INTEGER, FLOAT
*/
export class DocType {

  readonly name: string
  readonly keys : props[]
  readonly indexes: idx[]
  readonly err: string

  constructor (name: string, keys?: props[], indexes?: idx[]) {
    this.name = name
    this.keys = keys && keys.length ? keys : []
    this.indexes = indexes && indexes.length ? indexes : []
    this.err = this.checks()
  }

  get isSingleton () { return !this.keys.length }

  checks () : string {
    if (!isDocName(this.name)) return 'invalid document name: ' + this.name
    if (this.isSingleton && this.indexes.length)
      return 'singletons cannot have indexes: ' + this.name
    const ps0 = new Set()
    for (let i = 0; i < this.keys.length; i++) {
      const props = this.keys[i]
      const ps = new Set()
      for (const p of props) {
        if (!isVarName(p)) return 'invalid property name [' + p +'] in key [' + i + '] : ' + this.name
        if (ps.has(p)) return 'duplicate property name [' + p +'] in key [' + i + '] : ' + this.name
        if (i === 0) ps0.add(p)
        else {
          if (!ps0.add(p)) return 'property [' + p +'] in key [' + i + '] not in primary key : ' + this.name
          ps.add(p)
        }
      }
    }
    for (let i = 0; i < this.indexes.length; i++) {
      const [ name, varType ] = this.indexes[i]
      if (!isVarName(name)) return 'invalid index property name [' + name +'] ' + this.name
      if (ps0.has(name))
        return 'index property [' + name +'] cannot bue in primary key : ' + this.name
    }
  }
}

/* Un type de credential est défini par:
- son nom, celui de sa classe
- la liste des arguments du constructeur d'un credential. 
- les nbpk premiers arguments son identifiants.
Un credential comporte deux parties:
- une partie immable après création, tout credential peut être vérifié depuis ces éléments.
- une partie optionnelle retournée par un serveur validante du credential.
Cette partie permet à un serveur de valider à moindre coût un credential présenté,
sachant que si elle est absente ou non acceptable, la validation se fait
sur la partie immuable.
*/
export class CredType {

  readonly name : string // nom du type de credential
  readonly props : props // liste des propriétés constructives
  readonly nbpk : number // nombre de celles-ci étant clés
  readonly err : string

  constructor (name: string, props: props, nbpk: number) {
    this.name = name
    this.props = props && props.length ? props : []
    this.nbpk = nbpk
    this.err = this.checks()
  }

  get isSingleton () { return !this.nbpk }

  checks () : string {
    if (!isDocName(this.name)) return 'invalid credential name: ' + this.name
    if (this.nbpk < 0 || this.nbpk > this.props.length)
      return 'invalid key properties number [' + this.nbpk + '] for credential : ' + this.name
  }
}

export type credFilters = Map<CredType, props>

// Constituant d'un bag : type de document, clé de sélection d'appartenance au bag
export type docInBag = Map<DocType, number>

/* Un type de bag est défini par:
- son nom
- la liste des noms des propriétés constructives / identifiantes
- une liste des types de credential acceptables et pour chacun la ou les proprités identifiantes
requises. Pour lire / s'abonner à un bag, l'application terminale doit
fournir dans son opération au moins un credential répondant à cette liste.
- la liste des types de documents pouvant appartenir au bag
  - pour chaque type son numéro de clé de sélection
  - pour un type singleton 0 par convention
*/
export class BagType {

  readonly name : string
  readonly pkeys : props
  readonly credFilters : credFilters // credentials acceptables
  // Pour chaque type de document participant, ses ou ses numéros de  clés de sélection
  readonly docTypes : docInBag
  readonly err : string

  constructor (name: string, pkeys: props, credFilters: credFilters, docTypes: docInBag) {
    this.name = name
    this.pkeys = pkeys && pkeys.length ? pkeys : []
    this.credFilters = credFilters
    this.docTypes = docTypes
    this.err = this.checks()
  }

  get isSingleton () { return this.pkeys.length === 0 }

  checks () : string {
    if (!isBagName(this.name)) return 'invalid bag name: ' + this.name
    const pks = new Set()
    for(let i = 0; i < this.pkeys.length; i++) {
      const p = this.pkeys[i]
      if (!isVarName(p)) return 'invalid property name [' + p + '] in key of bag : ' + this.name
      if (pks.has(p)) return 'duplicate property name [' + p + '] in bag : ' + this.name
      pks.add(p)
    }

    for (const [ct, props] of this.credFilters) {
      for(const p of props) {
        if (ct.props.indexOf(p) === -1) 
          return 'invalid credential argument [' + p + '] of credentiel [' + ct.name + '] for bag : ' + this.name
        if (!pks.has(p)) 
          return 'invalid credential argument [' + p + '] of credentiel [' + ct.name + '] for bag : ' + this.name
      }
    }

    const drn = new Set<DocType>()
    for (const [dt, selk] of this.docTypes) {
      if (drn.has(dt)) return 'duplicate document type [' + dt.name + '] in bag : ' + this.name
      drn.add(dt)
      if (selk === -1) {
        if (dt.isSingleton) continue
        else return 'missing selection key for type [' + dt.name + '] in bag : ' + this.name
      }
      const px = dt.keys[selk]
      if (px.length !== pks.size) return 'invalid selection key length [' + selk + '] for document type [' + dt.name + '] in bag : ' + this.name
      for (const p of px) {
        if (!pks.has(p)) return 'selection key [' + selk + '] for document type [' + dt.name + '] has property [' + p + '] not in keys of bag : ' + this.name
      }
    }
  }
}

export const DocTypes = {
  RG: new DocType('RG'),
  RC: new DocType('RC', [['gc']]),
  RP: new DocType('RP', [['gp']]),
  FGC: new DocType('FGC', [['gc']]),
  FCO: new DocType('FCO', [['gc', 'co'], ['gc'], ['co']]),
  FGP: new DocType('FGP', [['gp']]),
  FPR: new DocType('FPR', [['gp', 'pr'], ['gp'], ['pr']]),
  CATG: new DocType('CATG', [['gp']]),
  CATL: new DocType('CATL', [['gp', 'livr']]),
  CALG: new DocType('CALG', [['gp']]),
  LIVRG: new DocType('LIVRG', [['gp', 'livr'], ['gp']]),
  BCC: new DocType('BCC', [['gc', 'co', 'gp', 'livr'], ['gc', 'gp', 'livr'], ['gc', 'co', 'livr']]),
  BCG: new DocType('BCG', [['gc', 'gp', 'livr'], ['gc', 'gp'], ['gp', 'livr']]),
  CART: new DocType('CART', [['gp', 'pr', 'livr', 'gc'], ['gp', 'livr', 'gc'], ['gp', 'pr'], ['gp', 'livr']]),
  CHL: new DocType('CHL', [['gp', 'livr'], ['gp']]),
  CHD: new DocType('CHD', [['gp', 'livr', 'gc'], ['gp', 'livr'], ['gp', 'gc']]),
  CHCO: new DocType('CHCO', [['gc']]),
  CHPR: new DocType('CHPR', [['gp']])
}

export const CredTypes = {
  CO: new CredType('CO', ['gc', 'co', 'initials', 'pwd'], 2),
  GC: new CredType('GC', ['gc', 'initials', 'pwd'], 1),
  GP: new CredType('GP', ['gp', 'initials', 'pwd'], 1)
}

//  constructor (name: string, pkeys: props, credFilters: credFilterArg[], docbags: docbag[]) {

const ALLCRED = new Map([[CredTypes.GP, []], [CredTypes.GC, []], [CredTypes.CO, []]])
const CREDGCCO = new Map([[CredTypes.CO, ['gc']], [CredTypes.GC, ['gc']]])

export const BagTypes = {
  // commande d'un groupe gc à un groupement gp pour une livraison livr
  CMDGC: new BagType('CMDGC', ['gc', 'gp', 'livr'], 
    new Map([[CredTypes.CO, ['gc']], [CredTypes.GC, ['gc']]]),
    new Map([[DocTypes.BCG, 0], [DocTypes.CART, 1], [DocTypes.BCC, 1]])),

  // commandes d'un consommateur gc co pour une livraison livr (tous groupements confondus)
  BCC: new BagType('BCC', ['gc', 'co', 'livr'],
    CREDGCCO,
    new Map([[DocTypes.BCC, 2]])),
  
  // commandes d'un groupe gc à un groupement gp
  CMDOV: new BagType('CMDOV', ['gc', 'gp'],
    new Map([[CredTypes.GP, ['gp']], [CredTypes.GC, ['gc']]]),
    new Map([[DocTypes.BCG, 1]])),

  // calendrier des livraisons d'un groupement gp
  CALGP: new BagType('CALGP', ['gp'],
    ALLCRED,
    new Map([[DocTypes.CALG, 0], [DocTypes.LIVRG, 1], [DocTypes.CHL, 1]])),
  
  // commandes à un groupement gp pour une livraison livr
  CMDGP: new BagType('CMDGP', ['gp', 'livr'],
    ALLCRED,
    new Map([[DocTypes.CHD, 1], [DocTypes.BCG, 2], [DocTypes.CART, 3]])),

  // répertoire général des groupes et groupements
  RG: new BagType('RG', [], ALLCRED, new Map([[DocTypes.RG, -1]])),

  // fiche d'un groupe gc, ses consommateurs, son chat 
  RGC: new BagType('RGC', ['gc'],
    CREDGCCO,
    new Map([[DocTypes.RC, 0], [DocTypes.CHCO, 0], [DocTypes.FGC, 0], [DocTypes.FCO, 1]])),

  // fiche du consommateur gc co
  FCO: new BagType('FCO', ['gc', 'co'],
    new Map([[CredTypes.CO, ['gc', 'co']], [CredTypes.GC, ['gc']]]),
    new Map([[DocTypes.FCO, 0]])),
  
  // 
  CHD: new BagType('CHD', ['gp', 'gc'],
    CREDGCCO,
    new Map([[DocTypes.CHD, 2]])),
  
}

export function compileReport () {
  let n = 0
  for (const [k, v] of Object.entries(DocTypes)) { 
    if (k !== v.name) { n++ ; console.log('names mismatch [' + k + ' / ' + v.name + ']')}
    if (v.err) { console.log(v.err); n++ } 
  }
  for (const [k, v] of Object.entries(CredTypes)) { 
    if (k !== v.name) { n++ ; console.log('names mismatch [' + k + ' / ' + v.name + ']')}
    if (v.err) { console.log(v.err); n++ } 
  }
  for (const [k, v] of Object.entries(BagTypes)) { 
    if (k !== v.name) { n++ ; console.log('names mismatch [' + k + ' / ' + v.name + ']')}
    if (v.err) { console.log(v.err); n++ } 
  }
  return n
}

export class Cred {
  static readonly credentials = new Map<string, Cred>()

  readonly id : string
  readonly type: CredType
  readonly org : string
  readonly keys : string[]

  constructor (ct: CredType, org: string, keys: string[]) {
    this.id = [ct.name, org, ...keys].join('/')
    this.type = ct
    this.org = org
    this.keys = keys
    Cred.credentials.set(this.id, this)
  }
}

export class CREDCO extends Cred {

  readonly gc : string
  readonly co : string
  initials : string
  pwd : string

  constructor (ct: CredType, org: string, gc: string, co: string, initials: string, pwd: string) {
    super(ct, org, [gc, co])
    this.initials = initials
    this.pwd = pwd
  }

}

export class Activity {
  static readonly activities = new Map<string, Activity>()
  
  readonly id : string
  readonly type : string
  readonly org : string
  readonly keys : string[]

  credentials : Cred[]

  constructor (type: string, org: string, keys: string[]) {
    this.id = [type, org, ...keys].join('/')
    this.type = type
    this.org = org
    this.keys = keys
    this.credentials = []
    Activity.activities.set(this.id, this)
  }

  getCred (type: string) : Cred {
    for(const c of this.credentials) if (c.type.name === type) return c
    return null
  }

}

export type gplivr = {
  gp : string,
  livr : string
}

export class ActCMDCO extends Activity {

  readonly gc : string
  readonly co : string

  lgp : string[]
  lx : gplivr[]

  constructor (type: string, org: string, gc: string, co: string, initials: string, pwd: string) {
    super(type, org, [gc, co])
    this.gc = gc
    this.co = co
    this.lgp = []
    this.lx = []
    this.credentials.push(new CREDCO(CredTypes.CO, org, gc, co, initials, pwd))
  }

  genBagSubs () : BagSub[] {
    const l : BagSub[] = []
    l.push(new BagSub(BagTypes.RG, this.org, []))
    l.push(new BagSub(BagTypes.RGC, this.org, [this.gc]))
    l.push(new BagSub(BagTypes.FCO, this.org, [this.gc, this.co]))
    for (const gp of this.lgp) {
      l.push(new BagSub(BagTypes.CALGP, this.org, [gp]))
      l.push(new BagSub(BagTypes.CHD, this.org, [gp, this.gc]))
    }
    for (const {gp, livr} of this.lx) {
      l.push(new BagSub(BagTypes.CMDGC, this.org, [this.gc, gp, livr]))
    }
    return l
  }

}

export class BagSub {
  private static next = 0
  static readonly list : BagSub[] = []
  static readonly all = new Map<string, number>()

  static get (bt: BagType, org: string, keys: string[], exclDT?: DocType[]) {
    const x = new BagSub(bt, org, keys, exclDT)
    return BagSub.list[x.idx]
  }

  static getFromId (id: string) {
    const idx = BagSub.all.get(id)
    return idx ? BagSub.list[idx] : null
  }

  readonly type : string
  readonly org : string
  readonly keys : string[]
  readonly exclDT : string[]
  // id: type/org/k0/k1/..@dt0/dt1/... (@... absent si pas d'exclusion de DocType)
  readonly id : string
  // index local en session
  readonly idx : number 

  constructor (bt: BagType, org: string, keys: string[], exclDT?: DocType[]) {
    this.type = bt.name
    this.org = org
    this.keys = keys
    if (exclDT) { 
      this.exclDT = []
      exclDT.forEach(t => { this.exclDT.push(t.name) })
      this.exclDT.sort()
    }
    this.id = this.type + '/' + this.org + keys.join('/') + (exclDT ? '@' + this.exclDT.join('/') : '')
    let idx = BagSub.all.get(this.id)
    if (!idx) {
      idx = BagSub.next++
      BagSub.all.set(this.id, idx)
      BagSub.list[idx] = this
    }
    this.idx = idx
  }


}
