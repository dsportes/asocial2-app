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
    const topcl = topCl('', clazz.name)
    const i = clazz.name.indexOf('$')
    const svc = topcl.substring(0, i)
    const docCl = topcl.substring(i + 1)
    if (!svc || !docCl)
      throw new AppExc(103, 'invalid_class_name', null, [clazz.name])
    DocDescriptor.get(topcl)
    if (clazz['manager']) Registry.managers.add(clazz.name)
    this.classes.set(clazz.name, clazz)
  }

  // Retourne le constructor de la classe MAJEURE (sans sous classe)
  static getCl (svc: string, docCl: string) : Function {
    const cl = Registry.classes.get(topCl(svc, docCl))
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', 'Registry.getCl', [topCl(svc, docCl)])
    return cl
  }

  // Retourne le constructor de la SOUS-CLASSE de docCl selon la valeur de son data
  static getClass (svc: string, docCl: string, data: Object, nohash?: boolean ) : Function {
    const topcl = topCl(svc, docCl)
    const subClassBy = DocDescriptor.get(topcl).subClassBy
    const cln = topcl + (subClassBy ? '_' + data[subClassBy] : '')
    const cl = Registry.classes.get(cln)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', 'Registry.getClass', [cln])
    return cl
  }

  // Retourne la pk de la SOUS-CLASSE de docCl selon la valeur de son data
  static getPk (svc: string, docCl: string, data: Object, nohash?: boolean) : string {
    return DocDescriptor.get(topCl(svc, docCl)).pkValue(data, nohash)
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data: Object ) : $ADocument {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl() as $ADocument
  }

  static async compile (svc: string, docCl: string, data: Uint8Array) : Promise<$Document | null>{
    const d = data ? decode(data) : {}
    const doc = Registry.newD(svc, docCl, d) as $Document
    if (!doc) return null
    doc._clazz = topCl(svc, docCl)
    for(const f in d) doc[f] = d[f]
    doc._pk = d._pk || doc._docDescriptor.pkValue(doc)
    await doc.compile()
    return doc
  }

}

export class $ADocument {
  constructor () { }

  get _docDescriptor () { return DocDescriptor.get(this.constructor.name) }

  propertyAsSet (name: string) : Set<string> {
    const v = this[name]
    return !v ? new Set() : new Set(v)
  }
}

export class $Document extends $ADocument{
  _clazz: string = ''
  _pk: string = ''
  deleted?: boolean = false
  v: number = 0

  async compile() { }

}
