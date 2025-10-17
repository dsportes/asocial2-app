// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/all'
import { Crypt } from './crypt'
import { AppExc, sleep, b64ToU8, u8ToB64 } from './util'
import { Document, Subscription, Subs } from './document'

const STORES = {
  singletons: 'name', // singletons { name, bin }
  auths: 'id',
  subsriptions: '[org]', // { org, bin } - souscriptions pour cette organisation
  subs: '[org+clazz]', // { org, clazz, bin:serial crypté de l'objet Subs}
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

  async cryptRecordSer (bin: Uint8Array): Promise<Uint8Array> {
    return await Crypt.crypt(bin, this.keyK)
  }

  async decryptRecord (bin: any): Promise<Object> {
    const x = await Crypt.decrypt(bin, this.keyK)
    return decode(x)
  }

  async decryptRecordSer (bin: Uint8Array): Promise<Uint8Array> {
    return await Crypt.decrypt(bin, this.keyK)
  }

  /* Retourne le contenu d'un "state" (singleton nommé)
  ou un objet vide s'il n'existait pas */
  async getState (name: string) : Promise<Object> {
    try {
      const r = await this.db.singletons.get(name)
      return r ? await this.decryptRecord(r.bin) : { }
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Enregistre le contenu d'un "state" nommé */
  async putState (name: string, rec: any) {
    try {
      const bin = await this.cryptRecord(rec)
      await this.db.singletons.put({ name, bin })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Supprime la subscription d'une organisation
  et tous ses subs de classe
  */
  async delSubscription (org: string) {
    try {
      await this.db.transaction('rw', ['subscriptions', 'subs'], async () => {
        await this.db.subs.where({ org }).delete()
        await this.db.subsriptions.where({ org }).delete()
      })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Retourne une map de toutes les Subscriptions */
  async getSubscriptions () : Promise<Map<string, Subscription>> {
    try {
      const m: Map<string, Subscription> = new Map<string, Subscription>()
      this.db.subsriptions.each(async (r) => {
        const bin = await this.decryptRecordSer(r.bin)
        m.set(r.org, Subscription.fromSerial(bin))
      })
      return m
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Récupère les objets Subs de toutes les org/clazz
  Map par org / map par classe */
  async getSubs () : Promise<Map<string, Map<string, Subs>>> {
    const m: Map<string, Map<string, Subs>> = new Map<string, Map<string, Subs>>()
    try {
      await this.db.subs.each(async (rec) => {
        const s = await this.decryptRecordSer(rec.bin)
        const subs = Subs.deserial(s)
        let eorg = m.get(rec.org)
        if (!eorg) { eorg = new Map<string, Subs>(); m.set(rec.org, eorg)}
        eorg.set(rec.clazz, subs)
      })
      return m
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Supprime tous les documents (d'une organisation ou de toutes) */
  async deleteAllDocs (org?: string) {
    if (org) await this.db.documents.where({ org }).delete()
    else await this.db.documents.delete()
  }

  /* Charge en dataSt tous les documents de la basqe */
  async loadAllDocs () : Promise<void> {
    await this.db.documents.each(async (dbr: dbRecord) => {
      const rec = await this.decryptRecord(dbr.bin) as docRecord
      const doc = await Document.compile(rec.clazz, rec.data)
      this.dataSt.setDoc(dbr.org, doc)
    })
  }

  /* Retour de sync: sauvegarde transactionnelle en IDB,
  - le Subs contient les versions mise à jour
  - la liste des documents créés / modifiés
  - la liste des pk des documents supprimés
  */
  async retSync (org: string, clazz: string, subs: Subs, 
    binDocs: Map<string, Uint8Array>, delPks: string[]) : Promise<void> {
    try {
      const binSubs = subs ? await this.cryptRecordSer(subs.serial()) : null
      const cbinDocs = new Map<string, Uint8Array>()
      const binPks = new Map<string, string>()
      for(const [pk, binDoc] of binDocs) {
        cbinDocs.set(pk, await this.cryptRecord(binDoc))
        binPks.set(pk, await this.cryptId(pk))
      }
      for(const pk of delPks)
        binPks.set(pk, await this.cryptId(pk))

      await this.db.transaction('rw', ['documents', 'subs'], async () => {
        if (binSubs)
          await this.db.subs.put({ org, clazz, binSubs })
        for(const [pk, bin] of cbinDocs)
          await this.db.documents.put({ org, id: binPks.get(pk), bin })
        for(const pk of delPks)
          await this.db.documents.where({ org, id: binPks.get(pk) }).delete()
      })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Met à jour une souscription et les subs élémentaires modifiés 
  en une seule tyransaction
  */
  async updateSubscription (
    org: string, subscription: Subscription, msubs: Map<string, Subs>) {
    try {
      const bin = await this.cryptRecordSer(subscription.serial())
      const binSubs = new Map<string, Uint8Array>()
      for(const [clazz, subs] of msubs)
        if (subs) binSubs.set(clazz, await this.cryptRecordSer(subs.serial()))
      await this.db.transaction('rw', ['subscriptions', 'subs'], async () => {
        await this.db.subscriptions.put({ org, bin })
        for(const [clazz, subs] of msubs) {
          if (subs) {
            const bin = binSubs.get(clazz)
            await this.db.subs.put({ org, clazz, bin })
          } else {
            await this.db.subs.where({ org, clazz }).delete()
          }
        }
      })
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }

  /* Sauvegarde ou suppression en IDB d'un Subs sur retour de notification d'une souscription
  Le Subs contient les nouvelles versions sur le serveur.
  La subs peut être devenu "inutile" si toutes ses defs ont été supprimées
  */
  async updSubs (org: string, clazz: string, subs: Subs) : Promise<void> {
    try {
      if (subs.hasRefs) {
        const binSubs = await this.cryptRecordSer(subs.serial())
        await this.db.subs.put({ org, clazz, binSubs })
      } else 
        await this.db.subs.where({ org, clazz }).delete()
    } catch (e) {
      throw IDB.EX(e, 2)
    }
  }
}
