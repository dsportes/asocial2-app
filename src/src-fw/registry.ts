// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { DocType } from './doctypes'

export class Registry {
  static regDoc = new Map()
  static sizeD () { return Registry.regDoc.size }

  static registerD (cl: Function) { Registry.regDoc.set(cl.name, cl) }

  static getD (name: string, data: Object) { 
    const dt = DocType.get(name)
    if (!dt) return null
    return dt.subClassBy
      ? Registry.regDoc.get(name + '_' + data[dt.subClassBy]) || Registry.regDoc.get(name)
      : Registry.regDoc.get(name) 
  }

  static newD (name: string, data: Object) {
    const cl = Registry.getD(name, data)
    if (cl) {
      const obj = new cl()
      return obj
    } else return null
  }

  static async compile (clazz: string, data: Uint8Array) : Promise<Document | null>{
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
