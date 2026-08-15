// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { AppExc } from '../src-fw/log'
import { sleep } from '../src-fw/util'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import { Registry } from '../src-fw/registry'

const STORES = {
  singletons: 'name', // singletons { name, bin }
  docs: 'def, lat',
  colls: 'def, lat'
}

type IDBrow = {
  lat: number
  v: number
  data?: Uint8Array
}

export let idb : IDB = null // IDB courante

export async function deleteIDB (appName?: string, userId?: string) {
  const config = stores.config
  const mondebug = config.mondebug
  const name = (appName || config.appName) + '_' + (userId || stores.safe.userId)
  try {
    await Dexie.delete(name)
    await sleep(100)
    if (mondebug) console.log('IDB reset [' + name + '] OK')
  } catch (e: any) {
    if (mondebug) console.log('IDB reset [' + name + '] failed: ' + e.toString())
  }
  idb = null
}

export class IDB {

  static EX (e: any, opName: string) { 
    const ex = new AppExc(8, 'IDB_error', opName, [e.message])
    if (e && e.stack) ex.stack = e.stack
    return ex
  }

  db : any
  keyK: Uint8Array
  mondebug: boolean
  appName: string
  userId: string
  SYNCINCRNBD: number

  get dbName() { return this.appName + '_' + this.userId }

  constructor () {
    const config = stores.config
    this.appName = config.appName
    this.mondebug = config.mondebug
    this.SYNCINCRNBD = config.SYNCINCRNBD
    this.keyK = stores.safe.keyK
    this.db = new Dexie(this.dbName, { autoOpen: true })
    this.db.version(1).stores(STORES)
    idb = this
  }

  async open (clean?: boolean) {
    try {
      const max = Date.now() + (this.SYNCINCRNBD * 86400000)
      await this.db.open()
      if (this.mondebug) console.log('IDB open [' + this.dbName + ']')
      if (clean) {
        this.db.docs.where('lat').below(max).delete()
        this.db.colls.where('lat').below(max).delete()
      }
    } catch (e) {
      throw IDB.EX(e, 'open')
    }
  }

  async cryptData (data: Uint8Array): Promise<Uint8Array | null> {
    return !data ? null : await Crypt.crypt(this.keyK, data)
  }

  async decryptData (bin: Uint8Array): Promise<Uint8Array | null> {
    return !bin ? null : await Crypt.decrypt(this.keyK, bin)
  }

  async setDC (def: string, lat: number, v: number, d: Uint8Array) {
    try {
      const data = await this.cryptData(d)
      const r = { def, lat, v, data }
      const n = def.split('/')
      if (n.length === 1) await this.db.docs.put(r)
      else await this.db.colls.put(r)
    } catch (e) {
      throw IDB.EX(e, 'setDC')
    }
  }

  async getDC (def: string) : Promise<IDBrow | null> {
    try {
      const n = def.split('/')
      let r
      if (n.length === 1) r = await this.db.docs.get(def)
      else r = await this.db.colls.get(r)
    if (r)
      r.data = await this. decryptData(r.data)
    return r
    } catch (e) {
      throw IDB.EX(e, 'getDC')
    }
  }

  async updLV (def: string, lat: number, v: number) {
    try {
      const r = { def, lat, v }
      const n = def.split('/')
      if (n.length === 1) await this.db.docs.upsert(r)
      else await this.db.colls.upsert(r)
    } catch (e) {
      throw IDB.EX(e, 'setDC')
    }
  }

  /* Retourne le contenu d'un singleton nommé
  ou un objet vide s'il n'existait pas */
  async getSingleton (name: string) : Promise<Object> {
    try {
      const r = await this.db.singletons.get(name)
      return r ? decode(await this.decryptData(r.bin) as Object) : { }
    } catch (e) {
      throw IDB.EX(e, 'getSingleton')
    }
  }

  /* Enregistre le contenu d'un singleton nommé */
  async putSingleton (name: string, val: Object) {
    try {
      const bin = await this.cryptData(encode(val))
      await this.db.singletons.put({ name, bin })
    } catch (e) {
      throw IDB.EX(e, 'putSingleton')
    }
  }
}
