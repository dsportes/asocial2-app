// @ts-ignore
import { ref, computed, watch, reactive } from 'vue'
// @ts-ignore
import type { Ref } from 'vue'
// @ts-ignore
import { defineStore, acceptHMRUpdate } from 'pinia'
// @ts-ignore
import Dexie from 'dexie'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import stores from './all'
import { $t, sleep, quarter, equ8 } from '../src-fw/util'
import { AppExc } from '../src-fw/log'
import { SafeOperation, MDOperation, Operation, AOperation } from '../src-fw/operation'
import { Crypt } from '../src-fw/crypt'
import { idb } from '../src-fw/idb'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import { Registry, SOA } from '../src-fw/registry'
import { $Credential } from '../src-fw/documents'

/*
### Safes stockés dans un directory
Dans un directory externe de "safes", chaque "safe" est enregistré 
et accessible par sa clé primaire "userId",

La proriété "llq" (_last login quarter_) est gérée par le serveur 
et permet de récupérer tous les safes qui n'ont pas été accédés depuis longtemps
et de les purger.

La "valeur" accédée est la sérialisation par Msgpack d'un objet "Safe", 
(cryptée ou non par le serveur) indépendante des implémentations 
à condition de respecter les contraintes suivantes:
- les "map" vides sont null (et non pas des object vides, mal gérés sous PHP).
- les propriétés sont des "string / number / boolean".
- les valeurs "binaires" sont passées en textes encodés en base64 (les binaires ne sont pas supportés en PHP).

Les propriétés sont les suivantes:
- celles cités dans le "type Auth". Les données "binaires" (clés, etc.) sont des string en base 64.
- les maps "devices" "creds" "profiles" "prefs": chacune est un object javascript (ou associative array PHP).

"devices" : Devices de confiance. Une entrée par device identifiée par `devid`:
  - `about` : code / texte court **crypté par la clé K du _safe_**
    donné par l'utilisateur pour qualifier le _device_ (par exemple `PC d'Alice`).
  - `{ Va, cy, sign, nbe }` : propriétés cryptographiques permettant de valider
    que ce _device_ est de confiance.

"creds" : Credentials. Une entrée par "credId" : [nameK, credK, toCheck]
  - nameK : name correspondant au docPk du credential, crypté par K en base 64
  - credK : contenu du credential  { svc, org, docCl, docPk, privs privd } crypté par K en base 64
  - toCheck : si true, credential _indécis_ (existence réelle à vérifier).

"prefs" : Préférences avec une **sous-section par application** chacune donnant une
map (**cryptée par la clé K**) de clé `code` et de valeur `[time, obj]`:
  - `code` : texte court parlant pour l'utilisateur correspondant
    à un de ses usages habituels de l'application comme `mobile, large, simple, expert ...`.
  - `time`: date-heure de dernière mise à jour
  - `obj`: un objet sérialisé donnant les valeurs des _préférences_ à utiliser
    à l'ouverture d'une session.

"profiles" : Section organisée avec une **sous-section par application** regroupant une liste d'items
ayant un identifiant généré aléatoirement à sa création.
Chaque item est sérialisé en base64 et a les propriétés suivantes:
  - `about`: texte significatif pour l'utilisateur **crypté par la clé K**
    décrivant le _profil_ d'une session (par exemple `Revue des notes d'Alice et Jules`).
  - `creds`: liste des credId des _credentials_ qui sont attachés à une session
    de ce profil lors de son ouverture.

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
Un device qui a été déclaré _de confiance_ par au moins un utilisateur a une micro base de données 
IDB nommée `safe` ayant les tables suivantes.

#### `header`
Cette table _singleton_ a deux colonnes:
- `devId`: un identifiant généré aléatoirement à la première déclaration de confiance faite sur ce terminal.
- `devName`: le _nom_ du _device_, par exemple `PC d'Alice`, saisi par le premier déclarant de confiance.

#### `trustings`
Chaque row est associé à UN _utilisateur_ ayant déclaré le _device_ de confiance:
- `userId`: identifiant de l'utilisateur (clé primaire).
- `store`: safe store du user
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

export type Managements = { 
  label: string, // label du service [ org ]
  svc: string, 
  org: string,
  docCls: Set<string> // Set des classes de document "manager"
}

/*
export type SvcOrg = {
  k: string // svc / org
  label: string // label de svc
  svc: string
  org: string
  creds: $Credential[]
}
*/

export type LocPref = {
  code: string
  time: number
  obj: Uint8Array
}

export type MDuser = {
  userId: string // ID de l'utilisateur`
  hshK: string // SHA raccourci du Strong Hash de la clé K
  hsha1: string // SHA raccourci du Strong Hash de l'alias 1 (s'il existe). En base 64.
  hsha2: string // SHA raccourci du Strong Hash de l'alias 2 (s'il existe). En base 64.
  C: string // clé publique de cryptage de U. En base 64.
  V: string // clé publique de vérification de U. En base 64.
  llq: number // _last quarter login_. Numéro du trimestre de dernier login, 0 étant le premier de l'an 2000.
  store: string // code du store où est stocké à l'instant actuel le _safe_ de U.
  invit?: string
}

export type Alias = {
  a1K: string // alias 1 crypté par la clé K (en base 64).
  hsha1: string // SHA raccourci du Strong Hash de l'alias 1.
  a2K: string
  hsha2: string
}

export type Auth = {
  llq: number //_last login quarter_, trimestre du dernier login. Permet une _purge_ périodique des _safe_ obsolètes / fantômes.
  lm: number // _epoch_ en secondes de dernière mise à jour.
  C: string // clé de cryptage en clair (en base 64).
  D: string // clé de décryptage cryptée par la clé `K` (en base 64).
  S: string // clé de signature cryptée par la clé `K` (en base 64).
  V: string // clé de vérification en clair (en base 64).
  hshK: string // SHA raccourci du Strong Hash de la clé K.
  pseudo: string // dernier pseudo crypté par la clé K du _safe_ (en base 64) utilisé à la certification d'un terminal.

  hshp1: string // SHA raccourci du Strong Hash de la phrase 1 (en base 64).
  K1: string // clé K cryptée par le Strong Hash de la phrase 1.
  hshp2: string
  K2: string

  actual: Alias
  future: Alias | null
}

export type Safe = {
  userId: string
  auth: Auth
  devices: Object | null
  creds: Object | null
  options: Object | null
  prefs: Object | null // pour chaque application, liste des préférences déclarées (ordonnée par date d'utilisation)
}

export type ICVS = {
  i: string // userId
  c: string // clé publique C de cryptage en base64
  v: string // clé publique V de vérification en base64
  s: string // store: code de l'opérateur hébergeant son safe
}

type Device = {
  devName: string
  Va: string
  cy: string
  sign: string
  nbe: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const STORES = {
  header: 'id', // singleton: id = '1'
  trustings: 'id'
}

class Trusting {
  userId: string = ''
  store: string = '' // safe store du user
  pseudo: string = ''
  cx: string = ''
  K1: string = ''
  K2: string = ''
  Kp: string = ''
  appsDb: string[] = []

  constructor (obj: Object) {
    for(const f of Object.keys(obj)) this[f] = obj[f]
  }

  get toObj () : Object {
    const obj = {}
    for(const f of Object.keys(this)) obj[f] = this[f]
    return obj
  }

  hasAppDb () {
    const app = stores.config.K.APPNAME
    if (!this.appsDb || this.appsDb.length)
      return this.appsDb.indexOf(app) !== -1
  }

  addAppsDb () {
    const app = stores.config.K.APPNAME
    if (!this.appsDb) this.appsDb = []
    const i = this.appsDb.indexOf(app)
    if (i === -1) this.appsDb.push(app)
  }

  delAppsDb () {
    const app = stores.config.K.APPNAME
    if (!this.appsDb) this.appsDb = []
    const i = this.appsDb.indexOf(app)
    if (i !== -1) this.appsDb.splice(i, 1)
  }
}

function EX (e: any, op: string) {
  const ex = new AppExc(8, 'IDB_SAFE_error', op, [e.message])
  if (e && e.stack) ex.stack = e.stack
  return ex
}

export const useSafeStore = defineStore('safe', () => {

  const IDBsafe = ref(null) // IDB safe locale
  
  /* Map des "presque" constantes par user.
  L'opérateur gérant le safe peut changer en cours de session.
  */
  const icvs : Ref<Map<string, ICVS>> = ref(new Map())

  /* Base locale IDB : image en mémoire ***********************************************/
  const devId = ref('') // Depuis IDB Header
  const devName = ref('') // Depuis IDB Header
  const trustings : Ref<Map<string, Trusting>> = ref() // Depuis IDB trustings
  const myTrusting: Ref<Trusting> = computed(() => {
    if (!userId.value) return null
    for(const [,item] of trustings.value)
      if (item.userId === userId.value) return item
    return null
  })
  const users = computed(() =>
    trustings.value ? Array.from(trustings.value.values()) : [])

  /*
  watch(() => stores.session.noLocal, async (v) => {
    await loadTrustings()
  })
  */

  const init0 = async () : Promise<void> => {
    trustings.value = new Map<string, Trusting>()
    devId.value = ''
    devName.value = ''
    if (!IDBsafe.value && await Dexie.exists('safe')) 
      await init1()
  }

  const init1 = async () : Promise<void> => {
    try {
      IDBsafe.value = new Dexie('safe')
      IDBsafe.value.version(1).stores(STORES)
      await loadTrustings()
    } catch (e: any) {
      if (IDBsafe.value) {
        await IDBsafe.value.close()
        IDBsafe.value = null
      }
      console.log('Init0 IDBS failed: ' + e.message)
    }
  }

  const resetSafe = () => {
    icvs.value = new Map()
    auth.value = null
    userId.value = null
    keyK.value = null
    auth.value = null
    devices.value = null
    mySafePrefs.value = null
    mySafeCreds.value = null
    mySafeOptions.value = null
    credsToCheck.value = null
  }

  const setHeader = async () => {
    try {
      await IDBsafe.value.header.put({
        id: '1',
        devId: devId.value || '',
        devName: devName.value || ''
      })
    } catch (e) {
      throw EX(e, 'setHeader')
    }
  }

  const loadTrustings = async () => {
    const m: Map<string, Trusting> = new Map()
    if (!IDBsafe.value) {
      trustings.value = m
      return
    }
    const r = await IDBsafe.value.header.get('1')
    devId.value = r && r.devId ? r.devId : ''
    devName.value = r && r.devName ? r.devName : ''
    if (devId.value) {
      await IDBsafe.value.trustings.each(async (r) => {
        try {
          const obj = decode(r.bin)
          const t : Trusting = new Trusting(obj)
          m.set(t.userId, t)
        } catch (e) {
          console.log(e)
        }
      })
      trustings.value = m
    }
  }

  const setTrusting = async (t: Trusting) => {
    if (IDBsafe.value) try {
      const obj = t.toObj
      await IDBsafe.value.trustings.put({ id: t.userId, bin: encode(obj)})
      trustings.value.set(t.userId, t)
    } catch (e) {
      throw EX(e, 'setTrusting')
    }
  }

  const delTrusting = async (id: string) => {
    if (IDBsafe.value) try {
      await IDBsafe.value.trustings.where({id}).delete()
      trustings.value.delete(id)
    } catch (e) {
      throw EX(e, 'delTrusting')
    }
  }

  /**********************************************************************
  Safe central : copie locale du safe de l'utilisateur courant
  - permet un affichage complet, y compris pour les données relatives
    aux autres applications que celle qui s'exécute.
  **********************************************************************/

  const mySafeStore = ref('')
  const userId = ref(null)
  const keyK = ref(null)
  const userName = computed(() => {
    if (!userId.value) return ''
    const t = trustings.value.get(userId.value)
    return t ? t.pseudo : ''
  })

  /* Section "auth" */
  const auth: Ref<Auth> = ref(null)

  /* Section "devices de confiance" une entrée par device identifiée par `devid`*/
  const devices: Ref<Map<string, Device>> = ref() // cle devid

  /* Section "préférences" organisée avec une **sous-section par application**
  Seulement les préférences de app */
  const mySafePrefs: Ref<Map<string, Uint8Array>> = ref()

  /* Section "creds": organisée avec une **sous-section par application**
  Seulement les credentials de app */
  const mySafeCreds: Ref<Map<string, $Credential>> = ref()

  /* Section "options": organisée avec un **objet par application**
  Seulement l'objet options de app */
  const mySafeOptions: Ref<Object> = ref()

  const credsToCheck: Ref<string[]> = ref()

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

  const doOpSafe = async (op: SafeOperation, nocomp?: boolean) : Promise<number> => {
    let ret
    try {
      ret = await op.post()
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (ret.status === 0)
      try {
        if (!nocomp) await compileSafe(ret.safe)
      } catch (e) {
        console.log(e)
      }
    return ret.status
  }

  /* "Compilation" d'un objet Safe retour des opérations sur Safe
  Stocke en mémoire le dernier état du Safe revenu du serveur:
    - auth, devices, creds, prefs, profiles, invits
  La clé K :
    - soit vient d'être généré dans $createSafe
    - soit a été décryptée au retour des opérations AP $openSafeByPin
  */
  const compileSafe = async (safe: Safe) => {
    const privD = keyToB64(await Crypt.decrypt(keyK.value, keyFromB64(safe.auth.D)))
    const privS = keyToB64(await Crypt.decrypt(keyK.value, keyFromB64(safe.auth.S)))
    auth.value = {
      llq: safe.auth.llq,
      lm: safe.auth.lm,
      C: safe.auth.C,
      D: privD,
      S: privS,
      V: safe.auth.V,
      hshK: safe.auth.hshK,
      pseudo: await dcX(keyFromB64(safe.auth.pseudo)),
      hshp1: safe.auth.hshp1,
      K1: safe.auth.K1,
      hshp2: safe.auth.hshp2,
      K2: safe.auth.K2,
      actual: await compAlias(safe.auth.actual),
      future: await compAlias(safe.auth.future)
    } as Auth

    await loadDevices(safe) // devices
    await loadCreds(safe) // creds
    await loadPrefs(safe) // prefs
    await loadOptions(safe) // option
    if (safe.auth.future !== null)
      await resetAliases(safe)
  }

  /* Réalignement des alias actual / future sur la valeur détenue dans Master Directory.
  Sans échec: au pire rien n'est mis à jour maintenant.
  */
  const resetAliases = async (safe: Safe) => {
    const shK = await Crypt.strongHash(keyK.value, false, false) as string
    let op = new MDOperation('$mdUserGetAAS')
    let aas : string[] // [hsha1 hsha2 store]
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shK
      const res = await op.post()
      const x = res['aas']
      aas = res['aas']
      if (!aas) return
    } catch (e: any) {
      return
    }
    const [hsha1, hsha2, store] = aas
    const a = safe.auth.actual // jamais null
    const f = safe.auth.future // jamais null
    const ac: Alias = (a.hsha1 === hsha1 && (a.hsha2 && a.hsha2 === a.hsha2)) ? a : f
    op = new SafeOperation('$SetAliasSafe', mySafeStore.value)
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shK
      op.args['actual'] = ac
      op.args['future'] = null
      op.args['nosafe'] = true
      const res = await op.post()
      safe.auth.actual = ac
      safe.auth.future = null
    } catch (e: any) {
      return
    }
  }

  const compAlias = async (a: Alias | null) => {
    if (!a) return null
    if (a.a1K) a.a1K = await dcX(keyFromB64(a.a1K))
    if (a.a2K) a.a2K = await dcX(keyFromB64(a.a2K))
    return a
  }

  /* Devices de confiance *****************************************************************
  Une entrée par device identifiée par `devid`:
  - `about` : code / texte court **crypté par la clé K du _safe_**
    donné par l'utilisateur pour qualifier le _device_ (par exemple `PC d'Alice`).
  - `{ Va, cy, sign, nbe }` : propriétés cryptographiques permettant de valider
    que ce _device_ est de confiance.
  ****************************************************************************************/
  const loadDevices = async (safe: Safe) : Promise<void> => {
    const m = new Map<string, Device>()
    if (safe.devices) {
      let found = false
      for (const id in safe.devices) {
        if (id === devId.value) found = true
        const d: Device = safe.devices[id]
        d.devName = await dcX(keyFromB64(d.devName))
        m.set(id, d)
      }
      if (!found) // le device doit être retiré de la liste des trustings
        await delTrusting(devId.value)
      const tr = myTrusting.value as Trusting
      if (tr && ((tr.K1 !== auth.value.K1) || (tr.K2 !== auth.value.K2))) {
        tr.K1 = auth.value.K1
        tr.K2 = auth.value.K2
        setTrusting(tr)
      }
    }
    devices.value = m
  }

  /* Prefs *****************************************************************************
  Cette section est organisée avec une **sous-section par application** donnant une
  map (**cryptée par la clé K**) de clé `code` et de valeur `[time, obj]`:
  - `code` : texte court parlant pour l'utilisateur correspondant
    à un de ses usages habituels de l'application comme `mobile, large, simple, expert ...`.
  - `time`: date-heure de dernière mise à jour
  - `obj`: un objet sérialisé donnant les valeurs des _préférences_ à utiliser
    à l'ouverture d'une session.
  **************************************************************************************/
  const loadPrefs = async (safe: Safe) : Promise<void> => {
    const app = stores.config.K.APPNAME
    const p = new Map<string, [number, Uint8Array]>() // clé: app
    if (safe.prefs) {
      const x = safe.prefs[app]
      if (x) for (const code in x) {
        const z = keyFromB64(x[code]) // encode de [time, obj]
        const [time, obj] = decode(z)
        p.set(code, [time, obj])
      }
    }
    mySafePrefs.value = p
  }

  type UpdatePrefs = {
    app: string
    userId: string
    shK: string
    prefs: Object | null // clé: prefId, valeur: Objet Prefs sérialisé crypté
    delprefs: string[] // liste des crIds à supprimer
  }

  /* Mise à jour des préférences */
  const updatePrefs = async ( mprefs: Map<string, LocPref>, delprefs: string[] ) => {
    let prefs : Object | null = {}

    if (mprefs && mprefs.size) for(const [,p] of mprefs) {
      prefs[p.code] = keyToB64(encode([p.time, p.obj]))
    }
    if (Object.keys(prefs).length === 0) prefs = null

    const updatePrefs: UpdatePrefs = {
      app: stores.config.K.APPNAME,
      userId: userId.value,
      shK: await Crypt.strongHash(keyK.value, false, false) as string,
      prefs,
      delprefs : delprefs || []
    }
    const op = new SafeOperation('$UpdatePrefs', mySafeStore.value)
    op.args.updatePrefs = updatePrefs
    return await doOpSafe(op)
  }

  /* Options *************************************************************
  Un "objet" par application contenant ses options
  */
  const loadOptions = async (safe: Safe) : Promise<void> => {
    mySafeOptions.value = {}
    const app = stores.config.K.APPNAME
    if (safe.options) {
      const x = safe.options[app]
      if (x)
        mySafeOptions.value = await Crypt.decrypt(keyK.value, keyFromB64(x))
    }
  }

  type SetOptions = {
    app: string
    userId: string
    shK: string
    options: string // options cryptées par K
  }

  /* Mise à jour des options */
  const setOptions = async (options: Object) => {

    const so: SetOptions = {
      app: stores.config.K.APPNAME,
      userId: userId.value,
      shK: await Crypt.strongHash(keyK.value, false, false) as string,
      options: keyToB64(await Crypt.crypt(keyK.value, encode(options || {})))
    }
    const op = new SafeOperation('$SetOptions', mySafeStore.value)
    op.args.setOptions = so
    return await doOpSafe(op)
  }

  /* Creds ************************************************************************
  "creds" : Credentials. Une entrée par "credId" : [nameK, credK, toCheck]
    - nameK : name correspondant au docPk du credential, crypté par K en base 64
    - credK : contenu du credential  { svc, org, docCl, docPk, privs privd } crypté par K en base 64
    - toCheck : si true, credential _indécis_ (existence réelle à vérifier).
  ***********************************************************************************/
  const loadCreds = async (safe: Safe) : Promise<void> => {
    const m = new Map<string, $Credential>()
    const msvc = stores.config.K.SERVICES
    const orgs = new Set<string>([])
    const ctc = []
    if (safe.creds) for (const credId in safe.creds)
      try {
        const [nameK, credK, toCheck] = safe.creds[credId] as [string, string, boolean]
        const obj = decode(await Crypt.decrypt(keyK.value, keyFromB64(credK))) as Object
        if (msvc[obj['svc']]) {
          obj['name'] = await dcX(keyFromB64(nameK))
          obj['toCheck'] = toCheck || false
          if (toCheck) ctc.push(credId)
          const c: $Credential = $Credential.new(obj)
          m.set(c.credId, c)
          orgs.add(c.org)
        }
      } catch (e) {
        console.log(e)
      }
    mySafeCreds.value = m
    credsToCheck.value = ctc
    stores.session.setOrgs(orgs)
  }

  /* Retourne une map des credentials de l'utilisateur
  SANS les props des credentials
  - soit tous,
  - soit ceux du type spécifié.
  */
  const mySimpleCreds = (soa: SOA, docCl?: string) : Map<string, $Credential> => {
    const m : Map<string, $Credential> = new Map()
    for(const [credId, cred] of mySafeCreds.value)
      if (cred.svc === soa.svc && cred.org === soa.org 
        && (!docCl || docCl === cred.docCl)) m.set(credId, cred)
    return m
  }

  const myCredOfDoc = (docCl: string, docPk: string, soa?: any) : $Credential | null => {
    const s = soa || stores.session.currentOrgSvc
    for(const [, cred] of mySafeCreds.value)
      if (cred.svc === s.svc && cred.org === s.org 
        && cred.docCl === docCl && cred.docPk === docPk) 
        return cred
    return null
  }

  /* Retourne une map des credentials de l'utilisateur
  AVEC les props des credentials obtenus du service
  pour le svc / org courant de la session:
  - soit tous,
  - soit ceux du type spécifié.
  */
  const myFullCreds = async (soa: SOA, docCl?: string) : Promise<Map<string, $Credential>> => {
    const m : Map<string, $Credential> = mySimpleCreds(soa, docCl)
    if (!m.size) return m
    const op = new Operation('PropsOfMyCreds', soa.svc, soa.org)
    try {
      for(const [,cred] of m) 
        await op.sign(cred)
      const res = await op.post()
      const props: Object = res.props
      for(const credId of Object.keys(props)) {
        const e = m.get(credId)
        if (e) e.props = props[credId]
      }
      return m
    } catch (e) { 
      await op.ko(e)
      return m 
    }
  }

  type SetNameCred = {
    userId: string //
    shK: string // shaS de la clé K en base 64
    credId: string // id du credential
    nameK: string // nom (correspondant à docId) crypté par K et en base 64
  }

  /* Mise à jour du "name" d'un Cred en safe */
  const updateCredName = async ( credId: string, name: string )
    : Promise<boolean> => {
    const setNameCred : SetNameCred = {
      userId: userId.value,
      shK: await Crypt.strongHash(keyK.value, false, false) as string,
      credId,
      nameK: keyToB64(await ecX(name)),
    }
    const op = new SafeOperation('$UpdateCredName', mySafeStore.value)
    op.args.setNameCred = setNameCred
    try {
      await doOpSafe(op)
      return true
    } catch (e: any) {
      op.ko(e)
      return false
    }
  }

  type FixCreds = {
    userId: string
    shK: string
    toDel: string[]
    toFix: string[]
  }
  /* Fixe l'existence / révoque de credentials en safe */
  const fixCreds = async (toFix: string[], toDel: string[]) => {
    const fixCreds: FixCreds = {
      userId: userId.value,
      shK: await Crypt.strongHash(keyK.value, false, false) as string,
      toFix, toDel
    }
    const op = new SafeOperation('$FixCreds', mySafeStore.value)
    op.args.fixCreds = fixCreds
    return await doOpSafe(op)
  }

  /* Credential de type "manager" *****************************************/
  const managerCreds = () : Map<string, $Credential> => {
    const m = new Map()
    for (const [, c] of mySafeCreds.value)
      if (Registry.managers.has(c.svc + '$' + c.docCl)) m.set(c.credId, c)
    return m
  }

  /* Retourne le set des docCl de type "manager" sur lesquelles l'utilisateur 
  a un credential. Si la liste n'est pas vide, l'utilisateur est un "manager"
  à au moins un titre.
  */
  const isManager = (svc: string, org: string) : Set<string> => {
    const s: Set<string> = new Set()
     for (const [,c] of mySafeCreds.value)
      if (c.org === org && c.svc === svc)
        if (Registry.managers.has(c.svc + '$' + c.docCl)) s.add(c.svc + '$' + c.docCl)
    return s
  }

  const createSafe = async (
    store: string, a1: string, a2: string, shp1: Uint8Array, shp2: Uint8Array,
    userId: string, invitCode: string) => {
    AOperation.reset()
    keyK.value = Crypt.random(32)
    const hshK = Crypt.shaS(await Crypt.strongHash(keyK.value, false, true))
    const K1 = keyToB64(await Crypt.crypt(shp1, keyK.value))
    const K2 = !shp2 ? '' : keyToB64(await Crypt.crypt(shp2, keyK.value))
    const hshp1 = Crypt.shaS(shp1)
    const hshp2 = !shp2 ? '' : Crypt.shaS(shp2)

    const kpcd = await Crypt.getKeyPair()
    const kpsv = await Crypt.getSVKeyPair()
    const C = keyToB64(kpcd.pub)
    const D = keyToB64(await Crypt.crypt(keyK.value, new Uint8Array(kpcd.priv)))
    const V = keyToB64(kpsv.pub)
    const S = keyToB64(await Crypt.crypt(keyK.value, new Uint8Array(kpsv.priv)))

    const a1K = keyToB64(await Crypt.crypt(keyK.value, encoder.encode(a1)))
    const a2K = !a2 ? '' : keyToB64(await Crypt.crypt(keyK.value, encoder.encode(a2)))
    const hsha1 = Crypt.shaS(await Crypt.strongHash(a1, false, true))
    const hsha2 = !a2 ? '' : Crypt.shaS(await Crypt.strongHash(a2, false, true))

    const d = new Date()
    const llq = quarter(d)

    const auth: Auth = {
      llq,
      lm: d.getTime(),
      C, D, S, V, hshK,
      pseudo: '',
      hshp1, K1, hshp2, K2,
      actual: { a1K, hsha1, a2K, hsha2 } as Alias,
      future: null
    }

    const safe: Safe = {
      userId,
      auth: auth,
      devices: null,
      creds: null,
      options: null,
      prefs: null
    }

    const mdUser: MDuser = {
      userId,
      hshK, hsha1, hsha2, C, V, llq,
      store: store
    }
    if (invitCode) mdUser.invit = invitCode

    const status = await restoreSafe(store, safe, mdUser)
    if (!status)
      await compileSafe(safe)
    return status
  }

  const createInvit = async (userId: string, invitCode: string) : Promise<number> => {
    const hsha1 = Crypt.shaS(await Crypt.strongHash(invitCode, false, true))
    const d = new Date()
    const llq = quarter(d)

    const mdUser: MDuser = {
      userId: userId,
      hshK: '', 
      hsha1, hsha2: '', C: '', V: '', 
      llq,
      store: ''
    }
    const op = new MDOperation('$mdUserNew')
    try {
      op.args.mdUser = mdUser
      const res = await op.post()
      return res.status
    } catch (e) {
      op.ko(e)
      return -1
    }

  }

  const restoreSafe = async (store: string, safe: Safe, mdUser: MDuser)
    : Promise<number> => {
    AOperation.reset()
    // Enregistrement dans le Master Directory
    let op = new MDOperation('$mdUserNew')
    try {
      op.args.mdUser = mdUser
      const res = await op.post()
      /* Result 'status':
      - 0 OK.
      - 1 alias 1 déjà utilisé
      - 2 alias 2 déjà utilisé
      - 3 user déjà déclaré avec des valeurs différentes
      */
      if (res.status) return res.status + 10
    } catch (e) {
      op.ko(e)
      return -1
    }

    mySafeStore.value = store
    // Enregistrement dans le Safe Store
    op = new SafeOperation('$CreateSafe', store)
    try {
      op.args['safe'] = safe
      await op.post()
      // pas de status, mais exception toujours possible ("duplicate key ...")
      return 0
    } catch (e) {
      op.ko(e)
      return -1
    }
  }

  const setPhraseSafe = async (shp1: Uint8Array, shp2: Uint8Array) : Promise<number> => {
    const K1 = keyToB64(await Crypt.crypt(shp1, keyK.value))
    const K2 = !shp2 ? '' : keyToB64(await Crypt.crypt(shp2, keyK.value))
    const hshp1 = Crypt.shaS(shp1)
    const hshp2 = !shp2 ? '' : Crypt.shaS(shp2)
    // Enregistrement dans le Safe Store
    const op = new SafeOperation('$SetPhraseSafe', mySafeStore.value)
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = await Crypt.strongHash(keyK.value, false, false) as string
      op.args['hshp1'] = hshp1
      op.args['K1'] = K1
      op.args['hshp2'] = hshp2
      op.args['K2'] = K2
      const ret = await op.post()
      if (!ret.status)
        await compileSafe(ret.safe)
      return ret.status
    } catch (e) {
      op.ko(e)
      return -1
    }
  }

  /* Retourne true / false / -1 */
  const mdAliasFree = async (alias: string) => {
    const op = new MDOperation('$mdAliasFree')
    try {
      op.args['alias'] = Crypt.shaS(await Crypt.strongHash(alias, false, true))
      const res = await op.post()
      return res.aliasfree
    } catch (e) {
      op.ko(e)
      return -1
    }
  }

  /* Retourne ICVS (i, c, v, s) d'un user
  - userId est soit un userId, soit par le hsh d'un alias
  - force: si true, n'utilise pas le cache.
  Obligatoire quand on veut à coup sur le store (qui n'est pas constant).
  */
  const mdUserGetICVS = async (userId: string, force?: boolean)
    : Promise<ICVS | null> => {
    let x = icvs.value.get(userId)
    if (!force && x) return x
    const op = new MDOperation('$mdUserGetICVS')
    try {
      op.args['userId'] = userId
      const ret = await op.post()
      const r = ret['icvs'] as ICVS
      if (!r) return null
      if (x) x.s = r.s // rafraichit le store (non constant)
      else if (r.c) icvs.value.set(r.i, r) // on ne stocke pas les invitations en cours
      return r
    } catch(e) {
      op.ko(e)
      return null
    }
  }

  const delSafe = async () => {
    const shk = await Crypt.strongHash(keyK.value, false, false)
    let op = new MDOperation('$mdUserDel')
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shk
      const ret = await op.post()
      if (ret.status) return ret.status
    } catch(e) {
      op.ko(e)
      return -1
    }

    op = new SafeOperation('$DelSafe', mySafeStore.value)
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shk
      const ret = await op.post()
      return ret.status
    } catch (e) {
      op.ko(e)
      return -1
    }
  }

  /* Login à un safe depuis son ID et shp:
  - StrongHash d'une de ses phrases en base 64
  Login a récupéré le userId et le store depuis le Master Directory et un alias
  */
  const openSafeByAP = async ( safeId: string, store: string, shp: string ) => {
    AOperation.reset()
    const op = new SafeOperation('$GetSafe', store)
    let ret
    try {
      op.args['userId'] = safeId
      op.args['shp'] = shp
      ret = await op.post()
    } catch (e) {
      op.ko(e)
      return -1
    }
    if (ret.status === 0) {
      const x = keyFromB64(shp)
      const hshp = Crypt.shaS(x)
      userId.value = ret.safe.userId
      mySafeStore.value = store
      const a = ret.safe.auth as Auth
      const K = a.hshp1 === hshp ? a.K1 : a.K2
      try {
        keyK.value = await Crypt.decrypt(x, keyFromB64(K))
        await compileSafe(ret.safe)
      } catch (e: any) {
        ret.status = 3
      }
    }
    return ret.status
  }

  /* Login a récupéré l'item de Trustings choisi par l'utilisateur
  en fonction de son pseudo.
  - pin a été saisi par l'utilisateur
  */
  const openSafeByPin = async ( pin: string, t: Trusting) : Promise<number> => {
    AOperation.reset()
    const pincx: string = await Crypt.strongHash(pin + '/' + t.cx, false, false) as string

    let ret
    let op = new SafeOperation('$OpenSafeByPin', t.store)
    try {
      op.args['userId'] = t.userId
      op.args['devId'] = devId.value
      op.args['pincx'] = pincx
      ret = await op.post()
    } catch (e) {
      op.ko(e)
      return -1
    }
    // Status: 1-pas de safe 4-pas de device 5-échec>2 6-echec<2
    if (ret.status !== 0) return ret.status
    const cy = ret.cy
    const pincxcy: Uint8Array = await Crypt.strongHash(pin + '/' + t.cx + '/' + cy, false, true) as Uint8Array
    try {
      keyK.value = await Crypt.decrypt(pincxcy, keyFromB64(t.Kp))
    } catch (e) {
      return 8
    }
    const shK = await Crypt.strongHash(keyK.value, false, false)

    op = new SafeOperation('$GetSafe', t.store)
    try {
      op.args['userId'] = t.userId
      op.args['shK'] = shK
      ret = await op.post()
    } catch (e) {
      op.ko(e)
      return -1
    }
    // status: 1-pas de safe avec ce user 2:shk 3:shp
    if (ret.status) return 9
    userId.value = t.userId
    await compileSafe(ret.safe)
    return 0
  }

  const openSafeByPlane = async (shp: Uint8Array,  t: Trusting) : Promise<number> => {
    AOperation.reset()
    keyK.value = null
    if (t.K1) {
      try {
        const k = await Crypt.decrypt(shp, keyFromB64(t.K1))
        userId.value = t.userId
        keyK.value = k
        return 0
      } catch (e) {  }
    }
    if (t.K2) {
      try {
        const k = await Crypt.decrypt(shp, keyFromB64(t.K2))
        userId.value = t.userId
        keyK.value = k
        return 0
      } catch (e) {  }
    }
    return 1
  }

  /* Set d'un ou de deux alias de l'utilisateur.
  - 1) écrit les alias en future dans safe
  - 2) enregistre futur dans le Master Directory
  - 3) transfert de futur dans actual dans le safe
  */
  const setAlias = async (a1: string, a2: string) : Promise<boolean> => {
    const a1K = keyToB64(await Crypt.crypt(keyK.value, encoder.encode(a1)))
    const a2K = !a2 ? '' : keyToB64(await Crypt.crypt(keyK.value, encoder.encode(a2)))
    const sha1 = await Crypt.strongHash(encoder.encode(a1), false, true)
    const hsha1 = Crypt.shaS(sha1)
    const sha2 = !a2 ? '' : await Crypt.strongHash(encoder.encode(a2), false, true)
    const hsha2 = !sha2 ? '' : Crypt.shaS(sha2)
    const shK = await Crypt.strongHash(keyK.value, false, false)

    // phase 1 : enregistre le futur dans le safe
    let ac = { ...auth.value.actual }
    ac.a1K = keyToB64(await Crypt.crypt(keyK.value, encoder.encode(ac.a1K)))
    ac.a2K = !ac.a2K ? '' : keyToB64(await Crypt.crypt(keyK.value, encoder.encode(ac.a2K)))

    let fu : Alias = { a1K, a2K, hsha1, hsha2 }
    let op = new SafeOperation('$SetAliasSafe', mySafeStore.value)
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shK
      op.args['actual'] = ac
      op.args['future'] = fu
      op.args['nosafe'] = true
      const res = await op.post()
      auth.actual = ac
      auth.future = fu
    } catch (e: any) {
      op.ko(e)
      return false // le safe est incertain
    }

    // phase 2: enregistre le futur dans MD
    op = new MDOperation('$mdUserSetAA')
    let aas : string[] // [hsha1 hsha2 store]
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shK
      op.args['sha1'] = sha1
      op.args['sha2'] = sha2
      const res = await op.post()
    } catch (e: any) {
      op.ko(e)
      return false // le safe est incertain
    }

    // phase 3 : enregistre le futur en tant qu'actual dans le safe
    op = new SafeOperation('$SetAliasSafe', mySafeStore.value)
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = shK
      op.args['actual'] = fu
      op.args['future'] = null
      op.args['nosafe'] = false
      const res = await op.post()
      await compileSafe(res['safe'])
    } catch (e: any) {
      op.ko(e) // ré
      return false // le safe est incertain
    }
    return true
  }

  type TrustDev = {
    userId: string
    devId: string
    shK: string
    devName: string
    Va: string
    cy: string
    sign: string
    pseudo: string
  }

  /* Certifie le device courant, le nomme name et attribue le pseudo de l'utilisateur.
  */
  const setTrust = async (name: string, pin: string, pseudo: string) => {
    if (!IDBsafe) await init1()
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
    const Kp = keyToB64(await Crypt.crypt(pincxcy, keyK.value))

    const t: Trusting = new Trusting({
      userId: userId.value,
      store: mySafeStore.value,
      pseudo: pseudo,
      cx: cx,
      K1: auth.value.K1,
      K2: auth.value.K2,
      Kp: Kp
    })
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
    const sign = keyToB64(asn1)
    const Va = keyToB64(kpsv.pub)
    const shK = await Crypt.strongHash(keyK.value, false, false) as string
    const trustDev: TrustDev = {
      userId: userId.value,
      shK,
      pseudo: keyToB64(await ecX(pseudo)),
      devId: devId.value,
      devName: keyToB64(await Crypt.crypt(keyK.value, encoder.encode(devName.value))),
      Va, cy, sign
    }
    const op = new SafeOperation('$TrustDevice', mySafeStore.value)
    let ret
    try {
      op.args['trustDev'] = trustDev
      ret = await op.post()
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  type UntrustDev = {
    userId: string
    shK: string
    devIds: string[]
  }
  const setUntrust = async () => {
    if (!IDBsafe) await init1()
    const t: Trusting = myTrusting.value
    if (!t) return 0 // était déjà untrusted
    await delTrusting(t.userId)
    const untrustDev: UntrustDev = {
      userId: userId.value,
      shK: await Crypt.strongHash(keyK.value, false, false) as string,
      devIds: [devId.value]
    }
    const op = new SafeOperation('$UntrustDevices', mySafeStore.value)
    let ret
    try {
      op.args['untrustDev'] = untrustDev
      ret = await op.post()
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
      shK: await Crypt.strongHash(keyK.value, false, false) as string
    }
    const op = new SafeOperation('$UntrustDevices', mySafeStore.value)
    let ret
    try {
      op.args.untrustDev = untrustDev
      ret = await op.post()
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  const reloadSafe = async () : Promise<number> => {
    const op = new SafeOperation('$GetSafe', mySafeStore.value)
    let ret
    try {
      op.args['userId'] = userId.value
      op.args['shK'] = await Crypt.strongHash(keyK.value, false, false) as string
      ret = await op.post()
    } catch(e) {
      op.ko(e)
      return -1
    }
    if (!ret.status)
      await compileSafe(ret.safe)
    return ret.status
  }

  const getSafe = async () : Promise<number | Object> => {
    const op = new SafeOperation('$GetSafe', mySafeStore.value)
    let ret
    try {
      op.args.userId = userId.value
      op.args.shK = await Crypt.strongHash(keyK.value, false, false) as string
      ret = await op.post()
      return ret.status || ret.safe
    } catch(e) {
      op.ko(e)
      return -1
    }
  }

  return {
    init0, init1, resetSafe, IDBsafe, loadTrustings,
    devId, devName,
    trustings, myTrusting, delTrusting, users,

    mySafeStore, userId, userName, keyK,

    auth, devices, mySafePrefs, mySafeCreds, mySafeOptions,
    updatePrefs, setOptions, updateCredName, fixCreds,
    managerCreds, isManager,
    mySimpleCreds, myFullCreds, myCredOfDoc,
    createSafe, setPhraseSafe, mdAliasFree, mdUserGetICVS,
    openSafeByAP, openSafeByPin, openSafeByPlane,
    setAlias, setTrust,setUntrust, setUntrustAll,

    getSafe, delSafe, restoreSafe, reloadSafe, createInvit
  }
})

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSafeStore, import.meta.hot));
}
