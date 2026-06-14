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


export type $FormObj = {
  svc?: string
  org?: string
  formId: string  // ID universel aléatoire.
  type: string  // type du formulaire.
  userId: string  // utilisateur cible.
  v: number  //  version du document (_epoch_).
  maxLife: number //  EPOCH en MINUTES de suppression automatique du formulaire.
  status: number // de 1 à 4.
  etc: Object | null  // objet de structure spécifique du type. Saisi par l'utilisateur et le tiers.
  etcB: Object | null  // valeur de etc _avant_: en statut 1 c'est le dernier état en statut 2, en statut 2 c'est le dernier état en statut 1. Permet un _undo_ de remord de U quand il avait modifié etc mais que finalement il accepte la dernière proposition de T (et symétriquement pour T).
  msgU: Uint8Array | null  // message écrit par U.
  msgT: Uint8Array | null  // message écrit par le tiers.

  /* liste des credentials permettant à un tiers d'agir quand il possède l'un de ceux-là:
  [ docCl1/docPk1 ... ]
  La liste dépende la valeur de etc : depuis la liste template [ docCl1/$x ... ]
  $x est remplacé par la valeur de etc.$x
  */
  creds?: string[]
  comment?: Uint8Array | null // commentaire écrit et crypté par U.
  ch?: string // challenge random de synchronisation initiale avec MDEvent
  lv?: number // lastView par U
}

/*
Document `Form` hébergé dans la DB spécifique de `svc / org`.
Sous-classes applicatives $Form_type par "type"
*/
export class $Form extends Document {
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

  creds: string[] = [] // liste des credentials permettant à un tiers d'agir quand il possède l'un de ceux-là: `[ docCl1/docPk1 ... ]`.
  comment?: Uint8Array | null = null // commentaire écrit et crypté par U.
  ch?: string = '' // challenge random de synchronisation initiale avec MDEvent
  lv?: number = 0 // lastView par U

  _aesU?: Uint8Array | null = null

  /* Traitement final: surchargé par type :Retourne un statut de validation,
  - 0 si OK, N > 10 selon la cause d'échec
  */
  async checkEtc () : Promise<number> { return 0 }
  async validate () : Promise<number> { return 0 }

  static lp1 = ['svc', 'org', 'formId', 'type', 'userId', 'v', 'maxLife', 'status', 'etcU', 'etcT', 'msgU', 'msgT' ]
  static lp2 = ['type', 'userId', 'v', 'maxLife', 'status', 'comment', 'lv' ]

  static new (obj) : $Form {
    const f = Registry.newD('$Form', obj)
    for (const p of $Form.lp1) f[p] = obj[p]
    return f
  }

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

  // Calcul this.creds depuis le template du type et les arguments $x dans etc
  setCreds () {
    const etc = this.status === 1 ? this.etcU : this.etcT
    const creds = []
    for(const c of this.ft.creds) {
      const i = c.indexOf('$')
      if (i !== -1) {
        const arg = c.substring(i, i + 1)
        const val = etc[arg] || ''
        creds.push(c.replace(arg, val))
      } else creds.push(c)
    }
    this.creds = creds
  }

  // vérifie si le user est habilité en tant que tiers
  async checkAuthTP () : Promise<boolean> {
    const sf = stores.safe
    const t = this.ft.creds
    if (t && t.length === 1 && t[0] === 'A')
      return await sf.adminForSvcOrg(this.svc, this.org)
    for (const c of this.creds) {
      const x = c.split('/')
      const cred = sf.getCredOn(this.svc, this.org, x[0], x[1])
      if (cred) return true
    }
    return false
  }

  static credsForTP (svc: string, org: string) : Set<Credential> {
    const creds: Set<Credential> = new Set()
    const sf = stores.safe
    for(const [,c] of sf.mySafeCreds.value)
      if (c.svc === svc && c.org === org &&
        (FormType.refClasses1.has(c.docCl) || FormType.refClasses$.has(c.docCl)))
        creds.add(c)
    return creds
  }

  static async get(svc: string, org: string, formId: string, type: string) : Promise<$Form> {
    const creds = $Form.credsForTP(svc, org)
    if (!creds.size) return null
    const op = new Operation('FormGet', svc, org)
    for(const cred of creds)
      await op.sign(cred.docCl, { pk: cred.docPk })
    op.args.formId = formId
    op.args.type = type
    const res = await op.post()
    const obj = res.form
    if (!obj) return null
    obj.svc = svc
    obj.org = org
    const f = $Form.new(obj)
    await f.decryptMsgU()
    return f
  }

  /* Retourne une liste de $Form pour un utilisateur tiers
  si f = ['A'] retourne les forms devant être traitées par un administrateur
  */
  static async filteredList (svc: string, org: string, asAdmin: boolean) : Promise<$Form[]> {    
    let filter: string[]
    const sf = stores.safe
    if (asAdmin) {
      if (!await sf.adminForSvcOrg(svc, org)) return []
      filter = ['A']
    } else {
      const fi: Set<string> = new Set()
      for(const [,c] of sf.mySafeCreds.value) {
        if (c.svc !== svc || c.org !== org) continue
        if (c.docId === '1') {
          if (FormType.refClasses1.has(c.docCl)) fi.add(c.docCl + '/1')
        } else {
          if (FormType.refClasses$.has(c.docCl)) fi.add(c.docCl + '/' + c.docId)
        }
      }
      if (fi.size === 0) return []
      filter = Array.from(fi)
    }
    const op = new Operation('FormFilteredList', svc, org)
    op.args.filter = filter
    const res = await op.post()
    const lst = res.forms as $FormObj[]
    if (!lst || !lst.length) return []
    const lf: $Form[] = []
    for(const obj of lst) {
      obj.svc = svc
      obj.org = org
      const f = $Form.new(obj)
      await f.decryptMsgU()
    }
    return lf
  }

}
Registry.registerD($Form)