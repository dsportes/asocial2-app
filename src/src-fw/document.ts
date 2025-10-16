// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { DocType } from './doctypes'
import { IDB } from './idb'
import stores from '../stores/all'
import { UpdateSubscription, SetSubscription } from './operations'

// Souscription d'une organisation
export class Subscription {
  title: string // titre des notifications web-push
  defs: Object // liste des définitions
  // { def: msg ... } - def: sa définition. msg: est un message ou ''

  // Propriétés requises seulement pour enregistrement au serveur
  sessionId?: string // shaS de subJSON clé primaire
  subJSON?: string //  token web-push
  url?: string // url de l'application à ouvrir par le terminal sur web-push

  _title: string = null // maj
  _url: string = null
  _defs: Map<string, string | boolean> = new Map() // maj
  _newDefs: Set<string> = new Set()
  _delDefs: Set<string> = new Set()

  static fromSerial (bin: Uint8Array) : Subscription {
    const obj = decode(bin)
    return new Subscription(obj.title, obj.defs)
  }

  constructor (title: string, defs: Object) {
    this.title = title || ''
    this.defs = defs
  }

  /* Mise à jour d'une souscription enregistrée: possibilités ...
  - setTile
  - addDef / delDef
  puis in fine commit()
  */
  setTitle (title: string) { this._title = title }

  setDef (def: string, msg: string) {
    if (!this.defs[def]) this._newDefs.add(def)
    this._defs.set(def, msg)
  }

  delDef (def: string) {
    if (this.defs[def]) this._delDefs.add(def)
    this._defs.set(def, false) 
  }

  // Enregistrment local et mise à jour de la souscription au serveur
  async commit (org: string) {
    if (this._title === null && this._url === null && !this._defs.size) return

    const session = stores.session
    if (this._title) this.title = this._title

    const delta = {}
    if (this._defs.size) for(const [def, msg] of this._defs) {
      delta[def] = msg
      if (msg === false) delete this.defs[def]; else this.defs[def] = msg
    }

    if (session.hasIDB && (this.title !== null || this._defs.size)) {
      await IDB.idb.updateSubscription(org, this, delta, this._newDefs, this._delDefs)
    }

    if (session.hasNet) {
      await new UpdateSubscription().run(org, this._title, this._url, delta)
    }
    /*
    if (session.hasNet && session.phase !== 0) {
      const subsToSync: subsToSync = { org, def, v}
      queueForSync(subsToSync)
    }
    */
  }

  // Enregistrement de la souscription au serveur
  async subscribe (org: string, longLife: boolean, title?: string, url?: string) {
    const config = stores.config
    this.url = url || config.location
    this.title = title || (config.K.APPNAME + ' - ' + org)
    await new SetSubscription().run(org, this, longLife)
  }

  serial () : Uint8Array { return encode({title: this.title, defs: this.defs}) }
  
}

// Document stocké en store-data
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
