// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { Crypt } from './crypt'
import { AppExc, sleep, b64ToU8, u8ToB64 } from './util'
import { Document, subscription } from './document'

const STORES = {
  singletons: 'name', // singletons { name, bin }
  auths: 'id',
  subsriptions: '[org]', // { org, bin } - souscriptions pour cette organisation
  documents: '[org+id]' // { org, id, bin }
}

const encoder = new TextEncoder()

type dbRecord = {
  org: string
  id: string,
  bin: Uint8Array
}

type docRecord = {
  clazz: string
  data: Uint8Array
}

export class IDB {
  static idb: IDB

  db : any
  keyK: Uint8Array
  config?: any
  dataSt: any

  constructor (name: string) {
    this.config = stores.config
    this.dataSt = stores.data
    this.keyK = b64ToU8(this.config['keyK'])
    if (!this.keyK)
      throw new AppExc({code: 12003, label: 'IDB error: keyK not declared' })
    if (this.config.mondebug) console.log('Open IDB: [' + name + ']')
    this.db = new Dexie(name, { autoOpen: true })
    this.db.version(1).stores(STORES)
    IDB.idb = this
  }

  static async open() {
    const session = stores.session
    try {
      const idb = new IDB(session.dbName)
      await idb.db.open()
      return idb
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

  async cryptRecord (rec: any): Promise<Uint8Array> {
    return await Crypt.crypt(encode(rec), this.keyK)
  }

  async decryptRecord (bin: any): Promise<Object> {
    const x = await Crypt.decrypt(bin, this.keyK)
    return decode(x)
  }

  async getState (name: string) : Promise<Object> {
    try {
      const r = await this.db.singletons.get(name)
      return r ? await this.decryptRecord(r.bin) : { }
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async putState (name: string, rec: any) {
    try {
      const bin = await this.cryptRecord(rec)
      await this.db.singletons.put({ name, bin })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async putSubscription (org: string, subs: subscription) {
    try {
      const bin = await this.cryptRecord(subs)
      await this.db.subsriptions.put({ org, bin })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async delSubscription (org: string) {
    try {
      await this.db.subsriptions.delete({ org })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async getSubscriptions () : Promise<Map<string, subscription>> {
    try {
      const m: Map<string, subscription> = new Map<string, subscription>()
      this.db.subsriptions.each(async (r) => {
        const s = await this.decryptRecord(r.bin) as subscription
        m.set(r.org, s)
      })
      return m
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Enregistre toutes les souscriptions dans le store data
  Retourne une map avec pour chaque organisation la liste de ses définitions
  */
  async getDefs (integral: boolean) : Promise<Map<string, string[]>> {
    const m: Map<string, string[]> = new Map<string, string[]>()
    try {
      await this.db.defs.each(async (dbr: dbRecord) => {
        const x = await this.decryptRecord(dbr.bin) as subsToSync
        x.org = dbr.org
        await this.dataSt.setDef(x.org, x.def, integral ? 0 : x.v)
        let e = m.get(x.org)
        if (!e) { e = []; m.set(x.org, e) }
        e.push(x.def)
      })
      return m
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  async deleteAllDocs () {
    await this.db.documents.delete()
  }

  async loadAllDocs () : Promise<void> {
    await this.db.documents.each(async (dbr: dbRecord) => {
      const rec = await this.decryptRecord(dbr.bin) as docRecord
      const doc = await Document.compile(rec.clazz, rec.data)
      this.dataSt.setDoc(dbr.org, doc)
    })
  }

}
