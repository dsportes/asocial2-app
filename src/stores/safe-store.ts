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

/* TODO
Suppression de sessions "locales" épinglées:
- GC des profils / credentials associés dans IDBS
*/

/*
### Micro base locale IDB `safe`
Un device qui a été déclaré _de confiance_ par au moins un utilisateur ou qui a eu un _utilisateur local_ a une micro base de données IDB nommée `safe` ayant les tables suivantes.

#### `header`
Cette table _singleton_ a deux colonnes:
- `devId`: un identifiant généré aléatoirement à la création de la base _Safes_ identifiant le _device_.
- `devName`: le _nom_ du _device_, par exemple `PC d'Alice`, plus parlant que le code technique système pour le propriétaire du _device_ et les quelques personnes pouvant l'utiliser en confiance.

#### `trustings`
Chaque row est associé à UN _utilisateur_: a) soit enregistré et ayant déclaré le _device_ de confiance, b) soit _local_. Il a les colonnes suivantes:
- `userId`: identifiant de l'utilisateur (clé primaire).
- `pseudo`: par exemple `Bob`.

Pour un _utilisateur enregistré_:
- `cx`: un challenge aléatoire.
- `Ka`: clé K du safe de l'utilisateur cryptée par `SH(p0, p1)` où `p0` et `p1` sont les termes d'authentification du safe de l'utilisateur.
- `Kr`: clé K du safe de l'utilisateur cryptée par `SH(r0, r)`.
- `Kp`: clé K du safe de l'utilisateur cryptée par `SH(PIN + cx, cy)` où,
  - `PIN` est le code PIN fixé par l'utilisateur à la déclaration de confiance,
  - `cx cy` sont des _challenges_ générés aléatoirement à ce moment.

Pour un _utilisateur local_:
- `hsh`: sha du SH(PS) (PS: phrase secrète de l'utilisateur)

#### `tsessions`
Chaque row décrit une _session épinglée_. Les sessions des utilisateurs locaux sont toutes épinglées par nature.
- `app`: code l'application correspondante.
- `userId`: identifiant de l'utilisateur.
- `profId`: id du profil de la session pour un utilisateur enregistré.
- `about`: texte significatif pour l'utilisateur **crypté par la clé de l'utilisateur** décrivant l'usage de sa session 
  (par exemple `Revue des notes d'Alice et Jules`).
  - pour un _utilisateur enregistré_ c'est la copie de `about` de son profil lors de la dernière ouverture.
- `size`: volume _utile_ des données de la base IDB lors de la dernière session ouverte sur ce _device_.
- `time`: dernière date-heure d'ouverture de cette session sur ce terminal.
- `credIds`: pour un _utilisateur local_ seulement, liste des codes des credentials. Pour un utilisateur enregistré elle figure dans son _profile_.
- `prefCode`: code de la "préférence" utilisée la dernière fois.

Il existe une base de données IDB de nom `app_x` où `x` est le hash court de (userId / profId): elle contient les documents en cache de cette session.

#### `tprefs`
Chaque row décrit un _objet de "préférences"_:
- `app`: code de l'application
- `userId`: id de l'utilisateur
- `code`: texte court parlant pour l'utilisateur correspondant à un de ses usages habituels de l'application comme `mobile, large, simple, expert ...`.
- `data`: objet sérialisé crypté par la clé de l'utilisateur.

#### `tcreds`
Chaque row décrit un _credential_ d'un utilisateur _local_:
- `app`: code de l'application
- `userId`: id de l'utilisateur
- `credId`: identifiant du _credential_
- `about`: texte significatif pour l'utilisateur **crypté par la clé de l'utilisateur** décrivant la portée du _credential_.
- `data`: objet credential sérialisé **crypté par la clé de l'utilisateur**.

> Les utilisateurs _enregistrés_ les ont dans leur `Safe` central: en mode _avion_ ils n'y ont pas accès, mais les credentials n'y sont pas utilisés / pertinents.

> Les rows de la base IDB Safe sont cryptés par une clé AES du module _safe terminal_ afin de ne pas être directement lisible en _debug_: cette _sécurité_ est _molle_, la clé étant d'une manière ou d'une autre inscrite dans le code, avec un peu de fatigue un hacker motivé peut la retrouver.
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

  constructor (obj: Object) { 
    super() 
    if (obj) for(const f of Object.keys(obj)) this[f] = obj[f]
  }
}

class TSession {
  app: string // code de l'application
  userId: string // id de l'utilisateur
  profId: string // id du profil
  about: string | Uint8Array // commentaire crypté de l'utilisateur sur cette session
  hasCache?: boolean // true si a une base IDB cache de documents
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal
  credIds: string[] // liste des codes des credentials
  prefCode: string // code de la "préférence" utilisée la dernière fois

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }

  get dbName () : string { return this.app + '_' + Crypt.shaS(this.userId + '/' + this.profId)}
  get idOf () : string { 
    return Crypt.shaS(this.app + '/' + this.userId + '/' + this.profId) }
}

class TCred {
  credId: string // id du credential
  about: string | Uint8Array // commentaire crypté de l'utilisateur sur cette session
  data: Uint8Array // objet serialisé

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }
}

class TPref {
  app: string // code de l'application
  userId: string // id de l'utilisateur
  code: string // code court de la préférence
  data: Uint8Array // objet serialisé

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }

  get idOf () : string { 
    return Crypt.shaS(this.app + '/' + this.userId + '/' + this.code) }
}

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
  tprefs: 'id', // id: prefId - bin: cryptage par K du user de son pref ([code, obj])
  tcreds: 'id' // id: credId - bin: contenu de l'objet _droit_ crypté par la cléK locale.
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

  const init0 = async () : Promise<void> => {
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
            tsessions.value.set(s.idOf, s)
          } catch (e) {
            console.log(e)
          }
        })
        console.log('Init0 IDBS OK - devId:[' + devId.value + '] devName:[' + devName.value + ']')
      } else {
        db.value = null
        console.log('Init0 IDBS failed.')
      }
    } catch (e) {
      if (db.value) { 
        await db.value.close()
        db.value = null
      }
      console.log('Init0 IDBS failed: ' + e.message)
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
      db.value = null
      console.log('Init1 IDBS failed: ' + e.message)
      throw EX(e, 1)
    }
  }

  const setHeader = async () => {
    if (stores.session.incognito) return
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
    if (stores.session.incognito) return
    try {
      const obj = t.toObj
      await db.value.trustings.put({ id: t.userId, bin: encode(obj)})
      trustings.value.set(t.userId, t)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const delTrusting = async (id: string) => {
    if (stores.session.incognito) return
    try {
      await db.value.trustings.where({id}).delete()
      trustings.value.delete(id)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const purgeIDBS = async (l: string[]) => {
    if (stores.session.incognito) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    for (const ids of l) {
      const s = tsessions.value.get(ids) as TSession
      if (s) {
        const dbName = s.dbName
        if (dbName) try {
          await Dexie.delete(dbName)
          await sleep(300)
          const n = dbl.indexOf(dbName)
          if (n !== -1) dbl.splice(n, 1)
          console.log(dbName + ' deleted')
        } catch (e) {
          console.log(dbName + ' deletion FAILED: ', e.message())
        }
      }
      localStorage.setItem('$DBLIST', dbl.join(' '))
      await delTSession(s)
    }
  }

  const recordIDB = (dbName: string) => {
    if (stores.session.incognito) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    const n = dbl.indexOf(dbName)
    if (n === -1) dbl.push(dbName)
    localStorage.setItem('$DBLIST', dbl.join(' '))
  }
  
  const delIDB = (dbName: string) => {
    if (stores.session.incognito) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    const n = dbl.indexOf(dbName)
    if (n === -1) dbl.splice(n, 1)
    localStorage.setItem('$DBLIST', dbl.join(' '))
  }

  /**********************************************************************
  Safe central : copie locale du safe de l'utilisateur courant
  - permet un affichage complet, y compris pour les données relatives
    aux autres applications que celle qui s'exécute.
  **********************************************************************/
  const userId = ref(null)
  const isRegistered = (() => userId.value && userId.value.startsWith('$'))
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
  const devices: Ref<Map<string, Device>> = ref() // cle devid

  /* Section "préférences" **************************************************************
  Elle est organisée avec une **sous-section par application** donnant une 
  map (**cryptée par la clé K**) de clé `code` et de valeur `data`:
  - `code` : texte court parlant pour l'utilisateur correspondant 
    à un de ses usages habituels de l'application comme `mobile, large, simple, expert ...`.
  - `data`: un objet sérialisé donnant les valeurs des _préférences_ à utiliser 
    à l'ouverture d'une session.  
  **************************************************************************************/
  const prefs: Ref<Map<String, Map<string, Uint8Array>>> = ref()// clé app

  /* Section "profiles"
  Elle est organisée avec une **sous-section par application** regroupant une liste d'items ayant un identifiant généré aléatoirement à sa création. Chaque item est **crypté par la clé K** de _safe_ et a les propriétés suivantes: 
  - `about`: texte significatif pour l'utilisateur **crypté par la clé K** décrivant le _profil_ d'une session (par exemple `Revue des notes d'Alice et Jules`).
  - `creds`: la liste des id des _credentials_ qui sont attachés à une session de ce profil lors de son ouverture.
  */
  const profiles: Ref<Map<String, Map<string, Profile>>> = ref() // clé app

  /* Section "creds"
  Elle est organisée avec une **sous-section par application** regroupant une liste d'items ayant un identifiant généré aléatoirement à sa création. Chaque item est **crypté par la clé K** de _safe_ et a les propriétés suivantes: 
  - `about` : code / texte court donné par l'utilisateur pour qualifier le _credential_. Par exemple `Compte Bob sur circuits courts`.
  - `data`: sérialisation du détail du _credential_:
  */
  const creds: Ref<Map<String, Map<string, TCred>>> = ref() // clé app

  // credentials par "credId" tirées de IDB safe pour l'application / user courant
  const tcreds : Ref<Map<string, TCred>> = ref() // par credId

  // préférences par "code" tirées de IDB safe pour l'application / user courant
  const tprefs : Ref<Map<string, Uint8Array>> = ref() // par code

  const dcX = async (b: Uint8Array) : Promise<string> => {
    if (!b || b.length === 0) return ''
    let y
    try { y = await Crypt.decrypt(keyK.value, b) } catch (e) { return '' }
    if (!y || y.length === 0) return ''
    return decoder.decode(y)
  }

  const u8Empty = new Uint8Array([])
  const ecX = async (s: string) : Promise<Uint8Array> => {
    if (!s || s.length === 0) return u8Empty
    const b = encoder.encode(s)
    let y
    try { y = await Crypt.crypt(keyK.value, b) } catch (e) { return u8Empty }
    return !y || y.length === 0 ? u8Empty : y
  }

  /* "Compilation" d'un objet Safe retour des opérations sur Safe
  Stocke en mémoire le dernier état du Safe revenu du serveur: 
    - auth, devices, prefs, profiles
  K :
    - soit vient d'être généré dans $createSafe
    - soit a été décrypté au retour des opérations $openSafeByPR $openSafeByPin
  */
  const compileSafe = async (safe: Safe) => {
    auth.value = {
      pseudo: await dcX(safe.pseudo),
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
    await loadCreds(safe) // creds
    await loadPrefs(safe) // prefs
    await loadProfiles(safe) // profiles
  }

  const loadDevices = async (safe: Safe) : Promise<void> => {
    const m = new Map<string, Device>()
    for (const devId in safe.devices) {
      const d: Device = safe.devices[devId]
      d.devName = await dcX(d.devName as Uint8Array)
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
    const p = new Map<string, Map<string, Uint8Array>>() // clé: app
    for (const app in safe.prefs) {
      const x = safe.prefs[app] as Uint8Array
      const y = x ? decode(await Crypt.decrypt(keyK.value, x)) : {}
      const mx = new Map<string, Uint8Array>()
      for (const code in y) mx.set(code, y[code])
      p.set(app, mx)
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
        const about = await dcX(x.about as Uint8Array)
        const p: Profile = { about, creds: x.creds }
        mp.set(profId, p)
      }
    }
    profiles.value = m
  }

  const loadCreds = async (safe: Safe) : Promise<void> => {
    const m = new Map<string, Map<string, TCred>>()
    for (const app in safe.creds) {
      const mc = new Map<string, TCred>()
      m.set(app, mc)
      const mcf = safe.creds[app]
      for (const credId in mcf) {
        const x = mcf[credId] as TCred
        try {
          const data = await Crypt.decrypt(keyK.value, x.data)
          const about = await dcX(x.about as Uint8Array)
          const tc: TCred = new TCred({credId: x.credId, about, data})
          mc.set(x.credId, tc)
        } catch (e) { 
          console.log(e)
        }
      }
    }
    creds.value = m
  }

  const getMySessions = async () : Promise<TSession[]> => {
    const app = stores.config.appname
    const mpf: Map<string, Profile> = profiles.value ? profiles.value.get(app) : null
    const tok: TSession[] = []
    for(const [,x] of tsessions.value)
      if (x.userId === userId.value && x.app ===  app) {
        let toSave = false
        x.about = await dcX(x.about)
        if (!userId.value.startsWith('$')) {
          // Utilisateur enregistré - l'about et creds de la session sont tirés du profile
          const profile: Profile = mpf ? mpf.get(x.profId) : null
          if (profile) {
            x.about = profile.about
            x.credIds = profile.creds
          } else {
            x.profId = ''
            toSave = true
          }
        }
        tok.push(x) 
        if (toSave) await saveTSession(x)
      }
    return tok
  }

  const loadMyLocalPrefs = async () => {
    const app = stores.config.appname
    const m: Map<string, Uint8Array> = new Map<string, Uint8Array>()
    await db.value.tprefs.each(async (r) => {
      try {
        const x = decode(r.bin)
        if (x.app === app && x.userId === userId.value)
          try {
            const data = await Crypt.decrypt(keyK.value, x.data)
            m.set(x.code, data)
          } catch (e) { 
            console.log(e)
          }
      } catch (e) {
        console.log(e)
      }
    })
    tprefs.value = m
  }

  const refreshLocalPrefs = async () => {
    const app = stores.config.appname
    const m: Map<string, Uint8Array> = prefs.value.get(app)
    // toutes les préférences de l'utilisateur pour cette application

    const tp = tprefs.value
    // rafraîchir dans IDB safe celles ayant changé ou étant absente
    if (m) for(const [code, data] of m) {
      const locp = tp.get(code)
      if (!locp || !equ8(locp, data)) {
        await savePref(new TPref({
          app: app,
          userId: userId,
          code: code,
          data: await Crypt.crypt(keyK.value, data)
        }))
        tp.set(code, data)
      }
    }
    // supprimer de IDB safe celles obsolètes
    if (tp) for(const [code, ] of tp) {
      if (!m || !m.has(code)) {
        await deletePref(new TPref({
          app: app,
          userId: userId,
          code: code,
          data: null
        }))
      }
      tp.delete(code)
    }
  }

  const savePref = async (tpref: TPref) => {
    if (stores.session.incognito) return
    try {
      await db.value.tprefs.put({ id: tpref.idOf, bin: encode(tpref)})
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const deletePref = async (tpref: TPref) => {
    if (stores.session.incognito) return
    try {
      await db.value.tprefs.where({ id: tpref.idOf }).delete()
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const loadMyLocalCreds = async () => {
    const app = stores.config.appname
    const m: Map<string, TCred> = new Map<string, TCred>()
    await db.value.tcreds.each(async (r) => {
      try {
        const x = decode(r.bin)
        if (x.app === app && x.userId === userId.value)
          try {
            const data = await Crypt.decrypt(keyK.value, x.data)
            const about = await dcX(x.about)
            const tc: TCred = new TCred({credId: x.credId, about, data})
            m.set(x.code, tc)
          } catch (e) { 
            console.log(e)
          }
      } catch (e) { 
        console.log(e)
      }
    })
    tcreds.value = m
  }

  const refreshLocalCreds = async () => {
    const app = stores.config.appname
    const m: Map<string, TCred> = creds.value.get(app)
    // tous les credentials de l'utilisateur pour cette application
    const tc = tcreds.value
    // rafraîchir dans IDB safe les creds ayant changé d'about ou étant absents
    if (m) for(const [credId, cred] of m) {
      const locc = tc.get(credId) as TCred
      if (!locc || (locc.about !== cred.about) ) {
        await saveCred(new TCred({
          credId: credId,
          about: await ecX(cred.about as string), 
          data: await Crypt.crypt(keyK.value, cred.data)
        }))
        tc.set(credId, cred)
      }
    }
    // supprimer de IDB safe ceux obsolètes
    if (tc) for(const [credId, ] of tc) {
      if (!m || !m.has(credId)) {
        await deleteCred(credId)
      }
      tc.delete(credId)
    }
  }

  const saveCred = async (tcred: TCred) => {
    if (stores.session.incognito) return
    try {
      await db.value.tprefs.put({ id: tcred.credId, bin: encode(tcred)})
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const deleteCred = async (credId: string) => {
    if (stores.session.incognito) return
    try {
      await db.value.tcreds.where({ id: credId }).delete()
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const saveTSession = async (s: TSession) => {
    try {
      const ab = s.about
      const id = s.idOf
      s.about = await ecX(s.about as string)
      const bin = encode(s.toObj)
      await db.value.tsessions.put({ id, bin })
      s.about = ab
      tsessions.value.set(id, s)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  /* Quand idx est donné au lieu de s
  c'est une purge depuis ManageUsers, la base a déjà été supprimée
  par purgeIDBS
  */
  const delTSession = async (s: TSession, idx?: string) => {
    try {
      const id = idx || s.idOf
      await db.value.tsessions.where({ id }).delete()
      tsessions.value.delete(id)
      if (!idx) {
        delIDB(s.dbName)
        try {
          await Dexie.delete(s.dbName)
          await sleep(300)
          console.log(s.dbName + ' deleted')
        } catch (e) {
          console.log(s.dbName + ' deletion FAILED: ', e.message())
        }
      }
    } catch (e) {
      throw EX(e, 2)
    }
  }

  const setTSession = async (s: TSession, razdb?: boolean) => {
    try {
      s.time = Date.now()
      await saveTSession(s)

      recordIDB(s.dbName)
      if (razdb) try {
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

  const getMySafeProfiles = () : Map<string, Profile> => {
    const app = stores.config.appname
    const mpf = profiles.value.get(app)
    return mpf || new Map<string, Profile>()
  }

  /* Retourne depuis le Safe central actuellement en mémoire
  la liste (éventuellement vide) des prefs relative à l'application (et au user)
  */
  const getMySafePrefs = () => {
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
      pseudo: await ecX(pseudo),
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
    const shK = await Crypt.strongHash(keyK.value, false, true)
    sh1p.value = psh1
    sh1r.value = rsh1

    const [C, D] = await Crypt.getKeyPair()
    const [S, V] = await Crypt.getKeyPair()

    const safe: Safe = {
      id: userId.value,
      pseudo: await ecX(pseudo),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      Ka: await Crypt.crypt(psh, keyK.value),
      Kr: await Crypt.crypt(rsh, keyK.value),

      hhk: Crypt.shaS(shK),
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
    const shk = await Crypt.strongHash(keyK.value, false, true)
    const ret2 = await new Operation('$OpenSafeById')
      .post({userId: userId.value, shk})
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

  type LoadSafe = {
    userId: string
    shk: Uint8Array
  }

  type SetAboutProfile = {
    app: string,
    userId: string
    shk: Uint8Array
    profId: string
    about: Uint8Array
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

  const reloadSafe = async () => {
    const args = {
      userId: userId.value,
      shk: await Crypt.strongHash(keyK.value, false, true) as Uint8Array
    }
    const ret = await new Operation('$OpenSafeById').post(args)
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  /* Faire sauvegarder par le serveur dans le safe 
  la maj de l'about du profil */
  const setAboutProfile = async (profId: string, about: string) => {
    const aboutProfile: SetAboutProfile = {
      app: stores.config.appname,
      userId: userId.value,
      shk: await Crypt.strongHash(keyK.value, false, true) as Uint8Array,
      profId,
      about: await ecX(about)
    }
    const ret = await new Operation('$SetAboutProfile').post({aboutProfile})
    if (!ret.status)
      await compileSafe(ret.safe)
    else console.log('$SetAboutProfile', ret.status)
  }

  const newTrustingL = (obj) => new TrustingL(obj)
  const newTrustingS = (obj) => new TrustingS(obj)
  const newTSession = (obj) => new TSession(obj)

  const nbCoeffs = ref(coeffs.length)

  
  type Suas = {
    n: number
    ck: boolean
    userId: string
    app: string
    id: string
    about: string
    hasCache: boolean
    size: number[]
    time: number
  }

  type Sua = {
    n: number
    ck: boolean
    userId: string
    app: string
    size: number[]
    ms: Map<string, Suas>
  }

  type Su = {
    n: number
    ck: boolean
    userId: string
    pseudo: string
    size: number[]
    ma: Map<string, Sua>
  }

  const synthUsers = () : [Map<string, Su>, number[]] => {
    const nbc = coeffs.length
    let n = 0
    const synthU: Map<string, Su> = new Map<string, Su>()
    const size = new Array(nbc).fill(0)

    for(const [id, s] of tsessions.value) {
      let su = synthU.get(s.userId)
      if (!su) {
        const t = trustings.value.get(s.userId)
        const pseudo = t ? t.pseudo : '???'
        n++
        su = {
          n,
          userId: s.userId,
          ck: false,
          pseudo: t ? t.pseudo : s.userId,
          size: new Array(nbc).fill(0),
          ma: new Map<string, Sua>()
        }
        synthU.set(s.userId, su)
      }
      let sua = su.ma.get(s.app)
      if (!sua) {
        n++
        sua = {
          n,
          userId: s.userId,
          app: s.app,
          ck: false,
          size: new Array(nbc).fill(0),
          ms: new Map<string, Suas>()
        }
        su.ma.set(s.app, sua)
      }
      const ms = sua.ms
      n++
      const suas: Suas = {
        n,
        userId: s.userId,
        app: s.app,
        id: s.idOf,
        ck: false,
        about: typeof s.about === 'string' ? s.about : s.idOf,
        hasCache: s.hasCache || false,
        // size: s.size || new Array(nbc).fill(0),
        size: [20000, 500000],
        time: s.time
      }
      sua.ms.set(s.idOf, suas)

      for(let i = 0; i < nbc; i++) {
        sua.size[i] += suas.size[i]
        su.size[i] += suas.size[i]
        size[i] += suas.size[i]
      }
    }
    return [synthU, size]
  }

  return {
    recordIDB, resetAllLocal,
    incognito, hasIDBS, init0, init1, devId, devName, 
    setHeader,
    newTrustingS, newTrustingL, newTSession,
    trustings, setTrusting, delTrusting, getMyTrusting,
    tsessions, setTSession, delTSession, getMySessions,
    tprefs, loadMyLocalPrefs, refreshLocalPrefs,
    tcreds, loadMyLocalCreds, refreshLocalCreds,
    profiles, getMySafeProfiles,
    purgeIDBS,
    getMySafePrefs,
    userId, isRegistered, keyK, openMode, auth, devices,
    createSafe, updSafeCodes, openSafeByPR, openSafeByPin, reloadSafe,
    setTrust, setUntrust, setAboutProfile,
    synthUsers
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
