// Liste ordonnnée de noms de propriétés identifiantes
export type props = string[]

// Type de variable : INTEGER correspond à un int 32 bits
export enum varType { STRING, INTEGER, FLOAT }

// Index spécifique d'un document : nom, type de valeur
export type idx = [ string, varType ]

// Constituant d'un bag : type de document, clé de sélection d'appartenance au bag
export type docbag = [ string, number ]

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

/* Un type de bag est défini par:
- son nom
- la liste des noms des propriétés constructives
- le nombre de celles-ci étant clé : si 0, le bag est un singleton
- le type de credential et la liste des propriétés ci-dessus en paramètres de son constructeur
- la liste des types de documents pouvant appartenir au bag
  - pour chaque type son numéro de clé de sélection
  - pour un type singleton 0 par convention
*/
export class BagType {
  static readonly types = new Map<string, BagType>()
  static getType (bt: string) { return BagType.types.get(bt)} 

  readonly name : string
  readonly props : props
  readonly nbpk : number // nombre de celles-ci étant clés
  readonly credType : CredType // type de credential associé
  readonly credArgs : string[] // varaibles de son constructeur
  // Pour chaque type de document participant, ses ou ses numéros de  clés de sélection
  readonly docTypes : Map<DocType, number>

  constructor (name: string, props: props, nbpk: number, credName: string, credArgs: string[], docbags: docbag[]) {
    this.name = name
    this.props = props && props.length ? props : []
    this.nbpk = nbpk
    this.credType = CredType.getType(credName)
    this.credArgs = credArgs
    this.docTypes = new Map<DocType, number>()

    const err = this.checks(credName, docbags)
    if (err) throw Error(err)
    BagType.types.set(name, this)
  }

  get isSingleton () { return !this.nbpk }

  checks (credName: string, docbags: docbag[]) {
    if (!isBagName(this.name)) return 'invalid bag name: ' + this.name
    if (BagType.types.has(this.name)) return 'duplicate bag name: ' + this.name
    if (this.nbpk < 0 || this.nbpk > this.props.length)
      return 'invalid key properties number [' + this.nbpk + '] for bag : ' + this.name
    const pks = new Set()
    const vs = new Set()
    for(let i = 0; i < this.props.length; i++) {
      const p = this.props[i]
      if (!isVarName(p)) return 'invalid property name [' + p + '] in key of bag : ' + this.name
      if (vs.has(p)) return 'duplicate property name [' + p + '] in bag : ' + this.name
      vs.add(p)
      if (i < this.nbpk) pks.add(p)
    }

    if (!this.credType) 
      return 'invalid credential type [' + credName + '] in bag : ' + this.name
    if (this.credArgs.length !== this.credType.props.length)
      return 'invalid credential argument list for bag : ' + this.name
    for(const p of this.credArgs) {
      if (!vs.has(p)) return 'invalid credential argument [' + p + '] for bag : ' + this.name
    }

    const drn = new Set<DocType>()
    for (const [n, selk] of docbags) {
      const dt = DocType.getType(n)
      if (!dt) return 'unknown document type [' + n + '] in bag : ' + this.name
      if (drn.has(dt)) return 'duplicate document type [' + n+ '] in bag : ' + this.name
      drn.add(dt)

      if (this.isSingleton) {
        this.docTypes.set(dt, 0)
        continue
      }
      if (selk === undefined)
        return 'missing selection key for type [' + n + '] in bag : ' + this.name
      const px = dt.keys[selk]
      if (!px) return 'invalid selection key [' + selk + '] for document type [' + n + '] in bag : ' + this.name
      if (px.length !== pks.size) return 'invalid selection key length [' + selk + '] for document type [' + n + '] in bag : ' + this.name
      for (const p of px) {
        if (!pks.has(p)) return 'selection key [' + selk + '] for document type [' + n + '] has property [' + p + '] not in keys of bag : ' + this.name
      }
      this.docTypes.set(dt, selk)
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

try {
  new DocType('RG')
  new DocType('RC', [['gc']])
  new DocType('RP', [['gp']])
  new DocType('FGC', [['gc']])
  new DocType('FCO', [['gc', 'co'], ['gc'], ['co']])
  new DocType('FGP', [['gp']])
  new DocType('FPR', [['gp', 'pr'], ['gp'], ['pr']])
  new DocType('CATG', [['gp']])
  new DocType('CATL', [['gp', 'livr']])
  new DocType('CALG', [['gp']])
  new DocType('LIVRG', [['gp', 'livr'], ['gp']])
  new DocType('BCC', [['gc', 'co', 'gp', 'livr'], ['gc', 'gp', 'livr'], ['gc', 'co', 'livr']])
  new DocType('BCG', [['gc', 'gp', 'livr'], ['gc', 'gp'], ['gp', 'livr']])
  new DocType('CART', [['gp', 'pr', 'livr', 'gc'], ['gp', 'livr', 'gc'], ['gp', 'pr'], ['gr', 'livr']])
  new DocType('CHL', [['gp', 'livr'], ['gp']])
  new DocType('CHD', [['gp', 'livr', 'gc'], ['gp', 'livr'], ['gp', 'gc']])
  new DocType('CHCO', [['gc']])
  new DocType('CHPR', [['gp']])
} catch (e) {
  console.log(e)
}

try {
  new CredType('CREDCO', ['gc', 'co', 'initials', 'pwd'], 2)
} catch (e) {
  console.log(e)
}

//   constructor (name: string, props: props, nbpk: number, credName: string, credArgs: string[], docbags: docbag[]) {

try {
  new BagType('$CMDGC', ['gc', 'gp', 'livr', 'co', 'initials', 'pwd'], 2, 
    'CREDCO', ['co', 'initials', 'pwd'],
    [['BCG', 0], ['CART', 1], ['BCC', 1]])
  
} catch (e) {
  console.log(e)
}
