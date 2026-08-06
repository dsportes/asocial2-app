// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { IDB } from './idb'
import stores from '../stores/all'
import { $Document } from '../src-fw/registry'
import { FW$UpdateSubscription, FW$SetSubscription } from '../src-fw/operations'

/* versions d'une souscription: sur le serveur, détenue localement
si versions[0] === versions[1] la souscription est à jour en session 
*/
export type versions = [number, number]

// Souscription d'une organisation
export class $Subs extends $Document {
  title: string // titre des notifications web-push
  defs: Object // liste des définitions
  // { def: msg ... } - def: sa définition. msg: est un message ou ''

  // Propriétés requises seulement pour enregistrement au serveur
  sessionId?: string // shaS de subJSON clé primaire
  subJSON?: string //  token web-push
  url?: string // url de l'application à ouvrir par le terminal sur web-push

  _title: string = '' // maj
  _url: string = ''
  _defs: Map<string, string | boolean> = new Map() // maj
  _newDefs: Set<string> = new Set()
  _delDefs: Set<string> = new Set()

  static fromSerial (bin: Uint8Array) : $Subs {
    const obj = decode(bin)
    const s = new $Subs()
    s.title = obj.title || ''
    s.defs = obj.defs
    return s
  }

  constructor () {
    super()
    this.title = ''
    this.defs = {}
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
    const dataSt = stores.data
    if (this._title === null && this._url === null && !this._defs.size) return

    const session = stores.session
    if (this._title) this.title = this._title

    // Recherche des Subs à mettre à jour en store et enregistrer en IDB
    if (session.hasIDB && (this.title !== null || this._defs.size)) {
      const msubs: Map<string, $Subs> = new Map<string, $Subs>()
      for(const def of this._newDefs) {
        const [clazz, subs] = dataSt.setDefLoc(org, def, 0)
        msubs.set(clazz, subs)
      }
      for(const def of this._delDefs) {
        const [clazz, subs] = dataSt.delDefLoc(org, def)
        if (subs) // sinon n'existait déjà plus
          msubs.set(clazz, subs.hasRefs ? subs : null)
      }
      if (IDB.idb) await IDB.idb.updateSubscription(org, this, msubs)
    }

    // Maj de la souscription sur le serveur
    if (session.hasNet) {
      const delta = {}
      if (this._defs.size) for(const [def, msg] of this._defs) {
        delta[def] = msg
        if (msg === false) delete this.defs[def]; else this.defs[def] = msg
      }
      await new FW$UpdateSubscription(this._svc, org).run(this._title, this._url, delta)
    }
  }

  /* Enregistrement de la souscription au serveur
  Pas invoquée en mode PLANE
  */
  async subscribe (svc: string, org: string, longLife: boolean, title?: string, url?: string) {
    const config = stores.config
    this.url = url || config.location
    this.title = title || (config.K.APPNAME + ' - ' + org)
    await new FW$SetSubscription(svc, org).run(this, longLife)
  }

  serial () : Uint8Array { return encode({title: this.title, defs: this.defs}) }
  
}

/********************************************************************
Souscription élementaire d'une classe de documents pour une organisation
********************************************************************/
export class $SubsItem {
  vdef0 : versions | null // versions de la collection de tous les documents de la classe
  vdef1 : Map<string, versions> // versions pour chaque pk
  vdef2 : Map<string, versions> // pour chaque collection colName/colValue

  constructor () {
    this.vdef0 = null
    this.vdef1 = new Map<string, versions>()
    this.vdef2 = new Map<string, versions>()
  }

  static deserial (bin: Uint8Array) : $SubsItem {
    const { vdef0, vdef1, vdef2 } = decode(bin)
    const subs = new $SubsItem()
    if (vdef0) subs.vdef0 = vdef0
    for (const x in vdef1) subs.vdef1.set(x, vdef1[x])
    for (const x in vdef2) subs.vdef2.set(x, vdef1[x])
    return subs
  }

  serial () : Uint8Array {
    const s : any = { vdef0: null, vdef1: {}, vdef2: {} }
    if (this.vdef0) s.vdef0 = this.vdef0
    for(const [k, v] of this.vdef1) s.vdef1[k] = v
    for(const [k, v] of this.vdef2) s.vdef2[k] = v
    return encode(s)
  }

  hasRefs () { return this.vdef0 === null && this.vdef1.size === 0 && this.vdef2.size === 0}
}
