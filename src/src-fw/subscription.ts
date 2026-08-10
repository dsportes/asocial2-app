// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

// import { IDB } from './idb'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'
import { $DefSigner } from '../src-fw/documents'
import { getStore, $DocItem, $DCItem } from'../stores/docs'
import { $Document, Registry, SOA, CollData } from '../src-fw/registry'

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

/* FW$Sync : synchronise les defs des souscriptions citées *************************
- toSync = SubsToSync[]
subsToSync = {
  def: string, 
  v: number - version 'vs' la plus récente détenue en session
}
Pour chaque 'def' retourne la sous-collection 'clazz/colName/colValue' 
des documents par exemple: 
  - type 0: Auteur : collection de 0-N éléments.
  - type 1: Auteur/sh(Zola) : 0-1 élément.
  - type 2: Article/auteurs/sh(Zola) : collection de 0-N éléments.
- pour chaque def d'entrée, un élément syncs[def] est retourné
  - type 0 et 2: { v, datas: Uint8Array[] } 
  - type 1: { v, datas: Uint8Array[] } datas 0 ou 1 élément

- vs est 0: tous les éléments connus actuellement.
- vs != 0: INCREMENTAL , liste des changements depuis vs:
  - ceux ajoutés avec leur data complète: { v _pk _clazz ...}
  - ceux supprimés avec une data: { deleted:true, v _pk, _clazz }
    - v: version de suppression (dh de l'opération de suppression)

- Type 2 INCREMENTAL : Article/auteurs/sh(Zola)
  retourne une collection d'"Article" (dont l'un des Auteurs est Zola), PAS d'"Auteur"
  a) ajoutés à la sous-collection ou toujours présents mais modifiés, 
  b) partis de la sous-collection, 
  b) zombifiés
  - pour savoir si un article a1 est dans le cas a) ou b)
    - la session recherche si Zola est ou non dans la liste d'auteurs,
      - oui c'est un a), ajouté à la collection ou mis à jour
      - non c'est un b), supprimé de la collection
    - cas c): deleted est à true (Article supprimé)
Retour:
- syncs[def]: { v, datas: Uint8Array[] }
- now : date-heure de l'opération IMPORTANTE. C'est la dh d'ASSERTION,
  à cette date-heure l'image de la collection est celle-ci.
  - si l'élément est { v: 0, datas: [] } IL N'Y A PAS eu de changements
    depuis la dh vs fournie par la session. la version v de la collection est INCONNUE.
  - si l'élément est { v: 12345, datas: [d1, ...] }.
    - le ou les changements a) b) c) sont dans datas
    - la version v de la collection est CONNUE (sa dh de dernier changement): 
      - INCREMENTALE : c'est la plus haute de celles contenues dans les datas.
      - INTEGRALE: v la plus haute des documents lus, y compris ceux
        supprimés qui ne sont PAS dans datas.
*/
export class FW$Sync {
  op: Operation

  constructor (soa: SOA) {
    this.op = new Operation('FW$Sync', soa.svc, soa.org)
    this.op.args.toSync = []
  }

  add (v: number, docCl:string, docPk?: string, colName?: string) {
    if (!docPk) this.op.args.toSync.push({ def: docCl + '/1', v: v || 0})
    else if (!colName) this.op.args.toSync.push({ def: docCl + '/' + docPk, v: v || 0})
    else this.op.args.toSync.push({ def: docCl + '/' + colName + '/' +  docPk, v: v || 0})
    return this
  }

  async post (noex?: boolean) : Promise<Map<string, $DCItem>> {
    const signer = Registry.newD(this.op.args.svc, 'DefSigner') as $DefSigner
    signer.op = this.op
    await signer.sign(this.op.args.toSync)
    const dcitems: Map<string, $DCItem> = new Map()
    try {
      const res = await this.op.post()
      const sat = res['now'] // service assertion time
      if (res.syncs) {
        const std = getStore(this.op.args.svc, this.op.args.org)
        for(const def in res.syncs) {
          const type = def.split('/').length - 1
          const cd = res.syncs[def] as CollData
          await std.storeCollData(def, cd.incr, sat, cd.v, cd.datas)
          for (const data of vdatas.datas) {
            const d = decode(data)
            const cl = d._clazz
            const pk = d._pk
            let item: $DocItem = std.getDoc(cl, pk)            
            if (!item || d.v > item.sv) {
              const doc = await Registry.compile(this.op.args.svc, cl, this.op.args.org, d)
              item = await std.setDoc(def, sat, d.v, data, doc)
            }
            dcitems.set(def, item)
          }
        }
      }
      return dcitems
    } catch (e) {
      await this.op.ko(e)
      if (!noex) throw e
      return dcitems
    }
  }
}
