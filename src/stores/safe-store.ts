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
import { AppExc, b64ToU8, u8ToB64, equ8 } from '../src-fw/util'
import { Operation } from '../src-fw/operation'
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
  - `app`: code de l'application correspondante.
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
  Kr: Uint8Array
  Kp: Uint8Array
}

export type TSession = {
  app: string
  userId: string
  profId: string
  profAbout: string | Uint8Array
  prefs: Object | Uint8Array
}

export type Safe = {
  id: string // identifiant.
  pseudo: Uint8Array // pseudo / trigramme crypté par la clé K du _safe_.
  hp0: string // index unique, `SH(p0)`.
  hr0: string // index unique, `SH(r0)`.
  hhp1: string // SHA de `SH(p1)`.
  hhr1: string // SHA de `SH(r1)`.
  hhk: string // SHA de `SH(K)`.
  Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
  Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
  devices: Object
  creds: Object
  profiles: Object
  K?: Uint8Array
}

export type Auth = {
  pseudo: string
  hp0: string // index unique, `SH(p0)`.
  hr0: string // index unique, `SH(r0)`.
  hhp1: string // SHA de `SH(p1)`.
  hhr1: string // SHA de `SH(r1)`.
  hhk: string // SHA de `SH(K)`.
  Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
  Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
}

export type TrustDev = {
  userId: string
  devId: string
  sh1p: Uint8Array
  sh1r: Uint8Array
  devName: Uint8Array
  Va: Uint8Array
  cy: string
  sign: Uint8Array
}

export type Device = {
  devName: string | Uint8Array
  Va: Uint8Array
  cy: string
  sign: Uint8Array
  nbe: number
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
     } catch (e) {
      throw EX(e, 2)
    }
  }

  const getMyTrusting = () : Trusting => {
    if (trustings.value.size === 0) return null
    for(const [,item] of trustings.value)
      if (item.userId === userId.value) return item
    return null
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
        const obj2 : TSession = { ...obj } as TSession
        obj2.profAbout = await Crypt.decrypt(cleK.value, obj.profAbout as Uint8Array)
        obj2.prefs = obj.prefs ? decode(await Crypt.decrypt(cleK.value, obj.prefs as Uint8Array)) : null
        tsessions.value.set(x, obj2)
      })
      /*
      for(let i = 1; i < 10; i++)
        tsessions.value.set(i, { app: 'app' + i,
        profAbout: 'bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla '  + i})
      */
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const getMySessions = () : TSession[] => {
    const t: TSession[] = []
    for(const [,x] of tsessions.value)
      // if (x.userId === userId.value) t.push(x)
      t.push(x)
    return t
  }

  const setTSession = async (obj: TSession) => {
    try {
      const x = obj.app + '/' + obj.userId + '/' + obj.profId
      const id = Crypt.shaS(encoder.encode(x))
      const obj2 : TSession = { ...obj }
      obj2.profAbout = await Crypt.crypt(cleK.value, encoder.encode(obj.profAbout as string))
      obj2.prefs = obj.prefs ? await Crypt.crypt(cleK.value, encode(obj.prefs)) : null
      IDBS.idbs.db.tsessions.put({ id, bin: encode(obj2)})
      tsessions.value.set(x, obj)
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

  /* Safe *****************************************************/
  const userId = ref(null)
  const keyK = ref(null)
  // 1: par P0, 2: par R0, 3: par PIN
  const openMode : Ref<number> = ref(0)
  const sh1p = ref(null)
  const sh1r = ref(null)

  /* Section auth du safe */
  const auth: Ref<Auth> = ref(null)

  /* Chaque _device de confiance_ à une entrée  dans cette section identifiée par `devid` (un identifiant généré aléatoirement):
    - `about` : code / texte court **crypté par la clé K du _safe_** donné par l'utilisateur pour qualifier le _device_ (par exemple `PC d'Alice`).
    - `{ Va, cy, sign, nbe }` : propriétés permettant de valider que ce _device_ est de confiance (voir plus loin).
  */
  const devices = ref(Map<string, Device>)

  const compileSafe = async (safe: Safe) => {
    auth.value = {
      pseudo: decoder.decode(await Crypt.decrypt(keyK.value, safe.pseudo)),
      hp0: safe.hp0,
      hr0: safe.hr0,
      hhp1: safe.hhp1,
      hhr1: safe.hhr1,
      hhk: safe.hhk,
      Ka: safe.Ka,
      Kr: safe.Kr,
    }

    const m = new Map<string, Device>()
    for (const devId in safe.devices) {
      const d: Device = safe.devices[devId]
      d.devName = decoder.decode(await Crypt.decrypt(keyK.value, d.devName as Uint8Array))
      m.set(devId, d)
    }
    devices.value = m
    const tr = getMyTrusting()
    if (tr && (!equ8(tr.Ka, auth.value.Ka) || !equ8(tr.Kr, auth.value.Kr))) {
      tr.Ka = auth.value.Ka
      tr.Kr = auth.value.Kr
      setTrusting(tr)
    }

  }

  const createSafe = async (
    createMode: boolean,
    trig: string,
    psh0: Uint8Array, psh1: Uint8Array, psh: Uint8Array,
    rsh0: Uint8Array, rsh1: Uint8Array, rsh: Uint8Array,) => {

    const K = createMode ? Crypt.random(32) : keyK.value
    const id = createMode ? Crypt.rnd(12) : userId.value
    const shK = await Crypt.strongHash(K, false, true)

    const safe: Safe = {
      id,
      pseudo: await Crypt.crypt(K, encoder.encode(trig)),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      hhk: Crypt.shaS(shK),
      Ka: await Crypt.crypt(psh, K),
      Kr: await Crypt.crypt(rsh, K),
      devices: {},
      creds: {},
      profiles: {}
    }
    const ret = await new Operation(createMode ? '$CreateSafe' : '$UpdCodesSafe').post({ safe })
    if (ret.status === 0) {
      openMode.value = 1
      userId.value = id
      keyK.value = K
      sh1p.value = psh1
      sh1r.value = rsh1
      await compileSafe(createMode ? safe : ret.safe)
    }
    return ret.status
  }

  const openSafe = async ( sh0: Uint8Array, sh1: Uint8Array, sh: Uint8Array) => {
    const ret = await new Operation('$OpenSafeByPR').post({sh0, sh1})
    if (ret.status === 0) {
      openMode.value = ret.byP ? 1 : 2
      userId.value = ret.safe.id
      keyK.value = await Crypt.decrypt(sh, ret.byP ? ret.safe.Ka : ret.safe.Kr)
      if (ret.byP) { sh1p.value = sh1; sh1r.value =  null }
      else { sh1p.value = sh1; sh1r.value = sh1 }
      await compileSafe(ret.safe)
    }
    return ret.status
  }

  const setTrust = async (name: string, pin: string) => {
    if (!devId.value || name !== devName.value) { // put Header
      if (!devId.value) devId.value = Crypt.rnd(12)
      devName.value = name
      await setHeader()
    }

    const cx = Crypt.rnd(24)
    const cy = Crypt.rnd(24)
    // `Kp`: clé K du safe de l'utilisateur cryptée par `SH(PIN / cx / cy)`
    const pincxcy: Uint8Array = await Crypt.strongHash(pin + '/' + cx + '/' + cy, false, true) as Uint8Array
    const pincx: Uint8Array = await Crypt.strongHash(pin + '/' + cx, false, true) as Uint8Array
    const Kp = await Crypt.crypt(pincxcy, keyK.value)

    let t: Trusting = getMyTrusting()
    if (!t) t = {
        userId: userId.value,
        pseudo: auth.value.pseudo,
        cx: cx,
        Ka: auth.value.Ka,
        Kr: auth.value.Kr,
        Kp: Kp
      }
    else {
      t.cx = cx
      t.Ka = auth.value.Ka
      t.Kr = auth.value.Kr
      t.Kp = Kp
    }
    await setTrusting(t)

    /*
    - génère un couple `Sa Va` de clés asymétriques signature / vérification.
    - calcule `sign`, signature par `Sa` du `SH(PIN, cx)`.
    - transmet au module _safe terminal_
      `userId, devId, sh1p, sh1r, devName(crypté par K), Va, cy, sign`
    */
    const [Va, Sa] = await Crypt.getSVKeyPair()
    const sign = await Crypt.sign(Sa, pincx)
    const trustDev: TrustDev = {
      userId: userId.value,
      devId: devId.value,
      sh1p: sh1p.value,
      sh1r: sh1r.value,
      devName: await Crypt.crypt(keyK.value, encoder.encode(devName.value)),
      Va, cy, sign
    }
    const ret = await new Operation('$TrustDevice').post({trustDev})
    await compileSafe(ret.safe)
    return ret.status
  }

  const openSafeByPin = async ( pin: string, id: string) => {
    userId.value = id
    const tr = getMyTrusting()
    if (!tr) return 1
    const pincx: Uint8Array = await Crypt.strongHash(pin + '/' + tr.cx, false, true) as Uint8Array

    const ret = await new Operation('$OpenSafeByPin')
      .post({userId: userId.value, devId: devId.value, pincx})
    if (ret.status !== 0) return ret.status
    const cy = ret.cy
    const pincxcy: Uint8Array = await Crypt.strongHash(pin + '/' + tr.cx + '/' + cy, false, true) as Uint8Array
    try {
      keyK.value = await Crypt.decrypt(pincxcy, tr.Kp)
    } catch (e) {
      return 4
    }
    const shk = await Crypt.strongHash(keyK.value, false, true)
    const ret2 = await new Operation('$OpenSafeById').post({userId: userId.value, shk})
    if (ret2.status) return 2
    openMode.value = 3
    await compileSafe(ret2.safe)
    return 0
  }

  const setUntrust = async () => {
    // TODO
  }

  return {
    open, setK, devId, devName, getHeader, setHeader,
    trustings, getTrustings, setTrusting, delTrusting, getMyTrusting,
    tsessions, getTSessions, setTSession, delTSession, getMySessions,
    userId, keyK, openMode, auth, devices,
    createSafe, openSafe, openSafeByPin, setTrust, setUntrust
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
