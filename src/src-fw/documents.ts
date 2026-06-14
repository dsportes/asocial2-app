// @ts-ignore
import { encode } from '@msgpack/msgpack'
import { Crypt } from '../src-fw/crypt'
import { Registry } from './registry'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import stores from '../stores/all'
import { TopicDef } from '../stores/service-store'
import { $t, dhcool, hasMessage } from '../src-fw/util'
import { MDOperation, Operation } from '../src-fw/operation'
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

  /* Traitement final: surchargé par type :Retourne un statut de validation,
  - 0 si OK, N > 10 selon la cause d'échec
  */
  async checkEtc () : Promise<number> { return 0 }
  async validate () : Promise<number> { return 0 }

  static lp1 = ['formId', 'type', 'userId', 'v', 'maxLife', 'status', 'etcU', 'etcT', 'msgU', 'msgT' ]
  static lp2 = ['type', 'userId', 'v', 'maxLife', 'status', 'comment', 'lv' ]

  constructor (obj?: $FormObj) {
    super()
    if (obj) for (const p of $Form.lp1) this[p] = obj[p]
    if (obj.comment) this.comment = obj.comment
    if (obj.creds) this.creds = obj.creds
    if (obj.ch) this.ch = obj.ch
    if (obj.lv) this.lv = obj.lv
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
  get kp () : { pub: Buffer, priv: Buffer } { 
    const x = config['DCkeys'][this.ft.key]
    return { pub: keyFromB64(x.pub), priv: keyFromB64(x.pub) }
  }
  async uPub (op: OperationWC) : Promise<Buffer> {
    const [c, v] = await MDOperation.getCV(op, this.userId)
    return keyFromB64(c)
  }

  /* Une opération de lecture du formulaire peut décrypter `msgU` en utilisant le couple, 
  de la clé _privée_ de décryptage du formulaire (accessible dans l'opération du service)
  et de la clé _publique_ de cryptage de U (également accessible puisque `userId` est l'ID de U). 
  */
  async decryptMsgU (op: OperationWC) : Promise<void> {
    if (!this.msgT) {
      const aes = await Crypt.getAESKey(await this.uPub(op), this.kp.priv)
      this.msgU = await Crypt.decrypt(aes, this.msgU)
    }
  }

  /* `msgT` est le texte écrit par T: il est envoyé en clair à l'opération d'enregistrement du formulaire ou il est crypté par le couple, 
  - de la clé _privée_ de décryptage du formulaire (accessible dans l'opération du service) 
  - et de la clé _publique_ de cryptage de U (également accessible puisque `userId` est l'ID de U).
  Une opération de lecture peut décrypter `msgT` en utilisant le couple, 
  - de la clé _privée_ de décryptage du formulaire (accessible dans l'opération du service)
  - et de la clé _publique_ de cryptage de U (également accessible puisque `userId` est l'ID de U).
  */
  async cryptMsgT (op: OperationWC) : Promise<void> {
    if (this.msgT) {
      const aes = await Crypt.getAESKey(await this.uPub(op), this.kp.priv)
      this.msgT = await Crypt.crypt(aes, this.msgT)
    }
  }

  async decryptMsgT (op: OperationWC) : Promise<void> {
    if (this.msgT) {
      const aes = await Crypt.getAESKey(await this.uPub(op), this.kp.priv)
      this.msgT = await Crypt.decrypt(aes, this.msgT as Uint8Array)
    }
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

  // vérifie si le tiers est habilité
  checkAuthTP (op: Operation) : boolean {
    const t = this.ft.creds
    if (t && t.length === 1 && t[0] === 'A') op.requireAuth()
    else for (const c of this.creds) {
      const x = c.split('/')
      const cred = op.getCred(x[0], x[1] || '1')
      if (cred) return true
    }
    return false
  }

  /* Retourne une liste de $Form pour un utilisateur tiers
  si f = ['A'] retourne les forms devant être traitées par un administrateur
  */
  static async filteredList (op: Operation, f: string[]) : Promise<$FormObj[]> {    
    const l: $FormObj[] = []
    await op.db.selectDocs('$Form', 'creds', filter.CONTAINSANY, f, '', 0, 
      async (bin) => {
      const obj = decode(bin) as $FormObj
      const f = Registry.newD('$Form', obj) as $Form
      if (!f.isOld) {
        await f.decryptMsgT(op)
        await f.decryptMsgU(op)
        l.push(f.toFormObj())
      }
    })
    return l
  }

}
Registry.registerD($Form)