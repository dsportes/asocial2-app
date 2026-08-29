// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { AppExc } from '../src-fw/log'
import { sleep } from '../src-fw/util'
import { $Perimeter } from '../src-fw/documents'

/*
La base IDB est propriété d'un couple application / utilisateue. Son nom est: app-userId
Table singletons:
- clé primaire: name (nom du singleton)
- data: un objet sérialisé et crypté par la clé K de l'utilisateur.
  - stocke les préférences: un row par préférence
  - stocke l'objet options sous le name $options$.

Table perims:
- clé primaire pk: svc/org/ID où ID est l'identifiant du périmètre docCl@code/docPk
- data: l'objet sérialisé et crypté par la clé K de l'utilisateur du périmètre.

Table docs: { sodef, def, so, lat, v, data } so: svc/org
- cle primaire sodef: svc/org/def
- index composite: so lat
- data: contenu du document sérialisé et crypté par la clé K de l'utilisateur
  (data: encode du Document)
Le filtre sur l'index composite permet pour un svc/org donné,
- de supprimer TOUS les docs parce que svc/org n'existe plus (plus de périmètres)
- de supprimer les docs obsolètes, dont lat est trop ancienne.

Table colls: { sodef, def, so, lat, v, data } so: svc/org
- cle primaire sodef: svc/org/def
- index composite: so lat
- data: contenu du document sérialisé et crypté par la clé K de l'utilisateur
  (data: encode de l'array des pk)
Le filtre sur l'index composite permet pour un svc/org donné,
- de supprimer TOUS les docs parce que svc/org n'existe plus (plus de périmètres)
- de supprimer les docs obsolètes, dont lat est trop ancienne.

Ouverture en mode _avion_:
- lit tous les perims et en retourne une Map par svc/org
- lit tous les singletons:
  - retourne une Map des préférences
  - retourne l'objet options.

Ouverture en mode _sync_ AVEC reset:
- suppression de la base et ouverture en autoopen (vide)
- reçoit une Map des périmètres groupés par svc/org
  - stocke les périmètres un row par périmètre.
- reçoit un objet options et le stocke.

Ouverture en mode _sync_ SANS reset:
- ouverture en autoopen
- lit les périmètres existants pour en tirer la liste "avant" des couples svc/org
  que la base héberge.
- reçoit une Map des périmètres groupés par svc/org. Donne une liste "après".
  - supprime de la base tous les perims / docs / colls dont le svc/org
    était dans la liste "avant" et ne sont plus dans la liste "après"
  - stocke les périmètres reçus un row par périmètre.
  - pour chaque svc/org de la liste "après" supprime tous les docs / colls
    dont la lat est obsolète.
  - lit l'objet options et le retourne.

Un appel ultérieur peut passer un objet options (résultat de la 
fusion avec l'objet options de l'appelant): celui-ci est écrit dans la base. 

Les autres méthodes sont:
- getDC: retourne un document / collection
- setDC: set d'un document / collection.
- updLV: mise à jour de lat / version d'un document / collection.
- setOptions: mise à jour du singleton options
- updPerims: set de périmètres ET suppressions de périmètres.
  - si un périmètre était le dernier existant pour un svc/org
    les docs / colls de ce svc/org sont supprimés.
*/

const STORES = {
  singletons: 'name', // singletons { name, data }
  prefs: 'code',
  perims: 'pk, so',
  docs: 'sodef, [so+lat]',
  colls: 'sodef, [so+lat]'
}

type IDBrow = {
  lat: number
  v: number
  data?: Uint8Array
}

type ValidP = {
  pk: string,
  so: string,
  data: Uint8Array
}

// Map par svc/org des périmètres identifiés par leur id
export type Perims = Map<string, Map<string, $Perimeter>>
// Map des préférences identifiées par leur code
export type Prefs = Map<string, Object>
export type Options = {
  orgRoles: string[] // liste des couples org/role sélectionnés par l'utilisateur
  pref: string
}

export type StartPlane = { 
  perims: Perims,
  prefs: Prefs, 
  options: Options
}

export let idb : IDB = null // IDB courante

export async function deleteIDB (appName?: string, userId?: string) {
  const config = stores.config
  const myDebug = config.K.myDebug
  const name = appName || (config.K.APPNAME + '_' + (userId || stores.safe.userId))
  try {
    await Dexie.delete(name)
    await sleep(100)
    if (myDebug) console.log('IDB reset [' + name + '] OK')
  } catch (e: any) {
    if (myDebug) console.log('IDB reset [' + name + '] failed: ' + e.toString())
  }
  idb = null
}

/* Ne peut être construit et ouvert qu'après authentification
session.step >= 1
*/
export class IDB {

  static EX (e: any, opName: string) { 
    const ex = new AppExc(8, 'IDB_error', opName, [e.message])
    if (e && e.stack) ex.stack = e.stack
    return ex
  }

  db : any
  keyK: Uint8Array
  myDebug: boolean
  appName: string
  userId: string
  SYNCINCRNBD: number

  get dbName() { return this.appName + '_' + this.userId }

  constructor () {
    const config = stores.config
    const sf = stores.safe
    this.appName = config.K.APPNAME
    this.myDebug = config.myDebug
    this.SYNCINCRNBD = config.K.SYNCINCRNBD
    this.keyK = sf.keyK
    this.userId = sf.userId
    this.db = new Dexie(this.dbName, { autoOpen: true })
    this.db.version(1).stores(STORES)
    idb = this
  }

  close () {
    if (this.db) 
      try { this.db.close() } catch(e) {}
    this.db = null
    idb = null
  }

  async open () : Promise<void> {
    try {
      await this.db.open() // Pas utile du fait auto-open ?
    } catch (e) {
      throw IDB.EX(e, 'openPlane')
    }
  }


  async cryptData (data: Uint8Array): Promise<Uint8Array | null> {
    return !data ? null : await Crypt.crypt(this.keyK, data)
  }

  async decryptData (bin: Uint8Array): Promise<Uint8Array | null> {
    return !bin ? null : await Crypt.decrypt(this.keyK, bin)
  }

  async getOptions () : Promise<Options>{
    const x = await this.db.singletons.get('$OPTIONS$')
    if (!x) return null
    const obj = decode(await this.decryptData(x.data))
    return obj
  }

  async getPrefs () : Promise<Prefs>{
    const m: Prefs = new Map()
    const lp = await this.db.prefs.toArray()
    for(const pref of lp) {
      const obj = decode(await this.decryptData(pref.data))
      m.set(pref.code, obj)
    }
    return m
  }

  async getPerims () : Promise<Perims>{
    const m: Perims = new Map()
    const lp = await this.db.perims.toArray()
    for(const px of lp) {
      const obj = decode(await this.decryptData(px.data))
      const p = new $Perimeter(obj.code, obj.docCl, obj.docPk, obj.role, obj.plane, obj.defs)
      const soid = px.id
      let i = soid.indexOf('/')
      i = soid.indexOf('/', i + 1)
      const so = soid.substring(0, i)
      let m2: Map<string, $Perimeter> = m.get(so)
      if (!m2) { m2 = new Map(); m.set(so, m2) }
      m2.set(p.id, p)
    }
    return m
  }

  async storePerims (perims: Perims) : Promise<void> {
    const todo = []
    for(const [so, m] of perims) {
      for (const [,p] of m) {
        todo.push({
          so,
          pk: so + '/' + p.id,
          data: await this.cryptData(encode(p.toObj()))
        })
      }
    }
    await this.db.transaction('rw', this.db.perims, async () => {
      const lp = []
      for(const x of todo)
        lp.push(this.db.perims.add({pk: x.pk, so: x.so, data: x.data}))
      await Promise.all(lp)
    })
  }

  async storePrefs (prefs: Prefs) : Promise<void> {
    const todo = new Map<string, any>()
    for(const [code, obj] of prefs) {
      todo.set(code, { code, data: await this.cryptData(encode(obj)) })
    }
    await this.db.transaction('rw', this.db.prefs, async () => {
      this.db.prefs
      const lp = []
      for(const x of this.db.prefs.toArray()) {
        const pr = todo.get(x.code)
        if (pr)
          lp.push(this.db.prefs.add({code: x.code, data: pr.data}))
        else
          lp.push(x.delete())
      }
      await Promise.all(lp)
    })
  }

  /* Purge des obsolètes (voire tous) d'un svc/org */
  async purge (so: string, limit: number) : Promise<void> {
    if (limit) {
      await this.db.transaction('rw', 
        this.db.perims, this.db.docs, this.db.colls, async () => {
        await Promise.all([
          this.db.docs.where('so').equals(so).and(x => x.lat < limit).delete(),
          this.db.colls.where('so').equals(so).and(x => x.lat < limit).delete()
        ])
      }) 
    } else {
      await this.db.transaction('rw', 
        this.db.perims, this.db.docs, this.db.colls, async () => {
        await Promise.all([
          this.db.perims.where('so').equals(so).delete(),
          this.db.docs.where('so').equals(so).delete(),
          this.db.colls.where('so').equals(so).delete()
        ])
      })
    }
  }

  // Méthodes publiques *******************************************/
  /* openPlane : 
  Le constructor a été invoqué par l'appelant.
  - lit tous les perims et en retourne une Map par svc/org
  - lit tous les singletons:
    - retourne une Map des préférences
    - retourne l'objet options.
  */
  async openPlane () : Promise<StartPlane | null> {
    try {
      await this.db.open() // Pas utile du fait auto-open ?
      const options = await this.getOptions()
      if (!options) return null
      return {
        options,
        prefs: await this.getPrefs(),
        perims: await this.getPerims()
      }
    } catch (e) {
      throw IDB.EX(e, 'openPlane')
    }
  }

  async openSync () : Promise<Options | null> {
    try {
      await this.db.open() // Pas utile du fait auto-open ?
      return await this.getOptions()
    } catch (e) {
      throw IDB.EX(e, 'openPlane')
    }
  }

  /* openSync
  La BASE A ETE (EVENTUELLEMENT) SUPPRIMEE AVANT l'APPEL 
  et le constructor invoqué
  - reçoit un objet options et le stocke.
  - reçoit une Map des préférences et la stocke
  MAJ et interprétation des périmètres
  - lit les périmètres existants pour en tirer la liste "avant" des couples svc/org
    que la base héberge.
  - reçoit la Map des périmètres "potentiels" groupés par svc/org. 
    Donne une liste "après".
    - supprime de la base tous les perims / docs / colls dont le svc/org
      était dans la liste "avant" et ne sont plus dans la liste "après"
    - stocke les périmètres reçus un row par périmètre.
    - pour chaque svc/org de la liste "après" supprime tous les docs / colls
      dont la lat est obsolète.
  */
  async setupSession (options: Object, prefs: Prefs, perims: Perims) 
  : Promise<void> {
    try {
      await this.setOptions(options)
      await this.storePrefs(prefs)
      
      const max = Date.now() - (this.SYNCINCRNBD * 86400000)
      const locPerims = await this.getPerims()
      const soBefore = new Set(locPerims.keys())
      const soAfter = new Set(perims.keys())
      for(const so of soBefore) if (!soAfter.has(so))
        await this.purge(so, 0)
      for(const so of soAfter)
        await this.purge(so, max)

      await this.updPerims(perims)

    } catch (e) {
      throw IDB.EX(e, 'openSyncReset')
    }
  }

  async setDC (svc: string, org: string, def: string, lat: number, v: number, d: Uint8Array) {
    try {
      const data = await this.cryptData(d)
      const so = svc + '/' + org
      const sodef = so + '/' + def
      const r = { sodef, def, so, lat, v, data }
      const n = def.split('/')
      if (n.length === 2) await this.db.docs.put(r)
      else await this.db.colls.put(r)
    } catch (e) {
      throw IDB.EX(e, 'setDC')
    }
  }

  async getDC (svc: string, org: string, def: string) : Promise<IDBrow | null> {
    try {
      const n = def.split('/')
      const sodef = svc + '/' + org + '/' + def
      let r
      if (n.length === 1) r = await this.db.docs.get(sodef)
      else r = await this.db.colls.get(sodef)
      if (r)
        r.data = await this. decryptData(r.data)
      return r
    } catch (e) {
      throw IDB.EX(e, 'getDC')
    }
  }

  async updLV (svc: string, org: string, def: string, lat: number, v: number) {
    try {
      const sodef = svc + '/' + org + '/' + def
      const r = { sodef, lat, v }
      const n = def.split('/')
      if (n.length === 1) await this.db.docs.upsert(r)
      else await this.db.colls.upsert(r)
    } catch (e) {
      throw IDB.EX(e, 'updLV')
    }
  }


  /* updPerims - maj des périmètres, ajout de nouveaux, suppression d'anciens
  - un périmètre dont defs a une longueur nulle (ou est null) est à supprimer
  - s'il n'y a plus de périmètre pour un svc/org
    les docs / colls de ce svc/org sont supprimés.
  */
  async updPerims (perims: Perims): Promise<void> {
    try {
      const soLivingP: Set<string> = new Set()
      const soHavingDel: Set<string> = new Set()

      const livingP: Map<string, ValidP> = new Map()
      const toDelP = new Set<string>()

      for(const [so, m] of perims) {
        for (const [,p] of m) {
          const pk = so + '/' + p.id
          if (p.defs && p.defs.length) {
            soLivingP.add(so)
            const vp = { pk, so, data: await this.cryptData(encode(p)) }
            livingP.set(pk, vp)
          }
        }
      }

      this.db.perims.forEach((p) => {
        if (!livingP.has(p.pk)) {
          toDelP.add(p.pk)
          if (!soLivingP.has(p.so)) soHavingDel.add(p.so)
        }
      })

      await this.db.transaction('rw', this.db.perims, async () => {
        const lp = []
        for(const [, x] of livingP)
          lp.push(this.db.perims.set(x))
        for(const pk of toDelP)
          lp.push(this.db.perims.get(pk).delete())
        await Promise.all(lp)
      })

      for(const so of soHavingDel) {
        const n = await this.db.perims.where('so').equals(so).count()
        if (n === 0)
          await this.purge(so, 0)
      }
    } catch (e) {
      throw IDB.EX(e, 'updPerims')
    }
  }

  /* Enregistre l'objet options */
  async setOptions (options: Object) {
    try {
      const data = await this.cryptData(encode(options))
      await this.db.singletons.put({ name: '$OPTIONS$', data })
    } catch (e) {
      throw IDB.EX(e, 'putSingleton')
    }
  }
}
