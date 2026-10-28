// @ts-ignore
import { encode } from '@msgpack/msgpack'
import { Descriptor } from '../src-fw/descriptor'
import { AppExc } from '../src-fw/log'

export type SOA = {
  svc: string
  org: string
  svcLabel?: string
  site?: string
  admin? : boolean
}

export class ClassInfo {
  readonly svc: string
  readonly docCl: string
  readonly subCl: string
  readonly descriptor: Descriptor
  readonly clazz: Function

  constructor (svc: string, docCl: string, subCl: string, descriptor: Descriptor, clazz: Function) {
    this.svc = svc; this.docCl = docCl; this.subCl = subCl; this.descriptor = descriptor; this.clazz = clazz
  }

  newD () : $ADocument {
    const f = this.clazz
    // @ts-expect-error
    return new f() as $ADocument
  }

  get fullName () { return this.svc + '/' + this.docCl + (this.subCl ? ('/' + this.subCl) : '')}

}

export class Registry {
  // Map des classes enregistrées par svc / docCl / subCl
  static constructors: Map<string, Function> = new Map()

  // Set des classes s'étant déclarées "manager"
  static managers : Set<Function> = new Set()

  /* Pour chaque svc / role, sous-classes de Credential ayant déclaré ce role*/
  static credClassesbyRole: Map<string, Set<Function>> = new Map()

  static getCredClassesOfRole(svc: string, role: string) { 
    return Registry.credClassesbyRole.get(svc + '/' + role) }

/*
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
*/

  static register (clazz: Function) : AppExc | undefined {
    let exc: AppExc | undefined
    const _descriptor : Descriptor = (clazz as any)['_descriptor'] as Descriptor
    if (!_descriptor)
      exc = new AppExc(3, 'class_without_descriptor', 'Register', [clazz.name])
    if (!exc && _descriptor.exc) exc = _descriptor.exc
    if (!exc) {
      Registry.constructors.set(clazz.name, clazz)
      if ((clazz as any)['_manager'])
        Registry.managers.add(clazz)
    }
    return exc
  }

  static registerSubClass (clazz: Function, parentClazz: Function, subCl: string) : AppExc | undefined {
    let exc: AppExc | undefined
    const _descriptor : Descriptor = (parentClazz as any)['_descriptor'] as Descriptor
    if (!_descriptor)
      exc = new AppExc(3, 'subclass_without_parent_descriptor', 'RegisterSubClass', [clazz.name])
    if (!exc) {
      const svc = _descriptor.svc
      const docCl = _descriptor.svc
      const fullName = svc + '/' + docCl + '/' + subCl
      if (!Descriptor.isSubName(subCl))
        exc = new AppExc(3, 'subclass_name_syntax', 'RegisterSubClass', [fullName])
      if (!exc) {
        (clazz as any)['_parentClazz'] = parentClazz
        (clazz as any)['_subCl'] = subCl
        Registry.constructors.set(clazz.name, clazz)
        if ((clazz as any)['_manager'])
          Registry.managers.add(clazz)
        const role: string | undefined = (clazz as any)['_role']
        if (role) {
          let s = Registry.credClassesbyRole.get(svc + '/' + subCl)
          if (!s) { s = new Set(), Registry.credClassesbyRole.set(svc + '/' + subCl, s)}
          s.add(clazz)
        }
      }
    }
    return exc
  }

  /* Retourne le ClassInfo,
  - de la classe svc / docCl
  - OU de la SOUS-CLASSE de svc / docCl selon la valeur de la propriété 
    de data qui donne le nom de la sous-classe
  */
  static getClassInfo (svc: string, docCl: string, data?: any ) : ClassInfo {
    let clazz = Registry.constructors.get(svc + '/' + docCl)
    if (!clazz) 
      throw new AppExc(3, 'class_not_found', 'Registry.getClassInfo(1)', [svc + '/' + docCl])
    const descriptor = (clazz as any)['_descriptor']
    if (!descriptor) 
      throw new AppExc(3, 'unregistered_class', 'Registry.getClassInfo(2)', [svc + '/' + docCl])
    let subCl = ''
    if (data) {
      if (!descriptor.subClassBy)
        throw new AppExc(3, 'subclass_property_not_declared', 'Registry.getClassInfo(3)', [svc + '/' + docCl])
      subCl = data[descriptor.subClassBy]
      if (!subCl)
        throw new AppExc(3, 'subclass_property_value_not_found_in_data', 'Registry.getClassInfo(4)', 
          [svc + '/' + docCl + ' -- ' + descriptor.subClassBy])
      clazz = Registry.constructors.get(svc + '/' + docCl + '/' + subCl)
      if (!clazz) 
        throw new AppExc(3, 'subclass_not_found', 'Registry.getClassInfo(4)', [svc + '/' + docCl + '/' + subCl])
    }
    return new ClassInfo(svc, docCl, subCl, descriptor, clazz)
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data?: Object ) : $ADocument {
    const ci = Registry.getClassInfo(svc, docCl, data)
    return ci.newD() as $ADocument
  }

  static async compile (svc: string, docCl: string, org: string, obj: any) : Promise<$Document>{
    const doc = Registry.newD(svc, docCl, obj) as $Document
    doc._org = org
    doc._pk = doc._descriptor.pkValue(obj)
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
  get _descriptor () : Descriptor { return (this.constructor as any)['_descriptor'] }

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
