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
const regbag = /^[$][a-zA-Z_$0-9]*$/
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
  static readonly types = new Map<string, DocType>()
  static getType (dt: string) { return DocType.types.get(dt)}

  readonly name: string
  readonly keys : props[]
  readonly indexes: idx[]

  constructor (name: string, keys?: props[], indexes?: idx[]) {
    this.name = name
    this.keys = keys && keys.length ? keys : null
    this.indexes = indexes && indexes.length ? indexes : null
    const err = this.checks()
    if (err) throw Error(err)
    DocType.types.set(name, this)
  }

  get isSingleton () { return !this.keys }

  checks () {
    if (!isDocName(this.name)) return 'invalid document name: ' + this.name
    if (DocType.types.has(this.name)) return 'duplicate name: ' + this.name
    if (this.isSingleton)
      return !this.indexes ? false : 'singletons cannot have indexes: ' + this.name
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
  static readonly types = new Map<string, CredType>()
  static getType (cr: string) { return CredType.types.get(cr)} 

  readonly name : string // nom du type de credential
  readonly props : props // liste des propriétés constructives
  readonly nbpk : number // nombre de celles-ci étant clés

  constructor (name: string, props: props, nbpk: number) {
    this.name = name
    this.props = props && props.length ? props : null
    this.nbpk = nbpk
    const err = this.checks()
    if (err) throw Error(err)
    CredType.types.set(name, this)
  }

  get isSingleton () { return !this.nbpk }

  checks () {
    if (!isDocName(this.name)) return 'invalid credential name: ' + this.name
    if (CredType.types.has(this.name)) return 'duplicate credential name: ' + this.name
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

  checks () {
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
      if (selk === undefined)
        return 'missing selection key for type [' + dt.name + '] in bag : ' + this.name
      const px = dt.keys[selk]
      if (px.length !== pks.size) return 'invalid selection key length [' + selk + '] for document type [' + dt.name + '] in bag : ' + this.name
      for (const p of px) {
        if (!pks.has(p)) return 'selection key [' + selk + '] for document type [' + dt.name + '] has property [' + p + '] not in keys of bag : ' + this.name
      }
    }
  }
}

/*
// Variable d'activité : nom, type de donées, liste ou non
export type actVar = [ n: string, t: varType, lst: boolean ]

export enum activityVarType { STRING, LSTRING, LTUPLE }

export type dtTypeLst = { t: BagType, lst: boolean }

export class ActivityType {
  static readonly types = new Map<string, ActivityType>()

  readonly name : string // classe de l'activité
  readonly pkey : props // liste des noms des propriétés clés
  readonly vcst : props // liste des noms des propriétés immuables
  readonly vars : actVar[] // liste et type des variables (nom, varType, estListe) ???
  readonly creds: Map<String, CredType> // map des types de credentials à générer
  readonly dttypes: Map<String, dtTypeLst> // map des types de fils gérés par l'activité (liste ou non)

  constructor (name: string, pkey: props, vcst: props, vars: actVar[], creds: string[], dttypes: string[]) {
    this.name = name
    this.pkey = pkey && pkey.length ? pkey : null
    this.vcst = vcst && vcst.length ? vcst : null
    this.creds = new Map<String, CredType>()
    creds.forEach(cr => { this.creds.set(cr, CredType.getType(cr)) })
    this.dttypes = new Map<String, dtTypeLst>()
    dttypes.forEach(dt => { 
      if (dt.startsWith('*')) this.dttypes.set(dt.substring(1), { t: DTType.getType(dt.substring(1)), lst: true})
      else this.dttypes.set(dt, { t: DTType.getType(dt), lst: false}) 
    })
    // const err = this.checks()
    // if (err) throw Error(err)
    ActivityType.types.set(name, this)
  }

}
*/

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
  CART: new DocType('CART', [['gp', 'pr', 'livr', 'gc'], ['gp', 'livr', 'gc'], ['gp', 'pr'], ['gr', 'livr']]),
  CHL: new DocType('CHL', [['gp', 'livr'], ['gp']]),
  CHD: new DocType('CHD', [['gp', 'livr', 'gc'], ['gp', 'livr'], ['gp', 'gc']]),
  CHCO: new DocType('CHCO', [['gc']]),
  CHPR: new DocType('CHPR', [['gp']])
}

export const CredTypes = {
  CO: new CredType('CO', ['gc', 'co', 'initials', 'pwd'], 2),
  GC: new CredType('GC', ['gc', 'initials', 'pwd'], 1)
}

//  constructor (name: string, pkeys: props, credFilters: credFilterArg[], docbags: docbag[]) {

export const BagTypes = {
  CMDGC: new BagType('CMDGC', ['gc', 'gp', 'livr', 'initials', 'pwd'], 
    new Map([[CredTypes.CO, ['gc']], [CredTypes.GC, ['gc']]]),
    new Map([[DocTypes.BCG, 0], [DocTypes.CART, 1], [DocTypes.BCC, 1]]))
}
