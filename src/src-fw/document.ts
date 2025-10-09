// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { DocType } from './doctypes'

export class Document {
  _clazz: string
  _dt: DocType
  _pk: string
  v: number

  static classes: Object
  static setClasses (arg: Object) { Document.classes = arg }

  static getClazz (clazz: string) : Function{ return Document.classes[clazz]}

  static compile (clazz: string, data: Uint8Array) {
    const cl = Document.classes[clazz]
    if (!cl) return null
    const dt = DocType.get(clazz)
    const doc: Document = new cl() as Document
    doc._clazz = clazz
    doc._dt = DocType.get(clazz)
    const d = data ? decode(data) : {}
    for(const f in d) doc[f] = d[f]
    doc._pk = doc._dt.pkValue(doc)
    doc.compile()
    return doc
  }

  compile() { }

}
