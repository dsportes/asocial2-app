// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

// import { IDB } from './hasIDB'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'
import { $DefSigner } from '../src-fw/documents'
import { getStore, IDocStore } from'../stores/docs'
import { $Document, Registry, SOA } from '../src-fw/registry'
import { $DCItem } from '../stores/docs'

export interface $DCData {
  v: number
  incr?: boolean
}

export interface $DocData extends $DCData{
  data?: Uint8Array
}

export interface $CollData extends $DCData{
  datas?: Uint8Array[]
  moved?: Uint8Array[]
  deleted?: [string, number][]
}

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
  - setTitle, setUrl, setDef  */
  setTitle (title: string) { this.title = title; return this }

  setUrl (url: string) { this.url = url; return this}

  setDef (def: string, msg: string) {
    const i = this.defs.indexOf(def)
    if (i === -1) this.defs.push(def)
    if (msg) this.msgs[def] = msg
    return this
  }

  delDef (def: string) {
    const i = this.defs.indexOf(def)
    if (i !== -1) this.defs.splice(i, 1)
    delete this.msgs[def]
    return this
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

/* Les appels à FW$Sync se font à deux occasions:
- pour charger des documents / collections A LA PREMIERE demande 
  au cours de la session, APRES avoir déclaré les souscriptions
- sur réception d'une notification
L'appel est STRICTEMENT SERIALISE: des appels parallèles conduiraient
à des corruptions de données (principalement les collections).

FW$Sync : synchronise les defs des souscriptions citées 
- toSync = SubsToSync[]
subsToSync = {
  def: string, 
  v: number - version la plus récente détenue en session
    - si v == 0, INTEGRALE, sinon INCREMENTALE
}
Pour chaque 'def' retourne la sous-collection 'clazz/colName/colValue' 
des documents par exemple: 
  - type 0: Auteur : collection de 0-N éléments.
  - type 1: Auteur/sh(Zola) : 0-1 élément.
  - type 2: Article/auteurs/sh(Zola) : collection de 0-N éléments.
- pour chaque def d'entrée, un élément syncs[def] est retourné
  - type 0 et 2: { incr, v, datas: Uint8Array[], datasD: Uint8Array[], datasM: Uint8Array[] } 
  - type 1: { incr, v, data: Uint8Array | null } datas 0 ou 1 élément

- INTEGRALE: tous les éléments connus actuellement.
  - pour le type 1 
    - le document n'existe PAS : v == 0, data: absent
    - le document existe : v: sa version data: son contenu
  - pour les types 0 et 2 
    - la collection est vide : v == 0 (datas moved deleted sont absents)
    - la collection n'est PAS vide:
      - datas : liste des contenus des documents
      - v : version du document le plus récent de datas

- INCREMENTAL, liste des changements depuis vs:
  - pour le type 1
    - document ayant disparu DEPUIS vs: v version de disparition, data: null
    - document ayant changé (pas disparu): v est sa version, data: son contenu
    - document inchangé: v: 0
  - pour les types 0 et 2, 
    - collection inchangée: v: 0 (datas dels sont absents)
    - collection changée: v et 1 à 3 listes
      - v : version du changement le plus récent
      - datas : [Uint8Array]
        - ceux ajoutés à la collection depuis vs avec leur data complète
        - ceux qui sont dans la collection et ont changé depuis vs avec data complète
      - moved : [Uint8Array] type 2 seulement
        - ceux ayant quitté la collection depuis vs avec leur data complète
      - deleted : couples des [pk, v] des documents supprimés 
        où v est leur dh de supression

Retour:
- syncs[def]: { v, data: Uint8Array[], 
  datas: Uint8Array[], moved :Uint8Array[], deleted: [[pk, v], ...]}
  - si v == -1: credential non trouvé (autres éléments null)
- now : date-heure de l'opération IMPORTANTE. C'est la dh d'ASSERTION,
  à cette date-heure l'image de la collection est celle-ci.
*/
export class FW$Sync {
  op: Operation
  signer: $DefSigner
  defs: string[]
  std: IDocStore
  hasIDB: boolean

  constructor (svc: string, org: string) {
    this.op = new Operation('FW$Sync', svc, org)
    this.signer = (Registry.newD(svc, 'DefSigner') as $DefSigner).init(svc, org)
    this.std = getStore(svc, org)
    this.op.args.toSync = []
    this.hasIDB = stores.session.hasIDB
  }

  getStd () : IDocStore { return this.std }

  async setDefs (defs: string[]) : Promise<[{ def: string, v: number }]> {
    this.defs = this.signer.validDefs(defs)
    for(const def of this.defs) {
      const idf = this.std.idef(def)
      let item : $DCItem
      if (idf.type === 1) {
        item = this.std.getDCItem(def)
        if (!item && this.hasIDB) item = await this.std.initDocFromIDB(def)
      } else {
        item = this.std.collections[def]
        if (!item && this.hasIDB) item = await this.std.initCollFromIDB(def)
      }
      this.op.args.toSync.push({ def, v: item ? item.sv : 0})
    }
    return this.op.args.toSync
  }

  async post (noex?: boolean) : Promise<boolean> {
    await this.signer.sign(this.op, this.defs)
    try {
      const res = await this.op.post()
      const sat = res['now'] // service assertion time
      if (res.syncs) {
        for(const def in res.syncs) {
          const cd = res.syncs[def] as $DCData
          if (cd.v === -1) continue // Pas de credential accepté
          await this.std.storeDocColl(def, sat, cd)
        }
      }
      return true
    } catch (e) {
      await this.op.ko(e)
      if (!noex) throw e
      return false
    }
  }
}
