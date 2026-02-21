// @ts-ignore
import { ref, computed, watch } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from './all'
import { AppExc, $t, sleep, u8ToB64, b64ToU8, equ8 } from '../src-fw/util'
import { SafeOperation } from '../src-fw/operation'
import { Crypt, toPem, fromPem } from '../src-fw/crypt'
import { Credential } from '../src-fw/credential'

/*
### Safes stockés dans un directory
Dans un directory externe de "safes", chaque "safe" est enregistré et accessible par:
- clé primaire: soit son "id",
- index unique: soit la propriété "hp0", pseudo "principal",
- index unique: soit la propriété "hr0", pseudo "seconaire".
La proriété "lam" (dernier mois d'accès) est gérée par le serveur et permet de récupérer
tous les safes qui n'ont pas été accédés depuis longtemps et de les purger.

La "valeur" accédée est la sérialisation par Msgpack d'un objet "Safe", (cryptée ou non par le serveur).
Cette sérialisation est indépendante des implémentations à condition de respecter les contraintes suivantes:
- les "map" vides sont null (et non pas des object vides, mal gérés sous PHP).
- les propriétés sont des "string / number / boolean".
- les valeurs "binaires" sont passées en textes encodés en base64 (les binaires ne sont pas supportés en PHP).

Les propriétés sont les suivantes:
- celles cités dans le "type Auth". Les données "binaires" (clés, etc.) sont des string en base 64.
- les maps "devices" "creds" "profiles" "prefs":
  - chaque "map" est un object javascript (ou associative array PHP).
  - la clé est un string:
    - pour "devices" l'id d'un device,
    - pour les autres un id d'applicatio: il y a donc une "sous-map" par application.
- "devices" map les descriptifs de device.
- "creds" a une sous-map par application dont chaque entrée est l'identifiant d'un credential.
- "profiles" a une sous-map par application dont chaque entrée est l'identifiant d'un profile.
- "prefs" a une sous-map par application dont chaque entrée est le code d'une préférence.

Le texte sérialisé d'un Safe est,
- exportable dans un fichier externe (crypté à l'export),
- importable depuis un fichier externe (décrypté à l'import),
- interchangeable entre le repository "central par défaut" et les "repositories spécifiques"
  hébergés chacun dans une base MySQL d'un site Web externe et accédé par un scrupt générique PHP.

Ce texte est obtenu à la connexion initiale et réobtenu en totalité à chaque mise à jour
(ou sur demande explicite de rafraîchissement).
Il est "compilé" à l'arrivée (méthode compile()) afin d'être disponible en mémoire du store
dans un format faciltant son utilisation locale.

Le texte lui-même n'est jamais renvoyé au serveur:
- ce sont des requêtes spécifiques qui demandent au serveur des mises à jour.
- chaque requête du serveur,
  - lit le safe enrgistré en DB,
  - le désérialise en objet,
  - met à jour l'objet,
  - réécrit en DB une sérialisation de l'objet,
  - retourne à l'appelant le Safe qu'objet.

  ### Micro base locale IDB `safe` d'un terminal
Un device qui a été déclaré _de confiance_ par au moins un utilisateur a une micro base de données IDB nommée `safe` ayant les tables suivantes.

#### `header`
Cette table _singleton_ a deux colonnes:
- `devId`: un identifiant généré aléatoirement à la première déclaration de confiance faite sur ce terminal.
- `devName`: le _nom_ du _device_, par exemple `PC d'Alice`, saisi par le premier déclarant de confiance.

#### `trustings`
Chaque row est associé à UN _utilisateur_ ayant déclaré le _device_ de confiance:
- `userId`: identifiant de l'utilisateur (clé primaire).
- `pseudo`: par exemple `Bob`.
- `cx`: un challenge aléatoire (random de 24 bytes en base 64).
- `Ka`: clé K du safe de l'utilisateur cryptée par `SH(p0, p1)` où `p0` et `p1` sont les termes d'authentification du safe de l'utilisateur (en base 64).
- `Kr`: clé K du safe de l'utilisateur cryptée par `SH(r0, r)` (en base 64).
- `Kp`: clé K du safe de l'utilisateur cryptée par `SH(PIN + cx, cy)` en base 64 où,
  - `PIN` est le code PIN fixé par l'utilisateur à la déclaration de confiance,
  - `cx cy` sont des _challenges_ générés aléatoirement à ce moment (des random de 24 bytes en base 64).

#### `tsessions`
Chaque row décrit une _session épinglée_:
- `app`: code l'application correspondante.
- `userId`: identifiant de l'utilisateur.
- `profId`: id du profil de la session ou * pour le profil par défaut contenant tous les droits.
- `about`: texte significatif pour l'utilisateur **crypté par la clé de l'utilisateur** et encodé en base 64 décrivant l'usage de sa session (par exemple `Revue des notes d'Alice et Jules`).
- `size`: `[s1, s2 ...]` volumes _utile_ des données de la base IDB lors de la dernière session ouverte sur ce _device_.
- `time`: dernière date-heure d'ouverture de cette session sur ce terminal.
- `prefCode`: code de la "préférence" utilisée la dernière fois.
- `prefTime`: _epoch_ date-heure de la dernière mise à jour de cette préférence.
- `prefObj`:  sérialisation (en binaire) de cet objet de "préférence" utilisé la dernière fois.

Il existe une base de données IDB de nom `app_x` où `x` est le hash court de `userId + '/' + profId`: elle contient les **documents en cache** de cette session.
*/

export type LocPref = {
  code: string
  time: number
  obj: Uint8Array
}

export type Profile = {
  profId: string
  about: string
  crIds: string[]
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/* Coefficients donnant le volume réel depuis le volume utile
pour chaque type de volume (documents / fichiers) */
const coeffs = [2, 1.3]

const STORES = {
  header: 'id', // singleton: id = '1'
  trustings: 'id',
  tsessions: 'id'
}

/* Classes et types */
class Trusting {
  userId: string
  pseudo: string
  cx: string
  Ka: string
  Kr: string
  Kp: string

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }
}

export class TSession {
  app: string // code de l'application
  userId: string // id de l'utilisateur
  profId: string // id du profil - si '*' "tous les droits"
  about: string // copie de about du profil (utile en mode Avion)
  size: number[] // tailles des données / fichiers stockés en local dans IDB
  time: number // date-heure de dernière ouverture sur ce terminal
  prefCode: string // code de la "préférence" utilisée la dernière fois
  prefTime: number // date-heure de dernière mise à jour
  prefObj:  Uint8Array // objet de "préférence" utilisé la dernière fois (utile en mode Avion)

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  static initSize () {
    return new Array(coeffs.length).fill(0)
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }

  get dbName () : string { return this.app + '_' + Crypt.shaS(this.userId + '/' + this.profId)}
  get idOf () : string {
    return TSession.id(this.app, this.userId, this.profId)
  }

  static id (app, userId, profId) : string {
    return Crypt.shaS(app + '/' + userId + '/' + profId)
  }
}

type Device = {
  devName: string
  Va: Uint8Array
  cy: string
  sign: Uint8Array
  nbe: number
}

function EX (e: Error, n: number) {
  const ex = new AppExc({code: 1200 + n, label: 'IDBS error', args: [e.message] })
  if (e && e.stack) ex.stack = e.stack
  return ex
}

export const useSafeStore = defineStore('safe', () => {
  const db = ref(null) // IDB safe locale
  const hasIDBS = computed(() => db.value !== null)
  const incognito = ref(false)

  // Safe IDB : image en mémoire
  const devId = ref('') // Depuis IDB Header
  const devName = ref('') // Depuis IDB Header
  const trustings : Ref<Map<string, Trusting>> = ref() // Depuis IDB trustings
  const mySessions : Ref<Map<string, TSession>> = ref()

  const init0 = async () : Promise<void> => {
    try {
      trustings.value = new Map<string, Trusting>()
      devId.value = ''
      devName.value = ''
      db.value = new Dexie('safe')
      db.value.version(1).stores(STORES)
      await loadTrustings()
      console.log('Init0 IDBS OK - devId:[' + devId.value + '] devName:[' + devName.value + ']')
    } catch (e) {
      if (db.value) {
        await db.value.close()
        db.value = null
      }
      console.log('Init0 IDBS failed: ' + e.message)
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

  const loadTrustings = async () => {
    trustings.value.clear()
    if (stores.session.incognito)  return
    const r = await db.value.header.get('1')
    devId.value = r && r.devId ? r.devId : ''
    devName.value = r && r.devName ? r.devName : ''
    if (devId.value)
      await db.value.trustings.each(async (r) => {
        try {
          const obj = decode(r.bin)
          const t : Trusting = new Trusting(obj)
          trustings.value.set(t.userId, t)
        } catch (e) {
          console.log(e)
        }
      })
  }

  const myTrusting: Ref<Trusting> = computed(() => {
    if (!userId.value) return null
    for(const [,item] of trustings.value)
      if (item.userId === userId.value) return item
    return null
  })

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

  /*
  const purgeIDBS = async (l: TSession[]) => {
    if (stores.session.incognito) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    for (const s of l) {
      try {
        await Dexie.delete(s.dbName)
        await sleep(300)
        const n = dbl.indexOf(s.dbName)
        if (n !== -1) dbl.splice(n, 1)
        console.log(s.dbName + ' deleted')
      } catch (e) {
        console.log(s.dbName + ' deletion FAILED: ', e.message())
      }
      localStorage.setItem('$DBLIST', dbl.join(' '))
      await delTSession(s, true)
    }
  }
  */

  const recordIDB = (dbName: string) => {
    if (stores.session.incognito) return
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    const n = dbl.indexOf(dbName)
    if (n === -1) dbl.push(dbName)
    localStorage.setItem('$DBLIST', dbl.join(' '))
  }

  /**********************************************************************
  Safe central : copie locale du safe de l'utilisateur courant
  - permet un affichage complet, y compris pour les données relatives
    aux autres applications que celle qui s'exécute.
  **********************************************************************/
  const locstep = ref(1)
  const step = computed(() => locstep.value)

  const setStep = async (s) => {
    if (s === 2) {
      await getMySessions()
      selectedSession.value = null
      selectedProfile.value = null
    }
    if (s === 1)
      await loadTrustings()
    locstep.value = s
  }

  const backToAuth = () => {
    userId.value = null
    keyK.value = null
    setStep(1)
  }

  const mySafeStore = ref('')
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

  const selectedSession: Ref<TSession> = ref(null)
  const selectedProfile: Ref<Profile> = ref(null)

  const openMode : Ref<number> = ref(0) // 0: pas ouvert, 1: par P0, 2: par R0, 3: par PIN

  const userName = computed(() => {
    if (!userId.value) return ''
    const t = trustings.value.get(userId.value)
    return t ? t.pseudo : ''
  })

  const users = computed(() =>
    trustings.value ? Array.from(trustings.value.values()) : [])

  /* Section "auth" */
  type Auth = {
    pseudo: string
    hp0: string // index unique, `SH(p0)`.
    hr0: string // index unique, `SH(r0)`.
    hhp1: string // SHA de `SH(p1)`.
    hhr1: string // SHA de `SH(r1)`.
    hhk: string // SHA de `SH(K)`.
    C: string // clé publique de cryptage. PEM
    D: string // clé privée de décryptage.
    S: string // clé privée de signature.
    V: string // clé publique de vérification.
    Ka: string // clé `K` du safe cryptée par `SH(p0, p1)`.
    Kr: string //  clé `K` du safe cryptée par `SH(r0, r1)`.
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
  map (**cryptée par la clé K**) de clé `code` et de valeur `[time, obj]`:
  - `code` : texte court parlant pour l'utilisateur correspondant
    à un de ses usages habituels de l'application comme `mobile, large, simple, expert ...`.
  - `time`: date-heure de dernière mise à jour
  - `obj`: un objet sérialisé donnant les valeurs des _préférences_ à utiliser
    à l'ouverture d'une session.
  **************************************************************************************/
  const mySafePrefs: Ref<Map<string, Uint8Array>> = ref() // clé app

  /* Section "profiles"
  Elle est organisée avec une **sous-section par application** regroupant une liste d'items ayant un identifiant généré aléatoirement à sa création. Chaque item est **crypté par la clé K** de _safe_ et a les propriétés suivantes:
  - `about`: texte significatif pour l'utilisateur **crypté par la clé K** décrivant le _profil_ d'une session (par exemple `Revue des notes d'Alice et Jules`).
  - `creds`: la liste des id des _credentials_ qui sont attachés à une session de ce profil lors de son ouverture.
  */
  const mySafeProfiles: Ref<Map<string, Profile>> = ref() // ceux de l'app courante

  /* Section "creds"
  Elle est organisée avec une **sous-section par application** regroupant une liste d'items ayant un identifiant généré aléatoirement à sa création. Chaque item est **crypté par la clé K** de _safe_ et a les propriétés suivantes:
  - `about` : code / texte court donné par l'utilisateur pour qualifier le _credential_. Par exemple `Compte Bob sur circuits courts`.
  - `data`: sérialisation du détail du _credential_:
  */
  const mySafeCreds: Ref<Map<string, Credential>> = ref() // ceux de l'app

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
    await loadTrustings()
    const pemD = decoder.decode(await Crypt.decrypt(keyK.value, b64ToU8(safe.DK)))
    const pemS = decoder.decode(await Crypt.decrypt(keyK.value, b64ToU8(safe.SK)))
    auth.value = {
      pseudo: await dcX(b64ToU8(safe.pseudo)),
      hp0: safe.hp0,
      hr0: safe.hr0,
      hhp1: safe.hhp1,
      hhr1: safe.hhr1,
      hhk: safe.hhk,
      C: safe.C,
      D: pemD,
      S: pemS,
      V: safe.V,
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
    if (safe.devices) {
      let found = false
      for (const id in safe.devices) {
        if (id === devId.value) found = true
        const d: Device = safe.devices[id]
        d.devName = await dcX(b64ToU8(d.devName))
        m.set(id, d)
      }
      if (!found) // le device doit être retiré de la liste des trustings
        await delTrusting(devId.value)
      const tr = myTrusting.value as Trusting
      if (tr && ((tr.Ka !== auth.value.Ka) || (tr.Kr !== auth.value.Kr))) {
        tr.Ka = auth.value.Ka
        tr.Kr = auth.value.Kr
        setTrusting(tr)
      }
    }
    devices.value = m
  }

  const loadPrefs = async (safe: Safe) : Promise<void> => {
    const app = stores.config.appname
    const ls: TSession[] = []
    const p = new Map<string, [number, Uint8Array]>() // clé: app
    if (safe.prefs) {
      const x = safe.prefs[app]
      for (const code in x) {
        const z = b64ToU8(x[code]) // encode de [time, obj]
        const [time, obj] = decode(z)
        p.set(code, [time, obj])
      }
    }
    if (ls.length) for (const s of ls) await setTSession(s, false)
    mySafePrefs.value = p
  }

  const loadProfiles = async (safe: Safe) : Promise<void> => {
    const app = stores.config.appname
    const m = new Map<string, Profile>()
    m.set('*', { profId: '*', about: '', crIds: [] })
    if (safe.profiles) {
      const mpf = safe.profiles[app]
      if (mpf) {
        for (const profId in mpf) {
          const x = decode(b64ToU8(mpf[profId]))
          const about = await dcX(b64ToU8(x.about))
          const s = sessionOfProfId(profId)
          if (s)
            s.about = about
          const p: Profile = { profId, about, crIds: x.crIds }
          m.set(profId, p)
        }
      }
    }
    mySafeProfiles.value = m
  }

  const loadCreds = async (safe: Safe) : Promise<void> => {
    const mcreds: Map<string, Credential> = new Map<string, Credential>()
    const delcreds = []
    const msvc = stores.config.services
    const m = new Map<string, Credential>()
    if (safe.creds) {
      for (const xid in safe.creds) {
        const x = b64ToU8(safe.creds[xid])
        const spec = xid.startsWith('$')
        const [svcx, credId] = xid.split('.')
        const svc = spec ? svcx.substring(1) : svcx
        if (!msvc.has(svc)) continue
        try {
          if (!spec) {
            const obj = decode(await Crypt.decrypt(keyK.value, x))
            const c: Credential = new Credential(obj)
            if (c) m.set(c.xid, c)
          } else {
            /* Credential transmis par un autre user émetteur
            [obj credential crypté, pub: clé publique C de l'émetteur ] */
            const [crobj, pubC] = decode(x)
            const aes = await Crypt.getAESKey(fromPem(pubC, true), fromPem(auth.value.D))
            const dc = await Crypt.decrypt(aes, b64ToU8(crobj))
            const obj = decode(dc)
            const c: Credential = await Credential.fromTObj(obj, keyK.value, aes)
            if (c) m.set(c.xid, c)
            mcreds.set(c.xid, c)
            delcreds.push(xid)
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
    mySafeCreds.value = m
    if (mcreds.size || delcreds.length)
      await updateCreds(mcreds, delcreds, null, null, true)
  }

  const getCreds = (profile: Profile) : Map<string, Credential> => {
    const x: Map<string, Credential> = new Map<string, Credential>()
    if (!stores.session.hasNet || !profile) return x
    if (profile.profId !== '*') for(const xid of profile.crIds) {
        const c = mySafeCreds.value.get(xid)
        if (c) x.set(xid, c)
      }
    else for (const [xid, c] of mySafeCreds.value) x.set(xid, c)
    return x
  }

  const getMySessions = async () => {
    const app = stores.config.appname
    mySessions.value = new Map<string, TSession>()
    const mpf: Map<string, Profile> = mySafeProfiles.value
    const toSave: Map<string, TSession> = new Map()

    await db.value.tsessions.each(async (r) => {
      try {
        const obj = decode(r.bin)
        const s : TSession = new TSession(obj)
        if (s.userId === userId.value && s.app ===  app) {
          s.about = await dcX(b64ToU8(s.about))
          const profile: Profile = mpf.get(s.profId)
          if (profile && s.about !== profile.about) {
            s.about = profile.about
            toSave.set(s.idOf, s)
          }
        }
        mySessions.value.set(s.idOf, s)
      } catch (e) {
        console.log(e)
      }
    })

    for(const [,s] of mySessions.value) {
      if (s.prefCode) {
        const p = mySafePrefs.value.get(s.prefCode)
        if (p && (s.prefTime !== p.time)) {
          s.prefTime = p.time
          s.prefObj = p.obj
          toSave.set(s.idOf, s)
        }
      }
    }
    if (toSave.size)
      for(const [,s] of toSave) await saveTSession(s)
  }

  const sessionOfProfId = (profId: string) => {
    const id = TSession.id(stores.config.appname, userId.value, profId)
    return mySessions.value ? mySessions.value.get(id) || null : null
  }

  const profileOfProfId = (profId: string) => {
    return mySafeProfiles.value.get(profId)
  }

  const saveTSession = async (s: TSession) => {
    try {
      const id = s.idOf
      const ab = s.about
      s.about = u8ToB64(await ecX(s.about))
      const bin = encode(s.toObj)
      await db.value.tsessions.put({ id, bin })
      s.about = ab
      mySessions.value.set(id, s)
    } catch (e) {
      throw EX(e, 2)
    }
  }

  /* Quand nodel est donné
  c'est une purge depuis ManageUsers, la base a déjà été supprimée
  par purgeIDBS
  */
  const delTSession = async (l: TSession[]) => {
    for (const s of l) {
      try {
        const id = s.idOf
        await db.value.tsessions.where({ id }).delete()
        mySessions.value.delete(id)
        if (!stores.session.incognito) {
          const x = localStorage.getItem('$DBLIST') || ''
          const dbl = x.split(' ')
          const n = dbl.indexOf(s.dbName)
          if (n === -1) dbl.splice(n, 1)
          localStorage.setItem('$DBLIST', dbl.join(' '))
        }
        try {
          await Dexie.delete(s.dbName)
          await sleep(300)
          console.log(s.dbName + ' deleted')
        } catch (e) {
          console.log(s.dbName + ' deletion FAILED: ', e.message())
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  const setTSession = async (s: TSession, razdb?: boolean) => {
    try {
      s.time = Date.now()
      if (razdb) s.size = TSession.initSize()
      if (!stores.session.incognito)
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

  type SafeCodes = { // paramétres de l'opération $UpdCodesSafe
    id: string // identifiant aléatoire.
    pseudo: string // pseudo / trigramme crypté par la clé K du _safe_.
    hp0: string // index unique, `SH(p0)`.
    hr0: string // index unique, `SH(r0)`.
    hhp1: string // SHA de `SH(p1)`.
    hhr1: string // SHA de `SH(r1)`.
    Ka: string // clé `K` du safe cryptée par `SH(p0, p1)`.
    Kr: string //  clé `K` du safe cryptée par `SH(r0, r1)`.
  }

  interface Safe extends SafeCodes { // paramétres de l'opération $CreateSafe
    hhk: string // SHA de `SH(K)`.
    C: string // clé publique de cryptage.
    DK: string // clé privée de décryptage, cryptée par la clé K
    SK: string // clé privée de signature, cryptée par la clé K
    V: string // clé publique de vérification

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
      pseudo: u8ToB64(await ecX(pseudo), true),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      Ka: u8ToB64(await Crypt.crypt(psh, keyK.value), true),
      Kr: u8ToB64(await Crypt.crypt(rsh, keyK.value), true)
    }

    const op = new SafeOperation('$UpdCodesSafe')
    let ret
    try {
      ret = await op.post({ safeCodes }, mySafeStore.value)
    } catch (e) {
      op.ko(e)
      return -1
    }
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

    userId.value = Crypt.shaS(Crypt.random(32))
    keyK.value = Crypt.random(32)
    const shK = await Crypt.strongHash(keyK.value, false, true)
    sh1p.value = u8ToB64(psh1, true)
    sh1r.value = u8ToB64(rsh1, true)

    const kpcd = await Crypt.getKeyPair()
    const kpsv = await Crypt.getSVKeyPair()

    const safe: Safe = {
      id: userId.value,
      pseudo: u8ToB64(await ecX(pseudo), true),
      hp0: u8ToB64(psh0, true),
      hr0: u8ToB64(rsh0, true),
      hhp1: Crypt.shaS(psh1),
      hhr1: Crypt.shaS(rsh1),
      Ka: u8ToB64(await Crypt.crypt(psh, keyK.value), true),
      Kr: u8ToB64(await Crypt.crypt(rsh, keyK.value), true),

      hhk: Crypt.shaS(shK),
      C: toPem(kpcd.pub, true),
      DK: u8ToB64(await Crypt.crypt(keyK.value, encoder.encode(toPem(kpcd.priv))), true),
      V: toPem(kpsv.pub, true),
      SK: u8ToB64(await Crypt.crypt(keyK.value, encoder.encode(toPem(kpsv.priv))), true),
      /* ATTENTION PHP msgpack traite MAL les objects vide
      Ils sont passés à null
      */
      devices: null,
      creds: null,
      profiles: null,
      prefs: null
    }

    let op = new SafeOperation('$SetPubKeys')
    let ret
    try {
      // Enregistrement des clés publiques dans le dépôt générique
      await op.post({
        userId: userId.value,
        pemC: safe.C,
        pemV: safe.V
      }, '')
    } catch (e) {
      op.ko(e)
      return -1
    }

    op = new SafeOperation('$CreateSafe')
    try {
      ret = await op.post({ safe }, mySafeStore.value)
    } catch (e) {
      op.ko(e)
      return -1
    }

    if (ret.status === 0) {
      openMode.value = 1
      await compileSafe(safe)
    }
    return ret.status
  }

  const delSafe = async () => {
    const op = new SafeOperation('$DelSafe')
    try {
      const ret = await op.post({ userId: userId.value, sh1p: sh1p.value, sh1r: sh1r.value }, mySafeStore.value)
      return ret.status
    } catch (e) {
      op.ko(e)
    }
  }

  const openSafeByPR = async ( sh0: Uint8Array, sh1: Uint8Array, sh: Uint8Array) => {
    const _sh0 = u8ToB64(sh0, true)
    const _sh1 = u8ToB64(sh1, true)
    // const hh1 = Crypt.shaS(sh1)
    const op = new SafeOperation('$OpenSafeByPR')
    let ret
    try {
      ret = await op.post({sh0: _sh0, sh1: _sh1}, mySafeStore.value)
    } catch (e) {
      op.ko(e)
      return -1
    }
    if (ret.status === 0) {
      openMode.value = ret.byP ? 1 : 2
      userId.value = ret.safe.id
      keyK.value = await Crypt.decrypt(sh, b64ToU8(ret.byP ? ret.safe.Ka : ret.safe.Kr))
      if (ret.byP) { sh1p.value = _sh1; sh1r.value =  null }
      else { sh1p.value = null; sh1r.value = _sh1 }
      await compileSafe(ret.safe)
    }
    return ret.status
  }

  const openSafeByPin = async ( pin: string, id: string) => {
    userId.value = id
    const t: Trusting = myTrusting.value as Trusting
    if (!t) return 1
    const pincx: string = await Crypt.strongHash(pin + '/' + t.cx, false, false) as string

    let ret
    const op1 = new SafeOperation('$OpenSafeByPin')
    try {
      ret = await op1.post({userId: userId.value, devId: devId.value, pincx}, mySafeStore.value)
    } catch (e) {
      op1.ko(e)
      return -1
    }
    if (ret.status !== 0) return ret.status
    const cy = ret.cy
    const pincxcy: Uint8Array = await Crypt.strongHash(pin + '/' + t.cx + '/' + cy, false, true) as Uint8Array
    try {
      keyK.value = await Crypt.decrypt(pincxcy, b64ToU8(t.Kp))
    } catch (e) {
      return 4
    }
    const shk = await Crypt.strongHash(keyK.value, false, false)

    let ret2
    const op2 = new SafeOperation('$OpenSafeById')
    try {
      ret2 = await op2.post({userId: userId.value, shk}, mySafeStore.value)
    } catch (e) {
      op2.ko(e)
      return -1
    }
    if (ret2.status) return 2
    openMode.value = 3
    await compileSafe(ret2.safe)
    return 0
  }

  type TrustDev = {
    userId: string
    devId: string
    sh1p: string
    sh1r: string
    devName: string
    Va: string
    cy: string
    sign: string
  }

  type UntrustDev = {
    userId: string
    devIds: string[]
    sh1p: string
    sh1r: string
  }

  type SetAboutProfile = {
    app: string,
    userId: string
    shk: string
    profId: string
    about: string
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
    const Kp = u8ToB64(await Crypt.crypt(pincxcy, keyK.value), true)

    let t: Trusting = myTrusting.value
    if (!t) {
      t = new Trusting({
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
    const kpsv = await Crypt.getSVKeyPair()
    const signEC = await Crypt.sign(kpsv.priv, pincx)
    // On enregistre la version ASN1 de la signature
    // Peut être vérifiée par Safe en PHP
    const asn1 = Crypt.signToAsn1(signEC)
    const sign = u8ToB64(asn1)
    const Va = toPem(kpsv.pub, true)
    const trustDev: TrustDev = {
      userId: userId.value,
      devId: devId.value,
      sh1p: sh1p.value,
      sh1r: sh1r.value,
      devName: u8ToB64(await Crypt.crypt(keyK.value, encoder.encode(devName.value)), true),
      Va, cy, sign
    }
    const op = new SafeOperation('$TrustDevice')
    let ret
    try {
      ret = await op.post({trustDev}, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return -1
    }
    await compileSafe(ret.safe)
    return ret.status
  }

  const setUntrust = async () => {
    const t: Trusting = myTrusting.value
    if (!t) return 0 // était déjà untrusted
    await delTrusting(t.userId)
    const untrustDev: UntrustDev = {
      userId: userId.value,
      devIds: [devId.value],
      sh1p: sh1p.value,
      sh1r: sh1r.value
    }
    const op = new SafeOperation('$UntrustDevices')
    let ret
    try {
      ret = await op.post({untrustDev}, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  const setUntrustAll = async (sId: Set<string>) => {
    if (sId.has(devId.value))
      await delTrusting(userId.value)
    const untrustDev: UntrustDev = {
      userId: userId.value,
      devIds: Array.from(sId),
      sh1p: sh1p.value,
      sh1r: sh1r.value
    }
    const op = new SafeOperation('$UntrustDevices')
    let ret
    try {
      ret = await op.post({untrustDev}, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  const reloadSafe = async () : Promise<number>=> {
    const args = {
      userId: userId.value,
      shk: await Crypt.strongHash(keyK.value, false, false) as string
    }
    const op = new SafeOperation('$OpenSafeById')
    let ret
    try {
      ret = await op.post(args, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  const getBinSafe = async () : Promise<Uint8Array>=> {
    const args = {
      userId: userId.value,
      shk: await Crypt.strongHash(keyK.value, false, false) as string
    }
    const op = new SafeOperation('$GetBinSafe')
    let ret
    try {
      ret = await op.post(args, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return null
    }
    return ret.status ? null : ret.safe
  }

  /* Faire sauvegarder par le serveur dans le safe
  la maj de l'about du profil */
  const setAboutProfile = async (profId: string, about: string) => {
    const aboutProfile: SetAboutProfile = {
      app: stores.config.appname,
      userId: userId.value,
      shk: await Crypt.strongHash(keyK.value, false, false) as string,
      profId,
      about: u8ToB64(await ecX(about), true)
    }
    const op = new SafeOperation('$SetAboutProfile')
    let ret
    try {
      ret = await op.post({aboutProfile}, mySafeStore.value)
    } catch(e) {
      op.ko(e)
      return 9
    }
    if (ret.status === 0)
      await compileSafe(ret.safe)
    return ret.status
  }

  const newTrusting = (obj) => new Trusting(obj)
  const newTSession = (obj) => new TSession(obj)

  type Suas = {
    n: number
    ck: boolean
    userId: string
    app: string
    id: string
    about: string
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

  const getAllSessions = async () : Promise<Map<string, TSession>> => {
    const m = new Map<string, TSession>()
    const app = stores.config.appname
    await db.value.tsessions.each(async (r) => {
      try {
        const obj = decode(r.bin)
        const s : TSession = new TSession(obj)
        const id = s
        if (s.userId === userId.value && s.app ===  app)
          s.about = await dcX(b64ToU8(s.about))
        m.set(s.idOf, s)
      } catch (e) {
        console.log(e)
      }
    })
    return m
  }

  const synthUsers = async ()
  : Promise<[Map<string, Su>, number[], Map<string, string>]> => {
    const app = stores.config.appname
    const nbc = coeffs.length
    let n = 0
    const synthU: Map<string, Su> = new Map<string, Su>()
    const size = new Array(nbc).fill(0)
    const sessions = await getAllSessions()

    // Recherche des users n'ayant pas de sessions
    const usersNo: Map<string, string> = new Map()
    for (const [,t] of trustings.value) {
      const u = t.userId
      let f = false
      for(const [,s] of sessions)
        if (s.userId === u) {f = true; break;}
      if (!f) usersNo.set(u, t.pseudo)
    }

    for(const [id, s] of sessions) {
      let su = synthU.get(s.userId)
      if (!su) {
        const t = trustings.value.get(s.userId)
        const pseudo = t ? t.pseudo : s.userId
        n++
        su = {
          n,
          userId: s.userId,
          ck: false,
          pseudo,
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
        about: '',
        size: s.size || TSession.initSize(),
        // size: [20000, 500000], // Pour tester
        time: s.time
      }
      if (s.userId === userId.value && s.app ===  app)
        suas.about = !s.about ? $t('HPpstar') : s.about
      else
        suas.about = !s.about.length ? $t('HPpstar') : s.idOf

      sua.ms.set(s.idOf, suas)

      for(let i = 0; i < nbc; i++) {
        sua.size[i] += suas.size[i]
        su.size[i] += suas.size[i]
        size[i] += suas.size[i]
      }
    }
    return [synthU, size, usersNo]
  }

  const resetAllLocal = async () => {
    await Dexie.delete('safe')
    const x = localStorage.getItem('$DBLIST') || ''
    const dbl = x.split(' ')
    for (const dbName of dbl)
      if (dbName) await Dexie.delete(dbName)
    localStorage.removeItem('$DBLIST')
  }

  type UpdateCreds = {
    app: string
    userId: string
    shk: string
    creds: Object // clé: xid, valeur: Objet Credential sérialisé crypté
    delcreds: string[] // liste des xid à supprimer
    profiles: Object // clé: profId, valeur: Objet Profile sérialisé crypté
    delprofs: string[] // liste des profIds à supprimer
    nosafe: boolean // ne pas retourner le safe mis à jour
  }

  const updateCreds = async (
      mcreds: Map<string, Credential>,
      delcreds: string[],
      mprofiles: Map<string, Profile>,
      delprofs: string[],
      nocompile?: boolean
      ) => {
    let creds = {}
    let profiles = {}

    if (mcreds && mcreds.size) for(const [xid, c] of mcreds) {
      const obj = c.toObj
      creds[xid] = u8ToB64(await Crypt.crypt(keyK.value, encode(obj)), true)
    }
    if (Object.keys(creds).length === 0) creds = null

    if (mprofiles && mprofiles.size) for(const [profId, p] of mprofiles) {
      p.about = u8ToB64(await ecX(p.about), true)
      profiles[profId] = u8ToB64(encode(p))
    }
    if (Object.keys(profiles).length === 0) profiles = null

    const updateCreds: UpdateCreds = {
      userId: userId.value,
      app: stores.config.appname,
      shk: await Crypt.strongHash(keyK.value, false, false) as string,
      creds,
      delcreds : delcreds || [],
      profiles,
      delprofs: delprofs || [],
      nosafe: nocompile || false
     }
    const op = new SafeOperation('$UpdateCreds')
    let ret
    try {
      ret = await op.post({updateCreds}, mySafeStore.value)
    } catch(e) {
      op.ko(e);
      return -1
    }
    if (ret.status === 0 && !nocompile)
      try {
        await compileSafe(ret.safe)
      } catch (e) {
        console.log(e)
      }
    return ret.status
  }

  type UpdatePrefs = {
    app: string
    userId: string
    shk: string
    prefs: Object // clé: crId, valeur: Objet Credential sérialisé crypté
    delprefs: string[] // liste des crIds à supprimer
  }

  const updatePrefs = async (
      mprefs: Map<string, LocPref>,
      delprefs: string[]
      ) => {
    let prefs = {}

    if (mprefs && mprefs.size) for(const [,p] of mprefs) {
      prefs[p.code] = u8ToB64(encode([p.time, p.obj]), true)
    }
    if (Object.keys(prefs).length === 0) prefs = null

    const updatePrefs: UpdatePrefs = {
      userId: userId.value,
      app: stores.config.appname,
      shk: await Crypt.strongHash(keyK.value, false, false) as string,
      prefs,
      delprefs : delprefs || []
     }
    const op = new SafeOperation('$UpdatePrefs')
    let ret
    try {
      ret = await op.post({updatePrefs}, mySafeStore.value)
    } catch(e) {
      op.ko(e);
      return -1
    }
    if (ret.status === 0)
      try {
        await compileSafe(ret.safe)
      } catch (e) {
        console.log(e)
      }
    return ret.status
  }

  type TransmitCred = {
    targetId: string // id ou p0 ou r0 du destinataire du credential
    credXid: string // id du credential
    crpub: string // [cryptedCred, pubc] encodé et en base64
    // pubC: string // clé publique (PEM) de cryptage de l'émetteur
    // cryptedCred: string // Objet Credential sérialisé crypté pour le destinataire
  }

  const transmitCred = async (safeStore: string, cred: Credential, targetId: string) => {
    const op = new SafeOperation('$GetPublicKeys')
    let pubC
    const sh0 = await Crypt.strongHash(targetId, true, true) as Uint8Array
    const hp0 =  u8ToB64(sh0, true)
    try {
      const ret = await op.post({id: hp0}, safeStore)
      pubC = ret.crypt
      if (!pubC) return -1
    } catch(e) {
      op.ko(e);
      return -1
    }
    try {
      const aes = await Crypt.getAESKey(fromPem(pubC, true), fromPem(auth.value.D))
      const objt = await cred.toTObj(keyK.value, aes)
      const cryptedCred = u8ToB64(await Crypt.crypt(aes, encode(objt)))

      const crpub = u8ToB64(encode([cryptedCred, auth.value.C]))
      const transmitCred : TransmitCred = {
        targetId: hp0,
        credXid: cred.xid,
        crpub
      }
      const op = new SafeOperation('$TransmitCred')
      const ret = await op.post({transmitCred}, safeStore)
      return ret.status
    } catch(e) {
      op.ko(e);
      return -1
    }
  }

  watch(() => stores.session.incognito, async (v) => {
    await loadTrustings()
  })

  watch(() => stores.ui.reopenSession, async (v) => {
    const session = stores.session
    if (v) {
      await loadTrustings()
      if ((session.hasNet && session.incognito) || !userId.value) {
        await setStep(1)
      } else {
        if (session.hasNet) await reloadSafe()
        if (!session.incognito) await setStep(2)
      }
    }
  })

  return {
    step, setStep, backToAuth,
    mySafeStore, userId, userName, keyK,
    selectedProfile, selectedSession,
    openMode, incognito,
    devId, devName,
    users,
    hasIDBS, init0,
    resetAllLocal,
    newTrusting, newTSession,
    trustings, setTrusting, delTrusting, myTrusting,
    setTSession, delTSession, getMySessions, mySessions, sessionOfProfId,
    mySafeCreds, getCreds,
    mySafeProfiles, profileOfProfId,
    mySafePrefs,
    auth,
    devices,
    getAllSessions,
    createSafe, updSafeCodes, openSafeByPR, openSafeByPin, reloadSafe,
    setTrust, setUntrust, setAboutProfile, updateCreds, transmitCred,
    synthUsers, getBinSafe, setUntrustAll, delSafe, updatePrefs
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
