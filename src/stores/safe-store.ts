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
import { AppExc, sleep, u8ToB64, equ8 } from '../src-fw/util'
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
  - `Kr`: clé K du safe de l'utilisateur cryptée par `SH(r0, r1)`.
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

/* Coefficients donnant le volume réel depuis le volume utile
pour chaque type de volume (documents / fichiers)
*/
const coeffs = [2, 1.3]

export type Trusting = {
  userId: string
  pseudo: string
  cx: string
  Ka: Uint8Array
  Kr: Uint8Array
  Kp: Uint8Array
}

export type TSession = {
  app: string // code de l'application
  userId: string // id de l'utilisateur
  profId: string // id de sa liste de droits
  profAbout: string | Uint8Array // commentaire de l'utilisateutr sur ce profil
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal
  // IDB name: app + '_' + shaS(userId + '/' + profId)
}

export type Pref = [code: string, obj: Object]

export type Safe = {
  id: string // identifiant.
  pseudo: Uint8Array // pseudo / trigramme crypté par la clé K du _safe_.
  hp0: string // index unique, `SH(p0)`.
  hr0: string // index unique, `SH(r0)`.
  hhp1: string // SHA de `SH(p1)`.
  hhr1: string // SHA de `SH(r1)`.
  hhk: string // SHA de `SH(K)`.
  C: Uint8Array // clé publique de cryptage. id = shaS(C)
  DK: Uint8Array // clé privée de décryptage, cryptée par la clé K
  Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
  Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
  devices: Object
  creds: Object
  profiles: Object
  prefs: Object // pour chaque application, liste des préférences déclarées (ordonnée par date d'utilisation)
}

export type Auth = {
  pseudo: string
  hp0: string // index unique, `SH(p0)`.
  hr0: string // index unique, `SH(r0)`.
  hhp1: string // SHA de `SH(p1)`.
  hhr1: string // SHA de `SH(r1)`.
  hhk: string // SHA de `SH(K)`.
  C: Uint8Array // clé publique de cryptage. id = shaS(C)
  DK: Uint8Array // clé privée de décryptage, cryptée par la clé K
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

export type UntrustDev = {
  userId: string
  devId: string
  sh1p: Uint8Array
  sh1r: Uint8Array
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
  tsessions: 'id',
  prefs: 'id' // id: app / userId - bin: cryptage par K du user de son pref ([code, obj])
}

function EX (e: Error, n: number) {
  const ex = new AppExc({code: 1200 + n, label: 'IDBS error', args: [e.message] })
  if (e && e.stack) ex.stack = e.stack
  return ex
}

async function resetAllLocal () {
  await Dexie.delete('safe')
  const x = localStorage.getItem('$DBLIST') || ''
  const dbl = x.split(' ')
  for (const dbName of dbl)
    if (dbName) await Dexie.delete(dbName)
  localStorage.removeItem('$DBLIST')
}

class IDBS {
  static idbs: IDBS

  db : any

  constructor () {
    IDBS.idbs = this
    if (stores.config.mondebug) console.log('Open IDBS')
    try {
      this.db = new Dexie('safe', { autoOpen: true })
      this.db.version(1).stores(STORES)
    } catch (e) {
      throw EX(e, 1)
    }
  }
}

export const useSafeStore = defineStore('safe', () => {
  // Safe IDB : image en mémoire
  const devId = ref('') // Depuis IDB Header
  const devName = ref('') // Depuis IDB Header
  const trustings = ref(new Map<string, Trusting>()) // Depuis IDB trustings
  const tsessions = ref(new Map<string, TSession>()) // Depuis IDB tsessions
  // préférences du user COURANT pour l'application COURANTE
  const currentPref : Ref<Pref> = ref(null)  // Depuis prefs (partiel)

  const open = async () => {
    try {
      const idbs = new IDBS()
      await idbs.db.open()
    } catch (e) {
      throw EX(e, 2)
    }
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
      await IDBS.idbs.db.trustings.each(async (r) => {
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
      await IDBS.idbs.db.trustings.put({ id: obj.userId, bin: encode(obj)})
      trustings.value.set(obj.userId, obj)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const delTrusting = async (id: string) => {
    try {
      await IDBS.idbs.db.trustings.where({id}).delete()
      trustings.value.delete(id)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const trigOfS = (s: TSession) : string => {
    const x = trustings.value.get(s.userId)
    return x ? (x.pseudo || '?') : '?'
  }

  const dbNameOfS = (s: TSession) : string => {
    return s.app + '_' + Crypt.shaS(s.userId + '/' + s.profId)
  }

  const idOfS = (obj: TSession) : string => {
    return obj.app + '/' + obj.userId + '/' + obj.profId
  }

  const getTSessions = async () => {
    const app = stores.config.appname
    try {
      await IDBS.idbs.db.tsessions.each(async (r) => {
        const obj = decode(r.bin) as TSession
        const obj2 : TSession = { ...obj } as TSession
        obj2.profAbout = await Crypt.decrypt(keyK.value, obj.profAbout as Uint8Array)
        tsessions.value.set(idOfS(obj), obj2)
      })

      // simulation
      for(const [userId, t] of trustings.value) {
        const profId = '!!' + userId
        const s : TSession = {
          app,
          userId,
          profId,
          profAbout: 'bla bla ' + profId,
          size: [1500, 12000000],
          time: Date.now() - (Math.floor(Math.random() * 50) * 60000)
        }
        await setTSession(s)
      }

    } catch (e) {
      throw EX(e, 2)
    }
  }

  const getMySessions = () : TSession[] => {
    const t: TSession[] = []
    for(const [,x] of tsessions.value)
      if (x.userId === userId.value) t.push(x)
    return t
  }

  /* Retourne la taille estimée de LA session citée 
  ou de toutes celles de l'utilisateur,
  ou de toutes
  */
  const getSessionSize = (userId?: string, profId?: string) : number => {
    let t = 0
    for(const [,x] of tsessions.value) {
      if (userId && x.userId !== userId) continue
      if (profId && x.profId !== profId) continue
      for(let i = 0; i < coeffs.length; i++) t += coeffs[i] + (x.size[i] || 0)
    }
    return t
  }

  const volOfS = (s: TSession) : number => {
    return getSessionSize(s.userId, s.profId)
  }

  const setTSession = async (obj: TSession) => {
    try {
      const id = Crypt.shaS(idOfS(obj))
      // console.log("tsession: ", id)
      const obj2 : TSession = { ...obj }
      obj2.profAbout = await Crypt.crypt(keyK.value, encoder.encode(obj.profAbout as string))
      await IDBS.idbs.db.tsessions.put({ id, bin: encode(obj2)})
      tsessions.value.set(id, obj)
      recordIDB(dbNameOfS(obj))
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const purgeIDBS = async (l: string[]) => {
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    for (const ids of l) {
      const s = tsessions.value.get(ids) as TSession
      const dbName = dbNameOfS(s)
      try {
        await Dexie.delete(dbName)
        await sleep(300)
        const n = dbl.indexOf(dbName)
        if (n !== -1) dbl.splice(n, 1)
        console.log(dbName + ' deleted')
      } catch (e) {
        console.log(dbName + ' deletion FAILED: ', e.message())
      }
      localStorage.setItem('$DBLIST', dbl.join(' '))
      await delTSession(s)
    }
  }

  const recordIDB = (dbName: string) => {
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    const n = dbl.indexOf(dbName)
    if (n === -1) dbl.push(dbName)
    localStorage.setItem('$DBLIST', dbl.join(' '))
  }

  const delTSession = async (obj: TSession) => {
    const id = Crypt.shaS(idOfS(obj))
    // console.log("tsession: ", id)
    try { await IDBS.idbs.db.trustings.where({ id }).delete()
    } catch (e) { } 
    trustings.value.delete(id)
  }

  // Charge depuis IDB currentPref avec la préférence du user pour l'application en cours
  const getCurrentPref = async () => {
    const app = stores.config.appname
    const id = Crypt.shaS(app + '/' + userId.value)
    try {
      const x = await IDBS.idbs.db.prefs.get(id)
      currentPref.value = !x ? null : decode(await Crypt.decrypt(keyK.value, x.bin)) as Pref
    } catch (e) {
      throw EX(e, 2)
    }
  }

  /* Enregistre ou supprime en IDB la préférence courante
  de l'utilisateur courant pour l'application courante
  */
  const saveCurrentPref = async () => {
    try {
      const app = stores.config.appname
      const id = Crypt.shaS(app + '/' + userId.value)
      if (currentPref.value) {
        const bin = await Crypt.crypt(keyK.value, encode(currentPref.value))
        await IDBS.idbs.db.prefs.put({ id, bin })
      } else {
        await IDBS.idbs.db.prefs.where({id}).delete()
      }
    } catch (e) {
      throw EX(e, 2)
    }
  }
  
  /**********************************************************************
  Safe central : copie locale du safe de l'utilisateur courant
  - permet un affichage complet, y compris pour les données relatives
    aux autres applications que celle qui s'exécute.
  **********************************************************************/
  const userId = ref(null)
  const keyK = ref(null)
  const openMode : Ref<number> = ref(0) // 0: pas ouvert, 1: par P0, 2: par R0, 3: par PIN
  const C : Ref<Uint8Array> = ref(null)
  const D : Ref<Uint8Array> = ref(null)
  const DK : Ref<Uint8Array> = ref(null)
  const sh1p = ref(null)
  const sh1r = ref(null)
  const shK = ref(null)

  /* Section "auth" */
  const auth: Ref<Auth> = ref(null)

  /* Section "devices de confiance" *****************************************************
  Une entrée par device identifiée par `devid`:
  - `about` : code / texte court **crypté par la clé K du _safe_** 
    donné par l'utilisateur pour qualifier le _device_ (par exemple `PC d'Alice`).
  - `{ Va, cy, sign, nbe }` : propriétés cryptographiques permettant de valider 
    que ce _device_ est de confiance.
  ****************************************************************************************/
  const devices = ref(Map<string, Device>) // cle devid

  /* Section "préférences" **************************************************************
  Une entrée par application** donnant une liste de couples `code, obj` 
  ( **cryptés par la clé K**) ordonnée par dernière utilisation:
  - `code` : texte court parlant pour l'utilisateur correspondant à un de ses usages 
    habituels de l'application comme `mobile, large, simple, expert ...`.
  - `obj`: objet donnant les valeurs des _préférences_ à utiliser à l'ouverture d'une session.
  **************************************************************************************/
  const prefs = ref(Map<String, Pref[]>) // clé app

  /* K et D ont été décryptés dans keyK.value et D.value */
  const compileSafe = async (safe: Safe) => {
    const appname = stores.config.appname
    auth.value = {
      pseudo: decoder.decode(await Crypt.decrypt(keyK.value, safe.pseudo)),
      hp0: safe.hp0,
      hr0: safe.hr0,
      hhp1: safe.hhp1,
      hhr1: safe.hhr1,
      hhk: safe.hhk,
      Ka: safe.Ka,
      Kr: safe.Kr,
      C: safe.C,
      DK: safe.DK
    }

    // devices
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
    
    // prefs
    const p = new Map<string, Pref[]>() // clé: app, value: liste de prefs
    for (const app in safe.prefs) {
      const lx = safe.prefs[app] as Uint8Array
      const lp: Pref[] = decode(await Crypt.decrypt(keyK.value, lx)) as Pref[]
      p.set(app, lp)
      if (app === appname && currentPref.value) {
        const c = currentPref.value.code as string
        let f = false
        for (const p of lp) {
          const [code, obj] = p
          if (code === c) { // Rafraichissement de l'objet de préférence courante
            currentPref.value.obj = obj
            await saveCurrentPref()
          }
        }
      }
    }
    prefs.value = p

  }

  /* Retourne depuis le Safe central actuellement en mémoire
  la liste (éventuellement vide) des prefs relative à l'application (et au user)
  */
  const getMySafePrefs = () : Pref[] => {
    const app = stores.config.appname
    const x = prefs.value.get(app)
    return x ? x : []
  }

  const createSafe = async (
    createMode: boolean,
    trig: string,
    psh0: Uint8Array, psh1: Uint8Array, psh: Uint8Array,
    rsh0: Uint8Array, rsh1: Uint8Array, rsh: Uint8Array,) => {

    if (createMode) {
      if (openMode.value !== 0) return 9
      keyK.value = Crypt.random(32)
      const [Cy, Dy] = await Crypt.getKeyPair()
      C.value = Cy
      D.value = Dy
      DK.value = await Crypt.crypt(keyK.value, Dy)
      userId.value = Crypt.shaS(C.value)
      sh1p.value = psh1
      sh1r.value = rsh1
      shK.value = await Crypt.strongHash(keyK.value, false, true)
    } else {
      if (openMode.value === 0) return 9
    }

    const safe: Safe = {
      id: userId.value,
      C: C.value,
      DK: DK.value,
      pseudo: await Crypt.crypt(keyK.value, encoder.encode(trig)),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      hhk: Crypt.shaS(shK.value),
      Ka: await Crypt.crypt(psh, keyK.value),
      Kr: await Crypt.crypt(rsh, keyK.value),
      devices: {},
      creds: {},
      profiles: {},
      prefs: {}
    }
    const ret = await new Operation(createMode ? '$CreateSafe' : '$UpdCodesSafe').post({ safe })
    if (ret.status === 0) {
      openMode.value = 1
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
      D.value = await Crypt.decrypt(keyK.value, ret.DK)
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
    D.value = await Crypt.decrypt(keyK.value, ret.DK)
    await compileSafe(ret2.safe)
    return 0
  }

  const setUntrust = async () => {
    const tr = getMyTrusting()
    if (!tr) return 0 // était déjà untrusted
    await delTrusting(tr.userId)
    const untrustDev: UntrustDev = {
      userId: userId.value,
      devId: devId.value,
      sh1p: sh1p.value,
      sh1r: sh1r.value
    }
    const ret = await new Operation('$UntrustDevice').post({untrustDev})
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  return {
    recordIDB, resetAllLocal,
    open, devId, devName, getHeader, setHeader,
    trustings, getTrustings, setTrusting, delTrusting, getMyTrusting,
    tsessions, getTSessions, setTSession, delTSession, getMySessions,
    getSessionSize, trigOfS, volOfS, idOfS, dbNameOfS, purgeIDBS,
    currentPref, getCurrentPref, saveCurrentPref,
    userId, keyK, openMode, auth, devices,
    createSafe, openSafe, openSafeByPin, setTrust, setUntrust
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
