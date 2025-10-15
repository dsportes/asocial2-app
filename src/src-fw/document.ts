// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { DocType } from './doctypes'

/* 
- sessionId : shaS de subJSON clé primaire
- subJSON : token web-push
- url : url de l'application à ouvrir par le terminal sur web-push
- title : titre des notifications web-push
- v : version
- defs : un object `{ def: msg ... }` liste les définitions
  - def: sa définition.
  - msg: est un message ou ''
*/
export type subscription = {
  sessionId: string
  subJSON: string
  url: string
  title: string
  defs: Object
}

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
