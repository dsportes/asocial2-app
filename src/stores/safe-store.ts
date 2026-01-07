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
  prefs: Uint8Array // objet de préférences utilisé la dernière fois crypté par SH(PS)

  constructor (obj: Object) { 
    super() 
    if (obj) for(const f of Object.keys(obj)) this[f] = obj[f]
  }
}

class TSession {
  app: string // code de l'application
  userId: string // id de l'utilisateur
  profId: string // id du profil
  about: Uint8Array // commentaire de l'utilisateur sur cette session
  aboutStr: string
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal
  creds: string[] // liste des codes des credentials
  /* about, aboutStr, creds
  - pour un utilisateur enregistré sont tirés de son profile
  - pour un utilisateur sont directement enregistré ici
  */

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

type Profile = {
  about: string
  creds: string[]
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

  /*
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
  */

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

  const pseudoOfS = (s: TSession) : string => {
    const t = trustings.value.get(s.userId)
    return t ? t.pseudo : '?'
  }

  const getMySessions = async (locK: Uint8Array) : Promise<[TSession[], TSession[]]> => {
    const app = stores.config.appname
    const mpf = profiles.value.get(app)
    const tok: TSession[] = []
    const tko: TSession[] = []
    for(const [,x] of tsessions.value)
      if (x.userId === userId.value && x.app ===  app) {
        if (userId.value.startsWith('$')) {
          // Utilisateur local - l'about et creds de sa session est dans TSession
          const y = await Crypt.decrypt(locK, x.about)
          x.aboutStr = y ? decoder.decode(y) : ''
          tok.push(x)
        } else {
          // Utilisateur enregistré - l'about et creds de la session sont tirés du profile
          const profile = mpf.get(x.profId)
          if (profile) {
            x.about = profile.about
            const y = await Crypt.decrypt(keyK.value, x.about)
            x.aboutStr = y ? decoder.decode(y) : ''
            tok.push(x) 
          } else tko.push(x)
        }
      }
    return [tok, tko]
  }

  const getMyProfiles = () : Map<string, Profile> => {
    const app = stores.config.appname
    const mpf = profiles.value.get(app)
    return mpf || new Map<string, Profile>()
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
      const ab = s.aboutStr
      const id = s.idOfS
      s.time = Date.now()
      s.about = await Crypt.crypt(keyK.value, encoder.encode(ab))
      s.aboutStr = ''
      await db.value.tsessions.put({ id, bin: encode(s.toObj)})
      s.aboutStr = ab
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

  /* Charge depuis IDB currentPref avec la préférence du user 
  pour l'application en cours
  */
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
  /* sh1p sh1r ont été donnés:
  - soit sur $createSafe $UpdSafeCodes (auth longue)
  - soit sur $openSafebyPR (par auth longue, pas par PIN)
  Sont transmises sur les opérations $SetTrust $SetUntrust pour vérification 
  de leur hash (hhp1 hhr1) stockés par $CreateSafe $UpdSafeCodes
  */
  const sh1p = ref(null)
  const sh1r = ref(null)

  const openMode : Ref<number> = ref(0) // 0: pas ouvert, 1: par P0, 2: par R0, 3: par PIN

  const shK = computed(async () => await Crypt.strongHash(keyK.value, false, true))

  /* Section "auth" */
  type Auth = {
    pseudo: string
    hp0: string // index unique, `SH(p0)`.
    hr0: string // index unique, `SH(r0)`.
    hhp1: string // SHA de `SH(p1)`.
    hhr1: string // SHA de `SH(r1)`.
    hhk: string // SHA de `SH(K)`.
    C: Uint8Array // clé publique de cryptage.
    D: Uint8Array // clé privée de décryptage.
    S: Uint8Array // clé publique de signature.
    V: Uint8Array // clé privée de vérification.
    Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
    Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
  }
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
  Une entrée par application donnant une liste de couples `code, obj` 
  ( **cryptés par la clé K**) ordonnée par dernière utilisation:
  - `code` : texte court parlant pour l'utilisateur correspondant à un de ses usages 
    habituels de l'application comme `mobile, large, simple, expert ...`.
  - `obj`: objet donnant les valeurs des _préférences_ à utiliser à l'ouverture d'une session.
  **************************************************************************************/
  const prefs = ref(Map<String, Pref[]>) // clé app

  /* Section "profiles"
  Elle est organisée avec une **sous-section par application** regroupant une liste d'items ayant un identifiant généré aléatoirement à sa création. Chaque item est **crypté par la clé K** de _safe_ et a les propriétés suivantes: 
  - `about`: texte significatif pour l'utilisateur **crypté par la clé K** décrivant le _profil_ d'une session (par exemple `Revue des notes d'Alice et Jules`).
  - `creds`: la liste des id des _credentials_ qui sont attachés à une session de ce profil lors de son ouverture.
  */
 const profiles = ref(Map<String, Map<string, Profile>>) // clé app

  /* "Compilation" d'un objet Safe retour des opérations sur Safe
  Stocke en mémoire le dernier état du Safe revenu du serveur: 
    - auth, devices, prefs, profiles
  K :
    - soit vient d'être généré dans $createSafe
    - soit a été décrypté au retour des opérations $openSafeByPR $openSafeByPin
  */
  const compileSafe = async (safe: Safe) => {
    auth.value = {
      pseudo: decoder.decode(await Crypt.decrypt(keyK.value, safe.pseudo)),
      hp0: safe.hp0,
      hr0: safe.hr0,
      hhp1: safe.hhp1,
      hhr1: safe.hhr1,
      hhk: safe.hhk,
      C: safe.C,
      D: await Crypt.decrypt(keyK.value, safe.DK),
      S: safe.S,
      V: await Crypt.decrypt(keyK.value, safe.VK),
      Ka: safe.Ka,
      Kr: safe.Kr,
    } as Auth

    await loadDevices(safe) // devices
    await loadPrefs(safe) // prefs
    await loadProfiles(safe) // profiles
  }

  const loadDevices = async (safe: Safe) : Promise<void> => {
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
  }

  const loadPrefs = async (safe: Safe) : Promise<void> => {
    const appname = stores.config.appname
    const p = new Map<string, Map<string, Object>>() // clé: app, value: liste de prefs
    for (const app in safe.prefs) {
      const x = safe.prefs[app] as Uint8Array
      const y = x ? decode(await Crypt.decrypt(keyK.value, x)) : {}
      const mx = new Map<string, Object>()
      for (const code in y) mx.set(code, y[code])
      p.set(app, mx)
      if (app === appname && currentPref.value) {
        const c = currentPref.value.code as string
        let f = false
        for (const [code, obj] of mx) {
          if (code === c) { // Rafraichissement de l'objet de préférence courante
            currentPref.value.obj = obj
            await saveCurrentPref()
          }
        }
      }
    }
    prefs.value = p
  }

  const loadProfiles = async (safe: Safe) : Promise<void> => {
    const m = new Map<string, Map<string, Profile>>()
    for (const app in safe.profiles) {
      const mp = new Map<string, Profile>()
      m.set(app, mp)
      const mpf = safe.profiles[app]
      for (const profId in mpf) {
        const x = mpf[profId]
        const about = decoder.decode(await Crypt.decrypt(keyK.value, x.about as Uint8Array))
        const p: Profile = { about, creds: x.creds }
        mp.set(profId, p)
      }
    }
    profiles.value = m
  }

  const getMySafeProfile = (profId: string) : Profile => {
    if (!profiles.value) return null
    const app = stores.config.appname
    const x = profiles.value.get(app)
    if (!x) return null
    return x.get(profId)
  }

  /* Retourne depuis le Safe central actuellement en mémoire
  la liste (éventuellement vide) des prefs relative à l'application (et au user)
  */
  const getMySafePrefs = () : Pref[] => {
    if (!prefs.value) return []
    const app = stores.config.appname
    const x = prefs.value.get(app)
    return x ? x : []
  }

  type SafeCodes = { // paramétres de l'opération $UpdCodesSafe
    id: string // identifiant aléatoire.
    pseudo: Uint8Array // pseudo / trigramme crypté par la clé K du _safe_.
    hp0: string // index unique, `SH(p0)`.
    hr0: string // index unique, `SH(r0)`.
    hhp1: string // SHA de `SH(p1)`.
    hhr1: string // SHA de `SH(r1)`.
    Ka: Uint8Array // clé `K` du safe cryptée par `SH(p0, p1)`.
    Kr: Uint8Array //  clé `K` du safe cryptée par `SH(r0, r1)`.
  }

  interface Safe extends SafeCodes { // paramétres de l'opération $CreateSafe
    hhk: string // SHA de `SH(K)`.
    C: Uint8Array // clé publique de cryptage.
    DK: Uint8Array // clé privée de décryptage, cryptée par la clé K
    S: Uint8Array // clé publique de signature.
    VK: Uint8Array // clé privée de vérification, cryptée par la clé K

    devices: Object
    creds: Object
    profiles: Object
    prefs: Object // pour chaque application, liste des préférences déclarées (ordonnée par date d'utilisation)
  }

  const updSafeCodes = async (
    pseudo: string,
    psh0: Uint8Array, psh1: Uint8Array, psh: Uint8Array,
    rsh0: Uint8Array, rsh1: Uint8Array, rsh: Uint8Array,) => {

    if (openMode.value === 0) return 9
    
    sh1p.value = psh1
    sh1r.value = rsh1

    const safeCodes: SafeCodes = {
      id: userId.value,
      pseudo: await Crypt.crypt(keyK.value, encoder.encode(pseudo)),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      Ka: await Crypt.crypt(psh, keyK.value),
      Kr: await Crypt.crypt(rsh, keyK.value)
    }

    const ret = await new Operation('$UpdCodesSafe').post({ safeCodes })
    if (ret.status === 0) {
      openMode.value = 1
      await compileSafe(ret.safe)
    }
    return ret.status
  }

  const createSafe = async (
    pseudo: string,
    psh0: Uint8Array, psh1: Uint8Array, psh: Uint8Array,
    rsh0: Uint8Array, rsh1: Uint8Array, rsh: Uint8Array,) => {
    
    if (openMode.value !== 0) return 9

    userId.value = Crypt.shaS(Crypt.random(32))
    keyK.value = Crypt.random(32)
    sh1p.value = psh1
    sh1r.value = rsh1

    const [C, D] = await Crypt.getKeyPair()
    const [S, V] = await Crypt.getKeyPair()

    const safe: Safe = {
      id: userId.value,
      pseudo: await Crypt.crypt(keyK.value, encoder.encode(pseudo)),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      Ka: await Crypt.crypt(psh, keyK.value),
      Kr: await Crypt.crypt(rsh, keyK.value),

      hhk: Crypt.shaS(shK.value),
      C,
      DK: await Crypt.crypt(keyK.value, D),
      S,
      VK: await Crypt.crypt(keyK.value, V),

      devices: {},
      creds: {},
      profiles: {},
      prefs: {}
    }

    const ret = await new Operation('$CreateSafe').post({ safe })
    if (ret.status === 0) {
      openMode.value = 1
      await compileSafe(safe)
    }
    return ret.status
  }

  const openSafeByPR = async ( sh0: Uint8Array, sh1: Uint8Array, sh: Uint8Array) => {
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
    const ret2 = await new Operation('$OpenSafeById')
      .post({userId: userId.value, shK: shK.value})
    if (ret2.status) return 2
    openMode.value = 3
    await compileSafe(ret2.safe)
    return 0
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

  /* Cette opération (ainsi que unsetTrust) exige que l'authentification ait été faite
  en mode LONG (pas par PIN). 
  Pour s'en assurer elle transmet au serveur sh1p / sh1r qui n'ont pu être initialisés
  QUE par une auth longue ($CreateSafe / $UpdSafeCodes / $OpenSafeByPR)
  */
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
    profiles, getMyProfiles,
    getSessionSize, pseudoOfS, volOfS, purgeIDBS,
    currentPref, getCurrentPref, saveCurrentPref, getMySafePrefs,
    getCreds,
    userId, keyK, openMode, auth, devices,
    createSafe, updSafeCodes, openSafeByPR, openSafeByPin, setTrust, setUntrust
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
