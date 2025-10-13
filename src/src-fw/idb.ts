// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { Crypt } from './crypt'
import { AppExc, sleep, b64ToU8, u8ToB64 } from './util'

const STORES = {
  singletons: 'name', // singletons
  auths: 'id',
  defs: 'id',
  documents: 'id'
}

const encoder = new TextEncoder()

class IDB {
  static idb: IDB

  db : any
  keyK: Uint8Array
  config?: any

  constructor () {
    this.config = stores.config
    this.keyK = b64ToU8(this.config['keyK'])
    if (!this.keyK)
      throw new AppExc({code: 12003, label: 'IDB error: keyK not declared' })
    if (this.config.mondebug) console.log('Open IDB: [' + name + ']')
    this.db = new Dexie(name, { autoOpen: true })
    this.db.version(1).stores(STORES)
    IDB.idb = this
  }

  static async open(name: string) {
    const config = stores.config
    try {
      const x = new IDB()
      await x.db.open()
    } catch (e) {
      throw IDB.EX(e, 1)
    }
  }

  static async delete (name: string) {
    const config = stores.config
    try {
      await Dexie.delete(name)
      await sleep(100)
      if (config.mondebug) console.log('RAZ db')
    } catch (e) {
      if (config.mondebug) console.log(e.toString())
    }
    IDB.idb = null
  }

  static EX (e: Error, n: number) { 
    const ex = new AppExc({code: 1200 + n, label: 'IDB error', args: [e.message] })
    if (e && e.stack) ex.stack = e.stack
    return ex
  }

  async cryptId (id: string) : Promise<string> {
    const x = await Crypt.crypt(encoder.encode(id), this.keyK)
    return u8ToB64(x)
  }

  async cryptData (data: any): Promise<Uint8Array> {
    return await Crypt.crypt(encode(data), this.keyK)
  }

  async getState (name: string) : Promise<Object> {
    try {
      const x = await this.db.singletons.get(name)
      return x || { }
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async putState (name: string, value: any) {
    try {
      const data = await this.cryptData(value)
      await this.db.transaction('rw', ['singletons'], async () => {
        await this.db.singletons.put({ name, data })
      })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

}
