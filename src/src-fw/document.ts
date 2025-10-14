// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { DocType } from './doctypes'

export class Document {
  _clazz: string
  _dt: DocType
  _pk: string
  deleted?: boolean
  v: number

  propertyAsSet (name: string) : Set<string> {
    const v = this[name]
    return !v ? new Set() : new Set(v)
  }

  static classes: Object
  static setClasses (arg: Object) { Document.classes = arg }

  static getClazz (clazz: string) : Function{ return Document.classes[clazz]}

  static async compile (clazz: string, data: Uint8Array) {
    const cl = Document.classes[clazz]
    if (!cl) return null
    const dt = DocType.get(clazz)
    const doc: Document = new cl() as Document
    doc._clazz = clazz
    doc._dt = DocType.get(clazz)
    const d = data ? decode(data) : {}
    for(const f in d) doc[f] = d[f]
    doc._pk = d._pk || doc._dt.pkValue(doc)
    await doc.compile()
    return doc
  }

  async compile() { }

}
