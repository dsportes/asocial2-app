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

/*
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
*/

export type ClassInfo = {
  clazzName: string
  fullName: string // full: svc$docCl_subCl OU svc$docCl_subCl
  svc: string
  topCl: string
  subCl: string
  docCl: string
  manager: boolean
  role: string
  docDescriptor: DocDescriptor | undefined // undefined si la classe n'est pas déclarée dans un schéma
}

export class Registry {
  static classInfos: Map<string, ClassInfo> = new Map()
  static classInfosByClazz: Map<string, ClassInfo> = new Map()
  static constructors: Map<string, Function> = new Map()
  static topClasses: Set<string> = new Set()

  static hasClass (fullName: string) : boolean {
    return Registry.classInfos.has(fullName)
  }

  // Depuis soit svc$docCl, soit svc$docCl_subCl
  static hasTopClass (topCl: string) : boolean {
    const i = topCl.indexOf('_')
    const s = i === -1 ? topCl : topCl.substring(0, i)
    return Registry.topClasses.has(s)
  }

  /* Set des noms des classes des credential
  assignés par role (CATEG dans I18n) */
  static managers : Set<string> = new Set()

  /* Set des classes de leur svc$docCl des credential (depuis leur sous-classe) 
  assignés par svc$role (CATEG dans I18n) */
  static roles : Map<string, Set<string>> = new Map()
  static roleOfCred : Map<string, string> = new Map()

  static getCredsOfRole(role: string) { return this.roles.get(role) }
  static getRoleOfCred(cred: string) { return this.roleOfCred.get(cred) }

  static register (clazz: Function, svc: string, docCl: string, subCl?: string) : void { 
    const topCl = svc + '$' + docCl
    const fullName = topCl + (subCl ? '_' + subCl : '')
    if (!svc || !docCl)
      throw new AppExc(103, 'invalid_class_name', 'Registry.register', [fullName])
    const docDescriptor = (clazz as any)._unregistered ? undefined : DocDescriptor.get(svc, docCl)

    const role = (clazz as any)._role || ''
    if (role) {
      const cl = svc + '$' + subCl
      const r = svc + '$' + role
      let e = Registry.roles.get(r)
      if (!e) { e = new Set(); Registry.roles.set(r, e)}
      e.add(cl)
      Registry.roleOfCred.set(cl, r)
    }

    const ci: ClassInfo = { 
      fullName,
      svc, 
      docCl, 
      subCl: subCl || '', 
      topCl,
      clazzName: clazz.name, // NE PAS UTILISER: nom différent en test et après build !!!
      docDescriptor,
      manager: (clazz as any)._manager !== undefined,
      role
    }
    if (ci.manager) Registry.managers.add(ci.fullName)
    Registry.classInfos.set(fullName, ci)
    Registry.classInfosByClazz.set(clazz.name, ci)
    Registry.constructors.set(clazz.name, clazz)
    Registry.topClasses.add(ci.topCl)
  }

  // Retourne le constructor de la SOUS-CLASSE de docCl selon la valeur de son data
  static getClassInfo (svc: string, docCl: string, data?: any ) : ClassInfo {
    const topCl = svc + '$' + docCl
    if (!Registry.hasTopClass(topCl)) 
      throw new AppExc(103, 'invalid_class_name (3)', 'Registry.getClass', [topCl])
    const dd = DocDescriptor.get(svc, docCl) // Exception si n'est pas déclarée
    const subCl = data && dd.subClassBy ? data[dd.subClassBy] || '' : ''
    const fullName = subCl ? topCl + '_' + subCl : topCl
    const ci = Registry.classInfos.get(fullName)
    if (!ci) 
      throw new AppExc(103, 'invalid_class_name', 'Registry.getClassInfo', [fullName])
    return ci
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data?: Object ) : $ADocument {
    const ci = Registry.getClassInfo(svc, docCl, data)
    const clazz = Registry.constructors.get(ci.clazzName)
    // @ts-expect-error
    return new clazz() as $ADocument
  }

  static async compile (svc: string, docCl: string, org: string, obj: any) : Promise<$Document>{
    const doc = Registry.newD(svc, docCl, obj) as $Document
    doc._org = org
    doc._pk = doc._docDescriptor ? doc._docDescriptor.pkValue(obj) : ''
    doc.v = obj['v']
    if (obj['deleted']) doc.deleted = true
    else {
      for(const f in obj) (doc as any)[f] = obj[f]
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

  static buildMasked (svc: string, docCl: string, org: string, pk: string) : $Document {
    const doc = Registry.newD(svc, docCl) as $Document
    doc._org = org
    doc._pk = pk
    doc.v = -1
    doc.deleted = false
    return doc
  }
}

export class $ADocument {
  constructor () { }
  __classInfo!: ClassInfo

  get _classInfo () : ClassInfo { 
    if (!this.__classInfo) 
      // @ts-expect-error
      this.__classInfo = Registry.classInfos.get(this.constructor.name)
    return this.__classInfo 
  }
  get _docDescriptor () { return this._classInfo.docDescriptor }
  get _svc () { return this._classInfo.svc }
  get _topCl () { return this._classInfo.topCl }

}

export class $Document extends $ADocument{
  _org: string = ''
  _pk: string = ''
  deleted?: boolean = false
  v: number = 0

  async compile() { }

  serial () : Uint8Array {
    const obj: any = {}
    if (!this.deleted) for(const p of Object.keys(this))
      if (!p.startsWith('_')) obj[p] = (this as any)[p]
    else this.deleted = true
    obj._org = this._org
    obj._pk = this._pk
    return encode(obj)
  }

}
