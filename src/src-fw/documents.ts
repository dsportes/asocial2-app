// @ts-ignore
import { encode } from '@msgpack/msgpack'
import { Crypt } from '../src-fw/crypt'
import { Registry } from './registry'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import stores from '../stores/all'
import { TopicDef } from '../stores/service-store'
import { $t, dhcool, hasMessage } from '../src-fw/util'
import { MDOperation, Operation, CVKeys } from '../src-fw/operation'
import { FormType } from '../src-fw/doctypes'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type Cred = { // Credential attaché à un document
  pubv: Uint8Array
  pubc: Uint8Array
  limit: number
  docKey: Uint8Array | null
  opaque: Uint8Array | null
  more: any
  credId: string
}

/* Credential: possiblemernt mis à jour depuis le document (v more).
*/
export class Credential {
  static lp1 = [ 'credId', 'v', 'svc', 'org', 'docCl', 'docPk', 
    'privs', 'privd', 'name', 'docKey', 'opaque', 'more' ]

  credId: string = '' // ID du credential.
  v: number = 0 // version du document
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.

  docCl: string = '' // classe du document "maître"  du credential
  docPk: string = '' // clé primaire du document maitre du credential.

  pubv?: Uint8Array | null = null // clé publique de vérification: doc seulement
  privs?: Uint8Array | null = null // clé PRIVEE de signature en base64: safe seulement
  pubc?: Uint8Array | null = null // clé publique de cryptage: doc seulement
  privd?: Uint8Array | null = null // clé PRIVEE de decryptage en base64: safe seulement

  name: string = '' // "nom" associé au docId.
  
  docKey?: Uint8Array | null
  opaque?: any | null
  more?: any | null

  alert?: number // 0:safe et db,  1:safe pas db, 2: limit dépassée

  static new (obj): Credential {
    const c = Registry.newD('$Credential', obj) as  Credential
    for (const p of Credential.lp1) this[p] = obj[p] || null
    if (!c.credId) c.credId = Crypt.rnd(15)
    return c
  }

  get limit () { return this.more && this.more.limit ? this.more.limit : 0 }

  constructor (obj?: Object) {
    if (obj)
      for (const p of Credential.lp1) this[p] = obj[p] || null
    if (!this.credId) this.credId = Crypt.rnd(15)
  }

  get serial () : Uint8Array {
    const obj = {}
    for (const p of Credential.lp1) obj[p] = this[p] || null
    return encode(obj)
  }

  async dispMore () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRmore', [JSON.stringify(this.more, null, '\t')]))
  }

  async dispLimit () { 
    if (this.limit)
      await stores.ui.diagDisplay($t('CRRlimit', [dhcool(this.limit * 1000)]))
  }

  async dispDocKey () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRdocKey', [keyToB64(this.docKey || null)]))
  }

  async dispOpaque () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRopaque', [JSON.stringify(this.opaque, null, '\t')]))
  }

}
Registry.registerD(Credential)


export class MDEvent {
  // Immuables
  eventId: string // (PK) identifiant universel de l’événement / processus (formId pour un Form).
  type: string // code du type d'événement / processus.
  userId: string // utilisateur cible (INDEX).
  svc: string // service concerné.
  org: string // organisation concernée.
  // Modifiables par les opérations seulement:
  v: number // version, date-heure (_epoch_) du _document_. 
  maxLife: number // time-to-live calculé depuis `v` et `type`. (INDEX pour purges périodiques).
  status: number // son statut courant.
  detail: Object // objet de structure dépendant de _type_.
  // Lisibles et modifiables par U seulement:
  comment: string // commentaire de l'utilisateur cible crypté par lui.
  lv: number // last view, date-heure du dernier état _vu_ par U. La comparaison avec `v` permet de détecter ce qui a _changé_ depuis le dernier scan par U.

  static async new (obj: any) : Promise<MDEvent> {
    const sf = stores.safe
    const e = new MDEvent()
    for(const p of Object.keys(obj)) if (p !== 'comment') e[p] = obj[p]
    e.comment = obj.comment === null ? '' : 
      decoder.decode(await Crypt.decrypt(sf.keyK, obj.comment))
    return e
  }
 
  static async listEvents () : Promise<MDEvent[]> {
    const sf = stores.safe
    const op = new MDOperation('$mdEventList')
    op.args.userId = sf.userId
    const res = await op.post()
    const lst = res.mdevents
    const l: MDEvent[] = []
    if (lst && lst.length) for(const x of lst)
      l.push(await MDEvent.new(x))
    return l
  }

  /* Ne passer comment que si changé. Pour effacer passer ''
  Si setlv est true, mettre à jour lv à v */
  async mdEventUser (setlv: boolean, comment?: string) {
    const sf = stores.safe
    const op = new MDOperation('$mdEventUser')
    /*
    const eventId = this.args['eventId'] as string
    const setlv = this.args['setlv'] as boolean
    const comment = this.args['comment'] as Uint8Array | null
    const chk = this.args['chk'] as string
    */
    op.args.eventId = this.eventId
    op.args.setlv = setlv
    op.args.comment = comment === undefined ? null : await Crypt.crypt(sf.keyK, encoder.encode(comment))
    op.args.chk = Crypt.shaS([this.eventId, this.type, this.userId, this.svc, this.org].join('/'))
    await op.post()
  }

  async mdEventSync () {
    const sf = stores.safe
    const op = new MDOperation('$mdEventSync')
    /*
    const eventId = this.args['eventId'] as string
    const chk = this.args['chk'] as string
    */
    op.args.eventId = this.eventId
    op.args.chk = Crypt.shaS([this.eventId, this.type, this.userId, this.svc, this.org].join('/'))
    await op.post()
  }

  async mdEventDel () {
    const sf = stores.safe
    const op = new MDOperation('$mdEventDel')
    /*
    const eventId = this.args['eventId'] as string
    const chk = this.args['chk'] as string
    */
    op.args.eventId = this.eventId
    op.args.chk = Crypt.shaS([this.eventId, this.type, this.userId, this.svc, this.org].join('/'))
    await op.post()
  }
}

export type $FormObj = {
  formId: string  // ID universel aléatoire.
  type: string  // type du formulaire.
  userId: string  // utilisateur cible.
  v: number  //  version du document (_epoch_).
  maxLife: number //  EPOCH en MINUTES de suppression automatique du formulaire.
  status: number // de 1 à 4.
  etcU: Object | null  // objet de structure spécifique du type. Saisi par l'utilisateur et le tiers.
  etcT: Object | null  // valeur de etc _avant_: en statut 1 c'est le dernier état en statut 2, en statut 2 c'est le dernier état en statut 1. Permet un _undo_ de remord de U quand il avait modifié etc mais que finalement il accepte la dernière proposition de T (et symétriquement pour T).
  msgU: Uint8Array | null  // message écrit par U.
  msgT: Uint8Array | null  // message écrit par le tiers.

  comment?: Uint8Array | null // commentaire écrit et crypté par U.
  ch?: string // challenge random de synchronisation initiale avec MDEvent
  lv?: number // lastView par U
}

/*
Document `Form` hébergé dans la DB spécifique de `svc / org`.
Sous-classes applicatives $Form_type par "type"
*/
export class $Form extends Document {
  /* Par commodité svc et org sont ajoutés au $Form lu (par Get ou List)
  du service. */
  svc?: string
  org?: string

  formId: string = '' // ID universel aléatoire.
  type: string = '' // type du formulaire.
  userId: string = '' // utilisateur cible.
  v: number = 0 //  version du document (_epoch_).
  maxLife: number = 0 //  EPOCH en SECONDES de suppression automatique du formulaire.
  status: number = 0 // de 1 à 4.
  etcU: Object | null = null // objet de structure spécifique du type. Saisi par l'utilisateur et le tiers.
  etcT: Object | null = null // valeur de etc _avant_: en statut 1 c'est le dernier état en statut 2, en statut 2 c'est le dernier état en statut 1. Permet un _undo_ de remord de U quand il avait modifié etc mais que finalement il accepte la dernière proposition de T (et symétriquement pour T).
  msgU: Uint8Array | null = null // message écrit par U.
  msgT: Uint8Array | null = null // message écrit par le tiers.

  comment?: Uint8Array | null = null // commentaire écrit et crypté par U.
  ch?: string = '' // challenge random de synchronisation initiale avec MDEvent
  lv?: number = 0 // lastView par U

  _aesU?: Uint8Array | null = null

  /* Traitement final: surchargé par type :Retourne un statut de validation,
  - 0 si OK, N > 10 selon la cause d'échec
  */
  async checkEtc () : Promise<number> { return 0 }
  async validate () : Promise<number> { return 0 }

  /* Pour création de l'instance à réception par le service
  OU pour création explicite par UI */
  static lp1 = ['svc', 'org', 'formId', 'type', 'userId', 'v', 'maxLife', 
    'status', 'etcU', 'etcT', 'msgU', 'msgT' ]

  /* Pour transmission au service à la création par $FormObj */
  static lp2 = ['formId', 'type', 'userId', 'v', 'maxLife', 
    'status', 'etcU', 'etcT', 'msgU', 'msgT' ]

  static new (obj) : $Form {
    const f = Registry.newD('$Form', obj)
    for (const p of $Form.lp1) f[p] = obj[p]
    return f
  }

  // Pour création: envoi au service
  toFormObj () : $FormObj {
    const obj = {}
    for (const p of $Form.lp1) obj[p] = this[p]
    return obj as $FormObj
  }

  chk () { 
    return Crypt.shaS([this.formId, this.type, this.userId, this.svc, this.org].join('/')) 
  }

  get ft () : FormType { return FormType.formTypes.get(this.type) || FormType.formTypes.get('default')}

  async aesU () : Promise<Uint8Array> { 
    if (!this._aesU) {
      const fk = await CVKeys.getCKey(this.svc, this.org, this.ft.key) 
      const sf = stores.safe
      this._aesU = await Crypt.getAESKey(sf.auth.D, fk)
    }
    return this._aesU
  }

  /* Une opération de lecture du formulaire peut décrypter `msgU` en utilisant le couple, 
  de la clé _privée_ de décryptage du formulaire (accessible dans l'opération du service)
  et de la clé _publique_ de cryptage de U (également accessible puisque `userId` est l'ID de U). 
  */
  async decryptMsgU () : Promise<void> {
    if (this.msgU)
      this.msgU = await Crypt.decrypt(await this.aesU(), this.msgU)
  }

  async cryptMsgU () : Promise<void> {
    if (this.msgU)
      this.msgU = await Crypt.crypt(await this.aesU(), this.msgU)
  }

  /*
  // Calcul this.creds depuis le template du type et les arguments $x dans etc
  setCreds () { // TODO: utilité ???????
    const etc = this.status === 1 ? this.etcU : this.etcT
    const creds = []
    for(const c of this.ft.creds) { // Scan du template des credentials requis
      const i = c.indexOf('$')
      if (i !== -1) {
        const arg = c.substring(i, i + 1)
        const val = etc[arg] || ''
        creds.push(c.replace(arg, val))
      } else creds.push(c)
    }
    this.creds = creds // tous les ...$x.. du template remplacés par les $x de etc
  }

  // vérifie si le user est habilité en tant que tiers
  async checkAuthTP () : Promise<boolean> {
    const sf = stores.safe
    const t = this.ft.creds
    if (t && t.length === 1 && t[0] === 'A')
      return await sf.adminForSvcOrg(this.svc, this.org)
    for (const c of this.creds) {
      const x = c.split('/')
      const cred = sf.getCredOn(this.svc, this.org, x[0], x[1], true)
      if (cred) return true
    }
    return false
  }
  */

  static credsForTP (svc: string, org: string) : Set<Credential> {
    const creds: Set<Credential> = new Set()
    const sf = stores.safe
    for(const [, c] of sf.mySafeCreds.value)
      if (c.svc === svc && c.org === org &&
        (FormType.refClasses1.has(c.docCl) || FormType.refClasses$.has(c.docCl)))
        creds.add(c)
    return creds
  }

  static async get(svc: string, org: string, formId: string, type: string) : Promise<$Form> {
    const creds = $Form.credsForTP(svc, org)
    if (!creds.size) return null
    const op = new Operation('FormGet', svc, org)
    for(const cred of creds) await op.sign(cred)
    op.args.formId = formId
    op.args.type = type
    const res = await op.post()
    const obj = res.form
    if (!obj) return null
    const f = $Form.new(obj)
    f.svc = svc
    f.org = org
    await f.decryptMsgU()
    return f
  }

  /* Retourne une liste de $Form pour un utilisateur tiers
  si f = ['A'] retourne les forms devant être traitées par un administrateur
  */
  static async filteredList (svc: string, org: string, asAdmin: boolean) : Promise<$Form[]> {    
    const creds = $Form.credsForTP(svc, org)
    if (!creds.size) return []
    let filter: string[]
    const sf = stores.safe
    if (asAdmin) {
      if (!await sf.adminForSvcOrg(svc, org)) return []
      filter = ['A']
    } else {
      const fi: Set<string> = new Set()
      for(const [,c] of sf.mySafeCreds.value) {
        if (c.svc !== svc || c.org !== org) continue
        if (c.docPk === '1') {
          if (FormType.refClasses1.has(c.docCl)) fi.add(c.docCl + '/1')
        } else {
          if (FormType.refClasses$.has(c.docCl)) fi.add(c.docCl + '/' + c.docPk)
        }
      }
      if (fi.size === 0) return []
      filter = Array.from(fi)
    }
    const op = new Operation('FormFilteredList', svc, org)
    for(const cred of creds) await op.sign(cred)
    op.args.filter = filter
    const res = await op.post()
    const lst = res.forms as $FormObj[]
    if (!lst || !lst.length) return []
    const lf: $Form[] = []
    for(const obj of lst) {
      const f = $Form.new(obj)
      f.svc = svc
      f.org = org
      await f.decryptMsgU()
    }
    return lf
  }

}
Registry.registerD($Form)