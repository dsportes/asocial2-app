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

class Trusting {
  userId: string
  pseudo: string

  get isLocal () { return this.userId.startsWith('$')}

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }
}

class TrustingS extends Trusting {
  cx: string
  Ka: Uint8Array
  Kr: Uint8Array
  Kp: Uint8Array

  constructor (obj: Object) { 
    super() 
    if (obj) for(const f of Object.keys(obj)) this[f] = obj[f]
  }
}

class TrustingL extends Trusting {
  hsh: Uint8Array // sha du SH(PS) (PS: phrase secrète de l'utilisateur)
  creds: string[] // liste des ids des credentials
  prefs: Uint8Array // objet de préférences crypté par SH(PS)

  constructor (obj: Object) { 
    super() 
    if (obj) for(const f of Object.keys(obj)) this[f] = obj[f]
  }
}

class TSession {
  app: string // code de l'application
  userId: string // id de l'utilisateur ou '' pour un local
  profId: string // id du profil
  profAbout: Uint8Array // commentaire de l'utilisateur sur ce profil
  profAboutStr: string
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }

  get dbName () : string { return this.app + '_' + Crypt.shaS(this.userId + '/' + this.profId)}
  get idOfS () : string { 
    return Crypt.shaS(this.app + '/' + this.userId + '/' + this.profId) }
}

type Pref = [code: string, obj: Object]

type Safe = {
  id: string // identifiant aléatoire.
  pseudo: Uint8Array // pseudo / trigramme crypté par la clé K du _safe_.
  hp0: string // index unique, `SH(p0)`.
  hr0: string // index unique, `SH(r0)`.
  hhp1: string // SHA de `SH(p1)`.
  hhr1: string // SHA de `SH(r1)`.
  hhk: string // SHA de `SH(K)`.
  C: Uint8Array // clé publique de cryptage.
  DK: Uint8Array // clé privée de décryptage, cryptée par la clé K
  S: Uint8Array // clé publique de signature.
  VK: Uint8Array // clé privée de vérification, cryptée par la clé K
  Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
  Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
  devices: Object
  creds: Object
  profiles: Object
  prefs: Object // pour chaque application, liste des préférences déclarées (ordonnée par date d'utilisation)
}

type Auth = {
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

type TrustDev = {
  userId: string
  devId: string
  sh1p: Uint8Array
  sh1r: Uint8Array
  devName: Uint8Array
  Va: Uint8Array
  cy: string
  sign: Uint8Array
}

type UntrustDev = {
  userId: string
  devId: string
  sh1p: Uint8Array
  sh1r: Uint8Array
}

type Device = {
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
  prefs: 'id', // id: app / userId - bin: cryptage par K du user de son pref ([code, obj])
  creds: 'id' 
  /* id: profId + '/' id du droit d'accès
  bin: contenu de l'objet _droit_ crypté par la cléK locale.
  */
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

export const useSafeStore = defineStore('safe', () => {
  const db = ref(null) // IDB safe locale
  const incognito = ref(false)

  const hasIDBS = computed(() => db.value !== null)

  // Safe IDB : image en mémoire
  const devId = ref('') // Depuis IDB Header
  const devName = ref('') // Depuis IDB Header
  const trustings : Ref<Map<string, Trusting>> = ref() // Depuis IDB trustings
  const tsessions : Ref<Map<string, TSession>> = ref() // Depuis IDB tsessions
  // préférences du user COURANT pour l'application COURANTE
  const currentPref : Ref<Pref> = ref(null)  // Depuis prefs (partiel)

  const init0 = async () : Promise<boolean> => {
    try {
      trustings.value = new Map<string, Trusting>()
      tsessions.value = new Map<string, TSession>()
      devId.value = ''
      devName.value = ''
      const exists = await Dexie.exists('safe')
      if (exists) {
        db.value = new Dexie('safe')
        db.value.version(1).stores(STORES)
        const r = await db.value.header.get('1')
        devId.value = r && r.devId ? r.devId : ''
        devName.value = r && r.devName ? r.devName : ''

        await db.value.trustings.each(async (r) => {
          try {
            const obj = decode(r.bin)
            const t : Trusting = obj.userId.startsWith('$') ? 
              new TrustingL(obj) : new TrustingS(obj)
            trustings.value.set(t.userId, t)
          } catch (e) {
            console.log(e)
          }
        })

        await db.value.tsessions.each(async (r) => {
          try {
            const obj = decode(r.bin)
            const s : TSession = new TSession(obj)
            tsessions.value.set(s.idOfS, s)
          } catch (e) {
            console.log(e)
          }
        })
        // await simulation()

        console.log('Init0 IDBS OK - devId:[' + devId.value + '] devName:[' + devName.value + ']')
        return true
      } else {
        db.value = null
        console.log('Init0 IDBS failed.')
        return false
      }
    } catch (e) {
      if (db.value) { 
        await db.value.close()
        db.value = null
      }
      console.log('Init0 IDBS failed: ' + e.message)
      return false
    }
  }

  // Appel UNIQUEMENT quand IDB Safe n'existe pas (encore) - La créé vide
  const init1 = async () => {
    try {
      db.value = new Dexie('safe')
      db.value.version(1).stores(STORES)
      await db.value.header.put({ id: '1', devId: '', devName: '' })
      console.log('Init1 IDBS OK.')
    } catch (e) {
      console.log('Init1 IDBS failed: ' + e.message)
      throw EX(e, 1)
    }
  }

  const simulation = async () => {
    const app = stores.config.appname
    if (tsessions.value.size === 0)
      for(const [userId, ] of trustings.value) {
        const profId = '!!' + userId
        const obj = {
          app,
          userId,
          profId,
          profAbout: encoder.encode('bla bla ' + profId),
          profAboutStr: '',
          size: [1500, 12000000],
          time: Date.now() - (Math.floor(Math.random() * 50) * 60000)
        }
        const s : TSession = new TSession(obj)
        const id = s.idOfS
        tsessions.value.set(id, s)
        await db.value.tsessions.put({ id, bin: encode(obj)})
      }
  }

  const setHeader = async () => {
    if (incognito.value) return
    try {
      await db.value.header.put({
        id: '1',
        devId: devId.value || '',
        devName: devName.value || ''
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

  const setTrusting = async (t: Trusting) => {
    if (incognito.value) return
    try {
      const obj = t.toObj
      await db.value.trustings.put({ id: t.userId, bin: encode(obj)})
      trustings.value.set(t.userId, t)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const delTrusting = async (id: string) => {
    if (incognito.value) return
    try {
      await db.value.trustings.where({id}).delete()
      trustings.value.delete(id)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const decryptSessions = async () : Promise<void> => {
    for (const [, s] of tsessions.value) {
      if (s.userId === userId.value) {
        const x = await Crypt.decrypt(keyK.value, s.profAbout)
        s.profAboutStr = x ? decoder.decode(x) : decoder.decode(s.profAbout)
      } else s.profAboutStr = ''
    }
  }

  const pseudoOfS = (s: TSession) : string => {
    const t = trustings.value.get(s.userId)
    return t ? t.pseudo : '?'
  }

  const getMySessions = (appOnly?: boolean) : TSession[] => {
    const app = stores.config.appname
    const t: TSession[] = []
    for(const [,x] of tsessions.value)
      if (x.userId === userId.value && (!appOnly || x.app ===  app)) t.push(x)
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

  const setTSession = async (s: TSession, razdb?: boolean) => {
    if (incognito.value) return
    try {
      const ab = s.profAboutStr
      const id = s.idOfS
      s.time = Date.now()
      s.profAbout = await Crypt.crypt(keyK.value, encoder.encode(ab))
      s.profAboutStr = ''
      await db.value.tsessions.put({ id, bin: encode(s.toObj)})
      s.profAboutStr = ab
      tsessions.value.set(id, s.toObj)
      recordIDB(s.dbName)
      
      if (razdb)
        try {
          await Dexie.delete(s.dbName)
          await sleep(300)
          console.log(s.dbName + ' deleted')
        } catch (e) {
          console.log(s.dbName + ' deletion FAILED: ', e.message())
        }

    } catch (e) {
      throw EX(e, 2)
    }
  }

  const purgeIDBS = async (l: string[]) => {
    if (incognito.value) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    for (const ids of l) {
      const s = tsessions.value.get(ids) as TSession
      const dbName = s.dbName
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
    if (incognito.value) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    const n = dbl.indexOf(dbName)
    if (n === -1) dbl.push(dbName)
    localStorage.setItem('$DBLIST', dbl.join(' '))
  }

  const delTSession = async (s: TSession) => {
    if (incognito.value) return
    const id = s.idOfS
    // console.log("tsession: ", id)
    try { await db.value.tsessions.where({ id }).delete()
    } catch (e) { } 
    tsessions.value.delete(id)
  }

  // Charge depuis IDB currentPref avec la préférence du user pour l'application en cours
  const getCurrentPref = async () => {
    const app = stores.config.appname
    const id = Crypt.shaS(app + '/' + userId.value)
    try {
      const x = await db.value.prefs.get(id)
      currentPref.value = !x ? null : decode(await Crypt.decrypt(keyK.value, x.bin)) as Pref
    } catch (e) {
      throw EX(e, 2)
    }
  }

  // Charge les creds listés ou tous si absence de liste d'ids
  const getCreds = async (locK: Uint8Array, lids?: string[]) 
    : Promise<Map<string, Object>> => {
    const sids = lids && lids.length ? new Set(lids) : null
    const creds = new Map<string, Object>()
    await db.value.creds.each(async (r) => {
      try {
        if (!sids || sids.has(r.id)) {
          const x = await Crypt.decrypt(locK, r.bin)
          let obj 
          try {
            obj = decode(x)
            creds.set(r.id, obj)
          } catch (e) {}
        }
      } catch (e) {
        console.log(e)
      }
    })
    return creds
  }


  /* Enregistre ou supprime en IDB la préférence courante
  de l'utilisateur courant pour l'application courante
  */
  const saveCurrentPref = async () => {
    if (incognito.value) return
    try {
      const app = stores.config.appname
      const id = Crypt.shaS(app + '/' + userId.value)
      if (currentPref.value) {
        const bin = await Crypt.crypt(keyK.value, encode(currentPref.value))
        await db.value.prefs.put({ id, bin })
      } else {
        await db.value.prefs.where({id}).delete()
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
  const S : Ref<Uint8Array> = ref(null)
  const V : Ref<Uint8Array> = ref(null)
  const VK : Ref<Uint8Array> = ref(null)
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
      DK: safe.DK,
      S: safe.S,
      VK: safe.VK
    }

    // devices
    const m = new Map<string, Device>()
    for (const devId in safe.devices) {
      const d: Device = safe.devices[devId]
      d.devName = decoder.decode(await Crypt.decrypt(keyK.value, d.devName as Uint8Array))
      m.set(devId, d)
    }
    devices.value = m
    const tr = getMyTrusting() as TrustingS
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
      userId.value = Crypt.shaS(Crypt.random(32))
      keyK.value = Crypt.random(32)
      const [Cy, Dy] = await Crypt.getKeyPair()
      C.value = Cy
      D.value = Dy
      DK.value = await Crypt.crypt(keyK.value, Dy)
      const [Sy, Vy] = await Crypt.getKeyPair()
      S.value = Sy
      V.value = Vy
      VK.value = await Crypt.crypt(keyK.value, Vy)
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
      S: S.value,
      VK: VK.value,
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
      shK.value = await Crypt.strongHash(keyK.value, false, true)
      D.value = await Crypt.decrypt(keyK.value, ret.DK)
      V.value = await Crypt.decrypt(keyK.value, ret.VK)
      if (ret.byP) { sh1p.value = sh1; sh1r.value =  null }
      else { sh1p.value = sh1; sh1r.value = sh1 }
      await compileSafe(ret.safe)
    }
    return ret.status
  }

  const setTrust = async (name: string, pin: string, pseudo: string) => {
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

    let t: TrustingS = getMyTrusting() as TrustingS
    if (!t) {
      t = new TrustingS({
        userId: userId.value,
        pseudo: pseudo,
        cx: cx,
        Ka: auth.value.Ka,
        Kr: auth.value.Kr,
        Kp: Kp
      }) 
    } else {
      t.pseudo = pseudo
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
    const t : TrustingS = getMyTrusting() as TrustingS
    if (!t) return 1
    const pincx: Uint8Array = await Crypt.strongHash(pin + '/' + t.cx, false, true) as Uint8Array

    const ret = await new Operation('$OpenSafeByPin')
      .post({userId: userId.value, devId: devId.value, pincx})
    if (ret.status !== 0) return ret.status
    const cy = ret.cy
    const pincxcy: Uint8Array = await Crypt.strongHash(pin + '/' + t.cx + '/' + cy, false, true) as Uint8Array
    try {
      keyK.value = await Crypt.decrypt(pincxcy, t.Kp)
    } catch (e) {
      return 4
    }
    const shk = await Crypt.strongHash(keyK.value, false, true)
    const ret2 = await new Operation('$OpenSafeById').post({userId: userId.value, shk})
    if (ret2.status) return 2
    openMode.value = 3
    D.value = await Crypt.decrypt(keyK.value, ret.DK)
    V.value = await Crypt.decrypt(keyK.value, ret.VK)
    await compileSafe(ret2.safe)
    return 0
  }

  const setUntrust = async () => {
    const t = getMyTrusting() as TrustingS
    if (!t) return 0 // était déjà untrusted
    await delTrusting(t.userId)
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

  const newTrustingL = (obj) => new TrustingL(obj)
  const newTrustingS = (obj) => new TrustingS(obj)
  const newTSession = (obj) => new TSession(obj)

  return {
    recordIDB, resetAllLocal,
    incognito, hasIDBS, init0, init1, devId, devName, 
    setHeader,
    newTrustingS, newTrustingL, newTSession,
    trustings, setTrusting, delTrusting, getMyTrusting,
    tsessions, setTSession, delTSession, getMySessions,
    getSessionSize, pseudoOfS, decryptSessions, volOfS, purgeIDBS,
    currentPref, getCurrentPref, saveCurrentPref,
    getCreds,
    userId, keyK, openMode, auth, devices,
    createSafe, openSafe, openSafeByPin, setTrust, setUntrust
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
