// @ts-ignore
import { decode } from '@msgpack/msgpack'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { AppExc } from '../src-fw/log'

export type SOA = {
  svc: string
  org: string
  svcLabel?: string
  site?: string
  admin? : boolean
}

const topCl = (svc: string, docCl: string) : string => {
  const i = docCl.indexOf('_')
  const d = i === -1 ? docCl : docCl.substring(0, i)
  return d.indexOf('$') === -1 ? svc + '$' + d : d
}

export class Registry {
  static classes : Map<string, Function> = new Map()
  static managers : Set<string> = new Set()

  static register (clazz: Function) { 
    let i = clazz.name.indexOf('_')
    const topcl = i === -1 ? clazz.name : clazz.name.substring(0, i)
    // const subCl = i === -1 ? '' : clazz.name.substring(i + 1)
    i = clazz.name.indexOf('$')
    const svc = topcl.substring(0, i)
    const docCl = topcl.substring(i + 1)
    if (!svc || !docCl)
      throw new AppExc(103, 'invalid_class_name', null, [clazz.name])
    let dd = DocDescriptor.get(topcl)
    if (!dd) 
      throw new AppExc(103, 'not_configured_doc_class', null, [clazz.name])
    clazz['docDescriptor'] = dd
    if (clazz['manager']) Registry.managers.add(clazz.name)
    this.classes.set(clazz.name, clazz)
  }

  // Retourne le constructor de la classe MAJEURE (sans sous classe)
  static getCl (svc: string, docCl: string) : Function {
    const cl = Registry.classes.get(topCl(svc, docCl))
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', null, [topCl(svc, docCl)])
    return cl
  }

  // Retourne le DocDescriptor de la classe MAJEURE (sans sous classe)
  static getDescr (svc: string, docCl: string) : DocDescriptor {
    const cl = Registry.getCl(svc, docCl)
    return cl['docDescriptor']
  }

  // Retourne le constructor de la SOUS-CLASSE de docCl selon la valeur de son data
  static getClass (svc: string, docCl: string, data: Object, nohash?: boolean ) : Function {
    const subClassBy = Registry.getDescr(svc, docCl).subClassBy
    const cln = topCl(svc, docCl) + (subClassBy ? '_' + data[subClassBy] : '')
    const cl = Registry.classes.get(cln)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', null, [cln])
    return cl
  }

  // Retourne la pk de la SOUS-CLASSE de docCl selon la valeur de son data
  static getPk (svc: string, docCl: string, data: Object, nohash?: boolean) : string {
    const cl = Registry.getClass(svc, docCl, data)
    return cl['docDescriptor'].pkValue(data, nohash)
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data: Object ) : $Document {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    const d = new cl() as $Document
    d._docDescriptor = cl['docDescriptor']
    return d
  }

  // Construit un Form
  static newF (svc: string, docCl: string, data: Object ) {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl(data)
  }

  // Construit un Credential
  static newC (svc: string, docCl: string, data: Object ) {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl(data)
  }

  static async compile (svc: string, docCl: string, data: Uint8Array) : Promise<$Document | null>{
    const d = data ? decode(data) : {}
    const doc = Registry.newD(svc, docCl, d)
    if (!doc) return null
    doc._clazz = docCl
    for(const f in d) doc[f] = d[f]
    const dd = doc.descriptor()
    doc._pk = d._pk || doc.descriptor().pkValue(doc)
    await doc.compile()
    return doc
  }

}

export class $Document {

  descriptor() { 
    return this.constructor['docDescriptor']
  }

  _clazz: string = ''
  _docDescriptor: DocDescriptor
  _pk: string = ''
  deleted?: boolean = false
  v: number = 0

  constructor () {
    // console.log('$Document')
  }

  propertyAsSet (name: string) : Set<string> {
    const v = this[name]
    return !v ? new Set() : new Set(v)
  }

  async compile() { }

}
