// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { DocType } from '../src-fw/doctypes'
import { AppExc } from '../src-fw/log'

export class Registry {
  static regDoc = new Map()
  static sizeD () { return Registry.regDoc.size }

  static registerD (cl: Function) { Registry.regDoc.set(cl.name, cl) }

  static getD (name: string, data: Object) { 
    const dt = DocType.get(name)
    const cl = dt.subClassBy
      ? Registry.regDoc.get(name + '_' + data[dt.subClassBy]) || Registry.regDoc.get(name)
      : Registry.regDoc.get(name) 
    if (!cl) throw new AppExc(103, 'unregistered_doc_class', null, [name])
    return cl
  }

  static newD (name: string, data: Object) {
    const cl = Registry.getD(name, data)
    return new cl()
  }

  static async compile (clazz: string, data: Uint8Array) : Promise<$Document | null>{
    const dt = DocType.get(clazz)
    const d = data ? decode(data) : {}
    const doc = Registry.newD(clazz, d)
    if (!doc) return null
    doc._clazz = clazz
    doc._dt = dt || null
    for(const f in d) doc[f] = d[f]
    doc._pk = d._pk || (doc._dt ? doc._dt.pkValue(doc) : '')
    await doc.compile()
    return doc
  }
}

export class $Document {

  _clazz: string = ''
  _dt: DocType | null = null
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
