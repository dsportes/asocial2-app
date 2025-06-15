
export type props = string[]
export type idx = [ string, varType ]
export type docref = [ string, number ]
export type actVar = [ n: string, t: varType, lst: boolean ]

export enum varType { STRING, INTEGER, FLOAT }
export enum activityVarType { STRING, LSTRING, LTUPLE }

const regvar = /^[a-z][a-zA-Z0-9]*$/
export function isVarName (n: string) { return regvar.test(n)}
const regdoc = /^[A-Z][a-zA-Z_$0-9]*$/
export function isDocName (n: string) { return regdoc.test(n)}
const regdt = /^[$][a-zA-Z_$0-9]*$/
export function isDTName (n: string) { return regdt.test(n)}

/* Un type de document est défini par:
- son nom: nom de la classe qui l'implémente
- ses clés: chaque clé est une liste de propriétés identifiantes
  - elles sont nommées 0 à N
  - keys[0] est la clé primaire
- ses indexes. Chaque index a pour nom celui d'une propriété du document.
  - la propriété peut être calculée (un get)
  - elle de type string / integer / float
*/

export class DocType {
  static readonly types = new Map<string, DocType>()
  static getType (d: string) { return DocType.types.get(d)}

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
  }
}

export type docKey = [ DocType, number ]

export class DTType {
  static readonly types = new Map<string, DTType>()
  static getType (dt: string) { return DTType.types.get(dt)} 

  readonly name : string
  readonly pkey : props
  readonly docsKeys : Map<string, docKey> // docKey : DocType, index

  constructor (name: string, pkey: props, docrefs: docref[]) {
    this.name = name
    this.pkey = pkey && pkey.length ? pkey : null
    this.docsKeys = new Map<string, docKey>()
    docrefs.forEach(dr => { this.docsKeys.set(dr[0], [ DocType.getType(dr[0]), dr[1] ])})
    const err = this.checks(docrefs)
    if (err) throw Error(err)
    DTType.types.set(name, this)
  }

  get isSingleton () { return !this.pkey }

  checks (docrefs) {
    if (!isDTName(this.name)) return 'invalid document thread name: ' + this.name
    if (DTType.types.has(this.name)) return 'duplicate name: ' + this.name
    const pks = new Set(); this.pkey.forEach(p => { pks.add(p) })
    const drn = new Set()
    for (const [d, i] of docrefs) {
      const dt = DocType.getType(d)
      if (!dt) return 'unknown document type [' + d + '] in document thread : ' + this.name
      const px = dt.keys[i]
      if (!px) return 'no index [' + i + '] for document type [' + d + '] in document thread : ' + this.name
      if (px.length !== pks.size) return 'index [' + i + '] for document type [' + d + '] not compatible with keys of document thread : ' + this.name
      for (const p of px) {
        if (!pks.has(p)) return 'index [' + i + '] for document type [' + d + '] not compatible with keys of document thread : ' + this.name
      }
      if (drn.has(d)) return 'duplicate document reference [' + d + '] in document thread : ' + this.name
      drn.add(d)
      this.docsKeys.set(d, [dt, i])
    }
  }
}

export class CredType {
  static readonly types = new Map<string, CredType>()
  static getType (cr: string) { return CredType.types.get(cr)} 

  readonly name : string // nom du type de credential
  readonly pkey : props // liste des noms des propriétés clés

  constructor (name: string, pkey: props) {
    this.name = name
    this.pkey = pkey && pkey.length ? pkey : null
    // const err = this.checks()
    // if (err) throw Error(err)
    CredType.types.set(name, this)
  }

}

export type dtTypeLst = { t: DTType, lst: boolean }

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
  new DTType('$CMDGC', ['gc', 'gp', 'livr'], [['BCG', 0], ['CART', 1], ['BCC', 1]])
} catch (e) {
  console.log(e)
}
