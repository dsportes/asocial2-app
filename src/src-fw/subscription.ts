// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

// import { IDB } from './hasIDB'
import stores from '../stores/all'
import { Operation } from '../src-fw/operation'
import { $Perimeter, $Def, $Credential } from '../src-fw/documents'
import { IDocStore } from'../stores/docs'
import { $ADocument, $Document } from '../src-fw/registry'



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

/* Classe immuable après construction / setDef - Souscription d'une organisation */
export class $Subs extends $Document {
  title: string = '' // titre des notifications web-push
  msgs: Object = {} // messages des définitions
  // { def: msg ... } - def: sa définition. msg: est un message ou ''
  url: string = '' // url de l'application à ouvrir par le terminal sur web-push
  defs: string[] = [] // définitions de la souscription

  /* Mise à jour d'une souscription enregistrée: possibilités ...
  - setTitle, setUrl, setDef  */
  setTitle (title: string) { this.title = title; return this }

  setUrl (url: string) { this.url = url; return this}

  setDef (def: $Def, msg?: string) {
    const i = this.defs.indexOf(def.definition)
    if (i === -1) this.defs.push(def.definition)
    if (msg) this.msgs[def.definition] = msg
    return this
  }

  /* Enregistrement de la souscription au serveur */
  async subscribe (svc: string, org: string, longLife: boolean) : Promise<boolean> {
    const session = stores.session
    const config = stores.config
    const op = new Operation('FW$setSubscription', svc, org)
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

export class $SubsGenerator extends $ADocument {
  subs: $Subs
  svc: string
  org: string
  creds: Map<string, $Credential>
  pref: Object
  roles: Set<string> = new Set()

  init (svc: string, org: string) {
    this.svc = svc    
    this.org = org
    this.creds = stores.safe.mySimpleCreds(svc, org)

    const session = stores.session
    for(const x of session.orgRoles) {
      const i = x.indexOf('/')
      if (x.substring(0, i) === org) this.roles.add(x.substring(i + 1))
    }
    this.pref = session.currentPref || {}
    
    this.subs = new $Subs()
    return this
  }

  credOf (docCl: string, pk: string) : $Credential | null {
    for(const [,c] of this.creds)
      if (c.docCl === docCl && c.docPk === pk) return c
    return null
  }

  processPerimeters (lp: $Perimeter[]) {
    for(const p of lp)
      for(const def of p.defs) this.subs.setDef(def)
  }
}

class $DefSigner {
  svc: string
  creds: Map<string, $Credential> 

  constructor (svc: string, org: string) {
    this.svc = svc
    this.creds = new Map()
    const sc = stores.safe.mySimpleCreds(svc, org)
    for(const [ ,c] of sc)
      this.creds.set(c.docCl + '/' + c.docPk, c)
  }

  getCred (def: $Def): $Credential {
    switch (def.type) {
      case 1 : return this.creds.get(def.definition)
      case 2 : return this.creds.get(def.docCl + '/1')
      case 3 : return this.creds.get(def.colClass(this.svc) + '/' + def.pk)
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
  svc: string
  op: Operation
  signer: $DefSigner
  creds: $Credential[] = []

  constructor (svc: string, org: string) {
    this.svc = svc
    this.op = new Operation('FW$Sync', svc, org)
    this.signer = new $DefSigner(svc, org)
    this.op.args.toSync = []
  }

  // Retourne true si un credential existe
  addDef (def: $Def, v: number) : boolean {
    const cred = this.signer.getCred(def)
    if (cred) {
      this.creds.push(cred)
      this.op.args.toSync.push({ def: def.definition, v })
      return true
    } else return false
  }


  async post () : Promise<[number, Object]> {
    try {
      for(const cred of this.creds)
        await this.op.sign(cred)
      const res = await this.op.post()
      return [res.now, res.syncs]
    } catch (e) {
      await this.op.ko(e, this.svc)
      return [0, null]
    }
  }
}
