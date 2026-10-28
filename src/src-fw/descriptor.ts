import { Crypt } from './crypt'
import { AppExc } from './log'

export type DocId = {
  svc: string, docCl: string, subCl: string
}

// Liste ordonnnée de noms de propriétés identifiantes
export type props = string[]

/*
Enumérations:
- si enum existe -> donne l'énumération (string[])
- si enum n'existe pas, l'énumération est un singleton:
  - si enumCred est absent: singleton svc$name -> requireAdmin
  - si enumCred est présent: singleton svc$name_org
    enumCred est le docCl du credential requis pour maj (docPk: '1')
*/


/* Type d'index :
HASH : string, base64 du shaS(string[])
STRING : string
INTEGER : int 32 bits
FLOAT : double
LIST: string[]
*/
export enum propType { STRING, INTEGER, FLOAT, LIST, HASH }

/* Usage d'un index
SIMPLE : index simple, dans une organisation
GLOBAL : index global, toutes organisations (pour les tasks)
COL : collection (notifiable / synchronisable)
IMUTCOL : collection sur une propriété constante du document
*/
export enum idxUse { SIMPLE, GLOBAL, COL, IMUTCOL }

/* Index:
- type d'index
- true si l'index est global (trans organisation)
- testable: si true l'existence du document par cet "alias" A LE DROIT d'être testée
*/
export type idx = {
  type: propType
  global?: boolean
  key?: props
  testable?: boolean
  nohash?: boolean
}

export type collection = {
  key: props,
  mutable: boolean,
  list?: boolean,
  class: string
}

export type DocHeader = {
  pk?: props
  nohash?: boolean
  subClassBy?: string
  sync?: boolean
  embedCreds?: boolean // les credentials sont embarqués dans la propriété creds
  virtual?: boolean
}

export type EnumHeader = {
  enum?: string[]
  enumCred?: string
  virtual?: boolean
}

export class Descriptor {
  public static doc (svc: string, docCl: string, hdr: DocHeader,
    colls?: Map<string, collection>,
    indexes?: Map<string, idx> | null
  ) : Descriptor {
    let exc: AppExc | undefined = undefined
    const fullName = svc + '$' + docCl
    if (!Descriptor.services.has(svc)) 
      exc = new AppExc(3, 'unknown_service', 'Descriptor', [fullName])
    if (!exc && !Descriptor.isDocName(docCl)) 
      exc = new AppExc(3, 'doccl_syntax', 'Descriptor', [fullName])
    return new Descriptor(exc, svc, docCl, hdr, null, colls || null, indexes || null)
  }

  public static enum (svc: string, name: string, hdr: EnumHeader) : Descriptor {
    let exc: AppExc | undefined = undefined
    const fullName = svc + '$' + name
    if (!Descriptor.services.has(svc)) 
      exc = new AppExc(3, 'unknown_service', 'Descriptor', [fullName])
    if (!Descriptor.isDocName(name)) 
      exc = new AppExc(3, 'enum_name_syntax', 'Descriptor', [fullName])
    return new Descriptor(exc, svc, name, null, hdr, null, null)
  }

  static services: Set<string> = new Set()
  static registerService (svc: string) : void {
    if (!Descriptor.isSvcName(svc)) 
      throw new AppExc(3, 'service_name_syntax', 'Descriptor', [svc])
    Descriptor.services.add(svc)
  }
  static getServices () : string[] { return Array.from(Descriptor.services)}

  static readonly regvar = /^[a-z][a-zA-Z0-9]*$/
  static isVarName = (n: string) : boolean => { return Descriptor.regvar.test(n)}

  static readonly regdoc = /^[A-Z$][a-zA-Z0-9]*$/
  static isDocName = (n: string) : boolean => { return Descriptor.regdoc.test(n)}

  static readonly regsvc = /^[A-Z][a-zA-Z0-9]*$/
  static isSvcName = (n: string) : boolean => { return Descriptor.regsvc.test(n)}

  static readonly regsub = /^[a-zA-Z][a-zA-Z0-9]*$/
  static isSubName = (n: string) : boolean => { return Descriptor.regsvc.test(n)}

  readonly exc: AppExc | undefined = undefined
  readonly isDoc: boolean = true
  readonly virtual: boolean = false 
  readonly svc: string = ''
  readonly docCl: string = ''

  readonly pk: string[] = []
  readonly nohash: boolean = false
  readonly subClassBy: string = ''
  readonly sync: boolean = false
  readonly embedCreds: boolean = false// les credentials sont embarqués dans la propriété creds

  readonly colls : Map<string, collection> | null = null
  readonly indexes: Map<string, idx> | null = null

  readonly enum: string[] = []
  readonly enumCred: string = ''

  /* Retourne la valeur du pk d'une "source" ayant les propriétés citées dans pk */
  pkValue (src?: any, nohash?: boolean) : string {
    if (!this.pk || !this.pk.length || !src) return '1'
    let p = src['pk']
    if (p) return p
    const x: string[] = []
    if (src) this.pk.forEach(pr => { x.push(src[pr] || '') })
    p = x.join('/')
    return nohash || this.nohash ? p : Crypt.shaS(p)
  }

  colClass (name: string) {
    const c = this.colls ? this.colls.get(name) : undefined
    return c ? c.class : ''
  }

  isTestable (idxName: string) : boolean {
    const idx = this.indexes ? this.indexes.get(idxName) : undefined
    return !idx ? false : idx.testable || false
  }
 
  /* Retourne la valeur d'une collection name d'une "source" ayant les propriétés citées */
  getCollId (src: any, name: string) : string[] {
    const c = this.colls ? this.colls.get(name) : undefined
    if (!c) return []
    if (c.list) {
      const x: string[] = []
      const p = src[name] as string[]
      if (p) p.forEach(v => { if (v) x.push(Crypt.shaS(v))})
      return x
    }
    const x: string[] = []
    c.key.forEach(p => { x.push(src[p] || '') })
    return [Crypt.shaS(x.join('/'))]
  }

  /* Retourne la valeur d'un idx name d'une "source" ayant les propriétés citées */
  getIdx (src: any, name: string) : any {
    const i = this.indexes ? this.indexes.get(name) : undefined
    if (!i) return null
    const key0 = i.key ? i.key[0] : name
    const v0 = src[key0]
    switch (i.type) {
      case propType.STRING : { return v0 || '' }
      case propType.INTEGER : { return v0 || 0 }
      case propType.FLOAT : { return v0 || 0 }
      case propType.HASH : {
        const x = []
        if (i.key) i.key.forEach(p => { x.push(src[p] || '') })
        else x.push(src[name] || '')
        return Crypt.shaS(x.join('/'))
      }
      case propType.LIST : {
        const x: string[] = []
        const v = src[name] as string[]
        if (v) v.forEach(t => { if (t) x.push(i.nohash ? t : Crypt.shaS(t))})
        return x
      }
    }
  }

  /* Map: traçant les collections
    - clé: nom de la collection
    - valeur: valeur de la propriété clé de la collection dans le document
  */
  extractColls (src: Object) : Map<string, string[]> {
    const m = new Map()
    if (!this.colls) return m
    if (this.colls) for(const [colName, ] of this.colls) {
      const val = this.getCollId(src, colName)
      if (val) m.set(colName, val)
    }
    return m
  }

  checkProps (props: props) {
    const ps = new Set()
    for (const p of props) {
      if (!Descriptor.isVarName(p)) 
        throw new AppExc(3, 'property_name_syntax', 'docDescriptor', [this.fullName + ' - ' + p])
      if (ps.has(p)) 
        throw new AppExc(3, 'property_name_duplicated', 'docDescriptor', [this.fullName + ' - ' + p])
      ps.add(p)
    }
  }

  get fullName () { return this.svc + '$' + this.docCl }

  private constructor (exc: AppExc | undefined, svc: string, docCl: string, dhdr: DocHeader | null, ehdr: EnumHeader | null,
    colls: Map<string, collection> | null,
    indexes: Map<string, idx> | null) {
    this.svc = svc
    this.docCl = docCl
    if (exc) { this.exc = exc; return }
    
    if (dhdr) {
      if (dhdr.virtual) this.virtual = true
      if (dhdr.pk) this.checkProps(dhdr.pk)
      if (dhdr.nohash) this.nohash = true
      if (dhdr.subClassBy) {
        if (!Descriptor.isVarName(dhdr.subClassBy)) 
          throw new AppExc(3, 'property_name_syntax', 'Descriptor', [this.fullName + ' - ' + dhdr.subClassBy])
        this.subClassBy = dhdr.subClassBy
      }
      if (dhdr.sync) this.sync = true
      if (dhdr.embedCreds) this.embedCreds = true
    } 
    if (ehdr) {
      this.isDoc = false
      if (ehdr.virtual) this.virtual = true
      if (ehdr.enum) this.enum = ehdr.enum
      if (ehdr.enumCred) this.enumCred = ehdr.enumCred
    }

    if (colls && colls.size) {
      for(const [nc, coll] of colls) {
        if (!Descriptor.isVarName(nc))
          throw new AppExc(3, 'property_name_syntax', 'Descriptor', [this.fullName + ' - ' + nc])
        this.checkProps(coll.key)
        if (!coll.mutable) coll.mutable = false
        if (!coll.list) coll.list = false
      }
      this.colls = colls
    }

    if (indexes && indexes.size) {
      for(const [nc, idx] of indexes) {
        if (!Descriptor.isVarName(nc))
          throw new AppExc(3, 'property_name_syntax', 'Descriptor', [this.fullName + ' - ' + nc])
        if (!idx.global) idx.global = false
      }
      this.indexes = indexes
    }
  }
}

export class FormType {
  static formTypes = new Map<string, FormType>()

  // classes référencées avec /1 et $
  static refClasses1 : Set<string> = new Set()
  static refClasses$ : Set<string> = new Set()

  // Retourne la liste des couples [svc, type] des FormTypes déclarés
  static getFormTypes () : [string, string][] { 
    const r: [string, string][] = []
    for(const [k, ft] of FormType.formTypes) r.push([ft.svc, ft.type])
    return r
  }
  static getFormType (svc: string, type: string) { return FormType.formTypes.get(svc + '$' + type) }
  static hasRefClasses1 (c: string) : boolean { return FormType.refClasses1.has(c)}
  static hasRefClasses$ (c: string) : boolean { return FormType.refClasses$.has(c)}


  static size () { return FormType.formTypes.size}
  static get (svc: string, type: string) { 
    return this.formTypes.get(svc + '$' + type)}

  readonly svc: string
  readonly type: string
  readonly categ: string
  readonly key: string
  readonly creds: string[]

  static register (svc: string, type: string, categ: string, key: string, creds: string[]) : AppExc | undefined {
    if (!Descriptor.services.has(svc))
      return new AppExc(3, 'EX3_not_configured_service', 'FormType', [svc])
    if (!Descriptor.isVarName(type))
      return new AppExc(3, 'EX3_type_name_syntax', 'FormType', [svc + ' -- ' + type])

    const ft = new FormType(svc, type, categ, key, creds)
    FormType.formTypes.set(svc + '$' + ft.type, ft)
    for(const c of creds) {
      if (c !== 'A') {
        const cl = c.substring(0, c.indexOf('/'))
        if (c.endsWith('/1')) FormType.refClasses1.add(cl)
        else FormType.refClasses$.add(cl)
      }
    }
  }

  private constructor (svc: string, type: string, categ: string, key: string, creds: string[]) { 
    this.svc = svc
    this.type = type
    this.categ = categ
    this.key = key
    this.creds = creds
  }
}
