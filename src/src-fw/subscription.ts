// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

// import { IDB } from './idb'
import stores from '../stores/all'
import { $Document } from '../src-fw/registry'
import { Registry } from '../src-fw/registry'
import { Operation } from '../src-fw/operation'

/* versions d'une souscription: sur le serveur, détenue localement
si versions[0] === versions[1] la souscription est à jour en session 
*/
export type versions = [number, number]

export type $SubsObj = {
  sessionId: string
  subJSON: string
  url: string
  title: string
  defs: string[]
  msgs: Object
}

// Souscription d'une organisation
export class $Subs extends $Document {
  title: string = '' // titre des notifications web-push
  msgs: Object = {} // messages des définitions
  // { def: msg ... } - def: sa définition. msg: est un message ou ''
  url: string = '' // url de l'application à ouvrir par le terminal sur web-push
  defs: string[] = []// définitions de la souscription

  static new (svc: string, org: string) {
    const subs = Registry.newD(svc, 'Subs', { }) as $Subs
    subs._org = org
    return subs
  }

  /* Mise à jour d'une souscription enregistrée: possibilités ...
  - setTile
  - addDef / delDef
  puis in fine commit()
  */
  setTitle (title: string) { this.title = title }

  setUrl (url: string) { this.url = url }

  setDef (def: string, msg: string) {
    const i = this.defs.indexOf(def)
    if (i === -1) this.defs.push(def)
    if (msg) this.msgs[def] = msg
  }

  delDef (def: string) {
    const i = this.defs.indexOf(def)
    if (i !== -1) this.defs.splice(i, 1)
    delete this.msgs[def]
  }

  serial () : Uint8Array {
    return encode({
      title: this.title,
      url: this.url,
      defs: this.defs,
      msgs: this.msgs
    })
  }

  /* Enregistrement de la souscription au serveur */
  async subscribe (longLife: boolean) : Promise<boolean> {
    const session = stores.session
    const config = stores.config
    const op = new Operation('FW$setSubscription', this._svc, this._org)
    try {
      op.args.subscription = {
        sessionId: session.sessionId,
        subJSON: session.subJSON,
        url: this.url || config.location,
        title: this.title || (config.K.APPNAME + ' - ' + op.args.org),
        defs: this.defs,
        msgs: this.msgs
      }
      op.args.longLife = longLife
      const res = await op.post()
      return true
    } catch(e) {
      await op.ko(e)
      return false
    }
  }
  
}

