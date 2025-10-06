// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { DocType } from './doctypes'

export class Document {
  _clazz: string
  _dt: DocType

  static classes: Object
  static setClasses (arg: Object) { Document.classes = arg }

  static getClazz (clazz: string) : Function{ return Document.classes[clazz]}

  static compile (clazz: string, data: Uint8Array) {
    const cl = Document.classes[clazz]
    if (!cl) return null
    const obj = new cl() as Document
    obj['_clazz'] = clazz
    obj['_dt'] = DocType.get(clazz)
    const d = data ? decode(data) : {}
    for(const f in d) obj[f] = d[f]
    obj.compile()
    return obj
  }

  compile() { }

}
