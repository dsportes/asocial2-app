// @ts-ignore
import { ref, computed } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from './all'
import { AppExc, sleep, b64ToU8, u8ToB64 } from '../src-fw/util'

import { Crypt } from '../src-fw/crypt'

/*
- `HEADER`: cette table _singleton_ a deux colonnes:
  - `devId`: un identifiant généré aléatoirement à la création de la base _Safes_ identifiant le _device_.
  - `devName`: le _nom_ du _device_, par exemple `PC d'Alice`, plus parlant que le code technique système pour le propriétaire du _device_ et les quelques personnes pouvant l'utiliser en confiance.
- `TRUSTING`: chaque row est associé à UN _safe_ ayant déclaré le _device_ de confiance. Il a les colonnes suivantes:
  - `userId`: identifiant du _safe_ (clé primaire).
  - `pseudo`: par exemple `Bob`.
  - `cx`: un challenge aléatoire.
  - `Ka`: clé K du safe de l'utilisateur cryptée par `SH(p0, p1)` où `p0` et `p1` sont les termes d'authentification du safe de l'utilisateur.
  - `Kp`: clé K du safe de l'utilisateur cryptée par `SH(PIN + cx, cy)` où,
    - `PIN` est le code PIN fixé par l'utilisateur à la déclaration de confiance,
    - `cx cy` sont des _challenges_ générés aléatoirement à ce moment.
- `TSESSION`: chaque row décrit une _session_ qui a été ouverte _en confiance_ sur ce _device_:
  - `app`: code l'application correspondante.
  - `userId`: identifiant du _safe_ de l'utilisateur.
  - `profId`: id du profil de la session.
  - `profAbout`: texte significatif pour l'utilisateur **crypté par la clé K du _safe_** décrivant le _profil_ de la session (par exemple `Revue des notes d'Alice et Jules`).
  - `prefs`: les préférences d'ouverture de la session (cryptées par la clé K du _safe_).
  - Il existe une base de données IDB de nom `app.x` (`x = SHA(userId / profId)`)contenant les documents en cache de cette session.
*/

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type Trusting = {
  userId: string
  pseudo: string
  cx: string
  Ka: Uint8Array
  Kp: Uint8Array
}

export type TSession = {
  app: string
  userId: string
  profId: string
  profAbout: string | Uint8Array
  prefs: Object | Uint8Array
}

const STORES = {
  header: 'id', // singleton: id = '1'
  trustings: 'id',
  tsessions: 'id'
}

function EX (e: Error, n: number) {
  const ex = new AppExc({code: 1200 + n, label: 'IDBS error', args: [e.message] })
  if (e && e.stack) ex.stack = e.stack
  return ex
}

class IDBS {
  static idbs: IDBS

  db : any
  keyK: Uint8Array
  mondebug: boolean

  constructor () {
    IDBS.idbs = this
    const config = stores.config
    this.mondebug = config.mondebug
    this.keyK = null
    if (this.mondebug) console.log('Open IDBS')
    try {
      this.db = new Dexie('safe', { autoOpen: true })
      this.db.version(1).stores(STORES)
    } catch (e) {
      throw EX(e, 1)
    }
  }
}

export const useSafeStore = defineStore('safe', () => {
  const devId = ref('')
  const devName = ref('')
  const trustings = ref(new Map<string, Trusting>())
  const tsessions = ref(new Map<string, TSession>())
  const cleK : Ref<Uint8Array> = ref()

  const open = async () => {
    try {
      const idbs = new IDBS()
      await idbs.db.open()
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const setK = async (k: string) => {
    IDBS.idbs.keyK = b64ToU8(k)
  }

  const getHeader = async () => {
    try {
      const r = await IDBS.idbs.db.header.get('1')
      devId.value = r && r.devId ? r.devId : ''
      devName.value = r && r.devName ? r.devName : ''
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const setHeader = async () => {
    try {
      await IDBS.idbs.db.header.put({
        id: '1',
        devId: devId.value || '',
        devName: devName.value || ''
      })
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const getTrustings = async () => {
    try {
      IDBS.idbs.db.trustings.each(async (r) => {
        const obj = decode(r.bin) as Trusting
        trustings.value.set(obj.userId, obj)
      })
      trustings.value.set('Bob', {pseudo: 'Bob', userId: '123'})
      // trustings.value.set('Alice', {pseudo: 'Alice', userId: '456'})
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const setTrusting = async (obj: Trusting) => {
    try {
      IDBS.idbs.db.trustings.put({ id: obj.userId, bin: encode(obj)})
      trustings.value.set(obj.userId, obj)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const delTrusting = async (userId: string) => {
    try {
      IDBS.idbs.db.trustings.delete({ id: userId })
      trustings.value.delete(userId)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const getTSessions = async () => {
    try {
      IDBS.idbs.db.tsessions.each(async (r) => {
        const obj = decode(r.bin) as TSession
        const x = obj.app + '/' + obj.userId + '/' + obj.profId
        const obj2 : TSession = { ...obj }
        obj2.profAbout = await Crypt.decrypt(cleK.value, obj.profAbout as Uint8Array)
        obj2.prefs = obj.prefs ? decode(await Crypt.decrypt(cleK.value, obj.prefs as Uint8Array)) : null
        trustings.value.set(x, obj2)
      })
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const setTSession = async (obj: TSession) => {
    try {
      const x = obj.app + '/' + obj.userId + '/' + obj.profId
      const id = Crypt.shaS(encoder.encode(x))
      const obj2 : TSession = { ...obj }
      obj2.profAbout = await Crypt.crypt(cleK.value, encoder.encode(obj.profAbout as string))
      obj2.prefs = obj.prefs ? await Crypt.crypt(cleK.value, encode(obj.prefs)) : null
      IDBS.idbs.db.tsessions.put({ id, bin: encode(obj2)})
      trustings.value.set(x, obj)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const delTSession = async (app: string, userId: string, profId: string) => {
    try {
      const x = app + '/' + userId + '/' + profId
      const id = Crypt.shaS(encoder.encode(x))
      IDBS.idbs.db.trustings.delete({ id })
      trustings.value.delete(x)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  return {
    open, setK, devId, devName, getHeader, setHeader,
    trustings, getTrustings, setTrusting, delTrusting,
    tsessions, getTSessions, setTSession, delTSession
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
