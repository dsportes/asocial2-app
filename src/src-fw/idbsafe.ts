import { Dexie, type EntityTable } from "dexie"
import { encode, decode } from '@msgpack/msgpack'

import { useSafeStore } from '../stores/safe-store'
import { useConfigStore } from '../stores/config-store'
import { deleteIDB } from '../src-fw/idb'
import { AppExc } from './base'

class DbHeader {
  id!: string
  devId!: string
  devName!: string
}
class DbTrusting {
  id!: string
  bin!: Uint8Array
}
class AppDB extends Dexie {
  header!: EntityTable<DbHeader, 'id'>
  trustings!: EntityTable<DbTrusting, 'id'>

  constructor(dbName: string) {
    super(dbName, { autoOpen: true })
    this.version(1).stores({
      header: 'id',
      trustings: 'id'
    })
    this.header.mapToClass(DbHeader)
    this.trustings.mapToClass(DbTrusting)
  }
}

let safeBox: any = null
let config: any = null

export class IDBsafe {
  static db: AppDB

  static EX (e: any, op: string) {
    const ex = new AppExc(8, 'IDB_SAFE_error', op, [e.message])
    if (e && e.stack) ex.stack = e.stack
    return ex
  }

  /* On n'ouvre pas systématiquement IDB safe ce qui
    aurait pour effet de la créer si elle n'existait pas.
    Or en mode incognito on ne veut pas la créer.
    Elle n'est ouverte QUE si elle existait.
  */
  static async openOnlyIfExists () {
    if (!safeBox) safeBox = useSafeStore()
    if (!config) config = useConfigStore()
    if (IDBsafe.db) await IDBsafe.load() // reload sur fin de session
    else if (await Dexie.exists('safe'))
      await IDBsafe.openInAnyCase()
  }

  /* Ouverture, le cas échéant après création, de IDB safe
    et chargement de son contenu dans le SafeStore
  */
  static async openInAnyCase () {
    if (!safeBox) safeBox = useSafeStore()
    if (!config) config = useConfigStore()
    if (!IDBsafe.db) try {
      IDBsafe.db = new AppDB('safe')
      await IDBsafe.db.open()
      if (config.K.myDebug) console.log('IDB open [safe]')
      await IDBsafe.load()
    } catch (e: any) {
      if (IDBsafe.db) {
        await IDBsafe.db.close()
      }
      console.log('Init IDBsafe failed: ' + e.message)
    }
  }

  static async load () {
    const m: Map<string, Trusting> = new Map()
    const r = await IDBsafe.db.header.get('1')
    safeBox.devId = r && r.devId ? r.devId : ''
    safeBox.devName = r && r.devName ? r.devName : ''
    if (safeBox.devId) {
      await IDBsafe.db.trustings.each(async (r) => {
        try {
          const obj = decode(r.bin) as any
          const t : Trusting = new Trusting(obj)
          m.set(t.userId, t)
        } catch (e) {
          console.log(e)
        }
      })
      safeBox.trustings = m
    }
  }

  static async saveHeader (devId: string, devName: string) {
    if (IDBsafe.db) try {
      await IDBsafe.db.header.put({
        id: '1',
        devId: devId || '',
        devName: devName || ''
      })
    } catch (e) {
      throw IDBsafe.EX(e, 'saveHeader')
    }
  }

  static async saveTrusting (t: Trusting) {
    if (IDBsafe.db) try {
      const obj = t.toObj
      await IDBsafe.db.trustings.put({ id: t.userId, bin: encode(obj)})
      safeBox.trustings.set(t.userId, t)
    } catch (e) {
      throw IDBsafe.EX(e, 'Trusting.save')
    }
  }

  static async delTrusting (id: string) {
    if (IDBsafe.db) try {
      const t = safeBox.trustings.get(id)
      if (t) for(const app of t.appsDb)
        await deleteIDB(app, id)
      safeBox.trustings.delete(id)
      await IDBsafe.db.trustings.where({id}).delete()
    } catch (e) {
      throw IDBsafe.EX(e, 'delTrusting')
    }
  }
}

export class Trusting {
  userId: string = ''
  store: string = '' // safe store du user
  pseudo: string = ''
  cx: string = ''
  K1: string = ''
  K2: string = ''
  Kp: string = ''
  appsDb: string[] = []

  constructor (obj: any) {
    for(const f of Object.keys(obj)) (this as any)[f] = obj[f]
  }

  get toObj () : any {
    const obj: any = {}
    for(const f of Object.keys(this)) obj[f] = (this as any)[f]
    return obj
  }

  hasAppDb () {
    const app = config.K.APPNAME
    if (!this.appsDb || !this.appsDb.length) return false
    return this.appsDb.indexOf(app) !== -1
  }

  async addAppsDb (_app?: string) {
    const app = _app || config.K.APPNAME
    if (!this.appsDb) this.appsDb = []
    const i = this.appsDb.indexOf(app)
    if (i === -1) {
      this.appsDb.push(app)
      await IDBsafe.saveTrusting(this)
    }
  }

  async delAppsDb (_app?: string) {
    const app = _app || config.K.APPNAME
    if (!this.appsDb) this.appsDb = []
    await deleteIDB(app, this.userId)
    const i = this.appsDb.indexOf(app)
    if (i !== -1) {
      this.appsDb.splice(i, 1)
      await IDBsafe.saveTrusting(this)
    }
  }

}
