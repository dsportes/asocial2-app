import { encode } from '@msgpack/msgpack'
import { Descriptor } from '../src-fw/descriptor'
import { AppExc } from './base'

export class Registry {
  // Map des classes enregistrées par svc / docCl
  static constructors: Map<string, Function> = new Map()

  static register (clazz: Function, descriptor: Descriptor) : AppExc | undefined {
    if (descriptor.exc) return descriptor.exc
    this.constructors.set(descriptor.fullName, clazz)
    const cl = clazz as any
    descriptor.clazz = clazz
    cl._descriptor = descriptor
    return undefined
  }

  static registerSubClass (clazz: Function, parentClazz: Function, subCl: string) : AppExc | undefined {
    const pc = parentClazz as any
    const d : Descriptor = (parentClazz as any)['_descriptor'] as Descriptor
    if (!d)
      return new AppExc(3, 'subclass_without_parent_descriptor', 'RegisterSubClass', [clazz.name])
    d.subClasses.set(subCl, clazz)
    const cl = clazz as any
    cl._parentClazz = pc
    cl._subCl = subCl
    return undefined
  }

  static getDescriptor (svc: string, docCl: string) : Descriptor {
    const cl = this.constructors.get(svc + '/' + docCl) as any
    const d = cl ? cl.descriptor || cl.parentClazz.descriptor : undefined
    if (!d)
      throw new AppExc(3, 'class_without_descriptor', 'getDescriptor', [svc + '/' + docCl])
    return d
  }

  // Construit un document de la SOUS-CLASSE de docCl selon la valeur de son data
  static newD (svc: string, docCl: string, data?: any ) : $ADocument {
    const d = this.getDescriptor(svc, docCl)
    let cl: Function
    if (d.subClassBy) {
      const subCl = data ? data[d.subClassBy] : ''
      if (!subCl)
        throw new AppExc(3, 'subclass_id_not_found', 'newD', [svc + '/' + docCl, d.subClassBy])
      cl = d.subClasses.get(subCl) as Function
      if (!cl)
        throw new AppExc(3, 'subclass_not-registered', 'newD', [svc + '/' + docCl, d.subClassBy, subCl])
    } else {
      cl = d.clazz
    }
    // @ts-expect-error
    return new cl()
  }

  static async compile (svc: string, docCl: string, org: string, obj: any) : Promise<$Document>{
    const doc = Registry.newD(svc, docCl, obj) as $Document
    doc._org = org
    doc._pk = doc.descriptor.pkValue(obj)
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
  private static _descriptor: Descriptor
  private static _subCl: string
  private static _parentClazz: Function

  static get descriptor () : Descriptor { return this._descriptor || (this._parentClazz as any)['_descriptor'] }
  static get subCl () : string { return this._subCl || '' }
  static get parentClazz() : Function | undefined { return this._parentClazz || undefined}

  get descriptor () : Descriptor { return (this.constructor as any)['descriptor'] }
  get subCl () : string { return (this.constructor as any)['subCl'] }
  get parentClazz () : Function { return (this.constructor as any)['parentClazz'] }

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
