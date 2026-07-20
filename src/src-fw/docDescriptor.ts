import { Crypt } from '../src-fw/crypt'
import { AppExc } from '../src-fw/log'
import { K } from '../app/constants'

// Liste ordonnnée de noms de propriétés identifiantes
export type props = string[]

export type Descriptor = {
  name: string
  pk?: props
  nohash?: boolean
  enum?: string[]
  extenum?: string
  subClassBy?: string
}

const regvar = /^[a-z][a-zA-Z0-9]*$/
export function isVarName (n: string) { return regvar.test(n)}
const regdoc = /^[A-Z$][a-zA-Z_$0-9]*$/
export function isDocName (n: string) { return regdoc.test(n)}

export class DocDescriptor {

  static all: Map<string, DocDescriptor> = new Map()

  static size () { return DocDescriptor.all.size}

  static get(clazz: string) { return this.all.get(clazz)}

  svc: string
  name: string
  pk?: string[]
  nohash?: boolean
  enum?: string[]
  extenum?: string = ''
  subClassBy?: string = ''
    
  checkProps (clName: string, props: props) {
    const ps = new Set()
    for (const p of props) {
      if (!isVarName(p)) 
        throw new AppExc(3, 'property_name_syntax', 'docDescriptor', [clName + '.' + p])
      if (ps.has(p)) 
        throw new AppExc(3, 'property_name_duplicated', 'docDescriptor', [clName + '.' + p])
      ps.add(p)
    }
  }

  constructor (svc: string, arg: Descriptor) {
    if (!K.SERVICES[svc])
      throw new AppExc(3, 'EX3_not_configured_service', 'docDescriptor', [svc])
    this.svc = svc
    if (!isDocName(arg.name)) 
      throw new AppExc(3, 'document_name_syntax', 'docDescriptor', [arg.name])
    const fn = this.svc + '$' + arg.name
    if (DocDescriptor.all.get(fn))
      throw new AppExc(3, 'document_name_duplicated', 'docDescriptor', [fn])
    this.name = arg.name
    if (arg.pk) {
      this.checkProps(this.name, arg.pk)
      this.pk = arg.pk 
    }
    this.nohash = arg.nohash || false
    this.enum = this.enum
    this.extenum = arg.extenum
    if (arg.subClassBy && !isVarName(arg.subClassBy)) 
      throw new AppExc(3, 'property_name_syntax', 'DocDescriptor', [this.name + '.' + arg.subClassBy])
    this.subClassBy = arg.subClassBy
    DocDescriptor.all.set(fn, this)
  }

  get fullName () { return this.svc + '$' + this.name}

  /* Retourne la valeur du pk d'une "source" ayant les propriétés citées dans pk */
  pkValue (src?: Object, nohash?: boolean) : string {
    if (!this.pk || !this.pk.length || !src) return '1'
    let p = src['pk']
    if (p) return p
    const x = []
    if (src) this.pk.forEach(p => { x.push(src[p] || '') })
    p = x.join('/')
    return nohash || this.nohash ? p : Crypt.shaS(p)
  }
}

export class FormType {
  static all = new Map<string, FormType>()
  // classes référencées avec /1 et $
  static refClasses1 : Set<string> = new Set()
  static refClasses$ : Set<string> = new Set()

  static size () { return DocDescriptor.all.size}
  static get (svc: string, type: string) { return this.all.get(svc + '$' + type)}

  svc: string
  type: string
  categ: string
  key: string
  creds: string[]

  constructor (svc: string, type: string, categ: string, key: string, creds: string[]) {
    if (!K.SERVICES[svc])
      throw new AppExc(3, 'EX3_not_configured_service', 'FormType', [svc])
    this.svc = svc
    this.type = type
    this.categ = categ
    this.key = key
    this.creds = creds
    FormType.all.set(svc + '$' + type, this)
    for(const c of creds) {
      if (c !== 'A') {
        const cl = c.substring(0, c.indexOf('/'))
        if (c.endsWith('/1')) FormType.refClasses1.add(cl)
        else FormType.refClasses$.add(cl)
      }
    }
  }
}
