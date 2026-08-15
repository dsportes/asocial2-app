// @ts-ignore
import { encode } from '@msgpack/msgpack'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { AppExc } from '../src-fw/log'

export type SOA = {
  svc: string
  org: string
  svcLabel?: string
  site?: string
  admin? : boolean
}

export const subCl = (clazz: string) => {
  const i = clazz.indexOf('_')
  return i === -1 ? '' : clazz.substring(i + 1)
}

export const medCl = (clazz: string) => {
  let i = clazz.indexOf('_')
  const d = i === -1 ? clazz : clazz.substring(0, i)
  i = d.indexOf('$')
  return i === -1 ? d : d.substring(i + 1)
}

export const topCl = (svc: string, docCl: string) : string => {
  const i = docCl.indexOf('_')
  const d = i === -1 ? docCl : docCl.substring(0, i)
  return d.indexOf('$') === -1 ? svc + '$' + d : d
}

export const svcCl = (clazz: string) => {
  const i = clazz.indexOf('$')
  return i === -1 ? '' : clazz.substring(0, i)
}

export class Registry {
  static classes : Map<string, Function> = new Map()

  /* Set des noms des classes des credential
  assignés par role (CATEG dans I18n) */
  static managers : Set<string> = new Set()

  /* Set des classes de leur svc$docCl des credential (depuis leur sous-classe) 
  assignés par svc$role (CATEG dans I18n) */
  static roles : Map<string, Set<string>> = new Map()
  static roleOfCred : Map<string, string> = new Map()

  static getCredsOfRole(role: string) { return this.roles.get(role) }
  static getRoleOfCred(cred: string) { return this.roleOfCred.get(cred) }

  static register (clazz: Function) { 
    const topcl = topCl('', clazz.name)
    const i = clazz.name.indexOf('$')
    const svc = topcl.substring(0, i)
    const docCl = topcl.substring(i + 1)
    if (!svc || !docCl)
      throw new AppExc(103, 'invalid_class_name', null, [clazz.name])
    if (!clazz['_unregistered'])
      DocDescriptor.get(topcl)
    if (clazz['_manager']) Registry.managers.add(clazz.name)
    const role = clazz['_role']
    if (role) {
      const cl = svc + '$' + subCl(clazz.name)
      const r = svc + '$' + role
      let e = Registry.roles.get(r)
      if (!e) { e = new Set(); Registry.roles.set(r, e)}
      e.add(cl)
      Registry.roleOfCred.set(cl, r)
    }

    this.classes.set(clazz.name, clazz)
  }

  // Retourne le constructor de la SOUS-CLASSE de docCl selon la valeur de son data
  static getClass (svc: string, docCl: string, data?: Object, nohash?: boolean ) : Function {
    const topcl = topCl(svc, docCl)
    let cln = topcl
    if (data) {
      const subClassBy = DocDescriptor.get(topcl).subClassBy
      cln += (subClassBy ? '_' + data[subClassBy] : '')
    }
    const cl = Registry.classes.get(cln)
    if (!cl) 
      throw new AppExc(103, 'not_configured_doc_class', 'Registry.getClass', [cln])
    return cl
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data?: Object ) : $ADocument {
    const cl = Registry.getClass(svc, docCl, data)
    // @ts-expect-error
    return new cl() as $ADocument
  }

  static async compile (svc: string, docCl: string, org: string, obj: Object) : Promise<$Document | null>{
    const doc = Registry.newD(svc, docCl, obj) as $Document
    doc._org = org
    doc._pk = doc._docDescriptor.pkValue(obj)
    doc.v = obj['v']
    if (obj['deleted']) doc.deleted = true
    else {
      for(const f in obj) doc[f] = obj[f]
      await doc.compile()
    }
    return doc
  }

  static buildZombi (svc: string, docCl: string, org: string, v: number, pk: string) : $Document {
    const doc = Registry.newD(svc, docCl) as $Document
    doc._org = org
    doc._pk = pk
    doc.v = v
    doc.deleted = true
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
  get _svc () { return svcCl(this.constructor.name) }
  get _clazz () { return medCl(this.constructor.name) }

  _org: string
  _pk: string = ''
  deleted?: boolean = false
  v: number = 0

  async compile() { }

  serial () : Uint8Array {
    const obj: any = {}
    if (!this.deleted) for(const p of Object.keys(this))
      if (!p.startsWith('_')) obj[p] = this[p]
    else this.deleted = true
    obj._clazz = topCl('', this.constructor.name)
    obj._org = this._org
    obj._pk = this._pk
    return encode(obj)
  }

}
