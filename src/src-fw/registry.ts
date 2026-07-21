// @ts-ignore
import { decode } from '@msgpack/msgpack'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { AppExc } from '../src-fw/log'

export type SOA = {
  svc: string
  org: string
  admin? : boolean
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

  static getCl (svc: string, docCl: string) : Function {
    const k = svc + '$' + docCl
    const cl = Registry.classes.get(k)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', null, [k])
    return cl
  }

  static getDescr (svc: string, docCl: string) : DocDescriptor {
    const pfx = docCl.indexOf('$') === -1 ? svc + '$' : ''
    const k = pfx + docCl
    const cl = Registry.classes.get(k)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', null, [k])
    return cl['docDescriptor']
  }

  static getClass (svc: string, docCl: string, data: Object, nohash?: boolean ) : Function {
    const pfx = docCl.indexOf('$') === -1 ? svc + '$' : ''
    let i = docCl.indexOf('_')
    const topcl = pfx + (i === -1 ? docCl : docCl.substring(0, i))
    const dd = DocDescriptor.get(topcl)
    if (!dd) 
      throw new AppExc(103, 'not_configured_doc_class', null, [topcl])
    const sc = dd.subClassBy
    const cln = topcl + (sc ? '_' + data[sc] : '')
    const cl = Registry.classes.get(cln)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', null, [cln])
    return cl
  }

  static getPk (svc: string, docCl: string, data: Object, nohash?: boolean) : string {
    const cl = Registry.getClass(svc, docCl, data)
    return cl['docDescriptor'].pkValue(data, nohash)
  }

  static newD (svc: string, docCl: string, data: Object ) : $Document {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl() as $Document
  }

  static newF (svc: string, docCl: string, data: Object ) {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl(data)
  }

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
  // _dt: DocType | null = null
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
