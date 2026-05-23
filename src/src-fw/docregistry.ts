// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { DocType } from '../src-fw/doctypes'
import { CredSafe } from '../src-fw/documents'

export class DocRegistry {
  static regDoc = new Map()
  static sizeD () { return DocRegistry.regDoc.size }

  static registerD (cl: Function) { DocRegistry.regDoc.set(cl.name, cl) }
  static getD (name: string) { return DocRegistry.regDoc.get(name) }
  static newD (name: string) {
    const cl = DocRegistry.regDoc.get(name)
    return cl ? new cl() : null
  }
  static newCredDoc (name: string) {
    const cl = DocRegistry.regDoc.get(name)
    return cl ? new cl() : new CredDocument()
  }

  static async compile (clazz: string, data: Uint8Array) : Promise<Document | null>{
    const dt = DocType.get(clazz)
    const doc = DocRegistry.newD(clazz)
    if (!doc) return null
    doc._clazz = clazz
    doc._dt = dt || null
    const d = data ? decode(data) : {}
    for(const f in d) doc[f] = d[f]
    doc._pk = d._pk || (doc._dt ? doc._dt.pkValue(doc) : '')
    await doc.compile()
    return doc
  }
}

export abstract class Document {

  _clazz: string = ''
  _dt: DocType | null = null
  _pk: string = ''
  deleted?: boolean = false
  v: number = 0

  propertyAsSet (name: string) : Set<string> {
    const v = this[name]
    return !v ? new Set() : new Set(v)
  }

  async compile() { }

}

export class CredDocument {
  cred: CredSafe | null = null

  setCred (cred: CredSafe) {
    this.cred = cred
  }
  async dispMore () { }
  async dispLimit () { }
  async dispDocKey () { }
  async dispOpaque () { }

}