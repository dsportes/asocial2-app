// @ts-ignore
import { decode } from '@msgpack/msgpack'
import { Crypt } from '../src-fw/crypt'
import { Registry } from './registry'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import stores from '../stores/all'
import { $t, dhcool, hasMessage } from '../src-fw/util'
import { MDOperation, Operation } from '../src-fw/operation'

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

/* Credential en Safe, possiblemernt enrichi 
par les propriétés du record 'cred' du document maître
*/
export class CredSafe {
  static lp1 = [ 'credId', 'svc', 'org', 'docCl', 'docId', 'privs', 'privd', 'name' ]

  credId: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  docCl: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  privs: string = '' // clé PRIVEE de signature en base64.
  privd: string = '' // clé PRIVEE de decryptage en base64.
  name: string = '' // "nom" associé au docId.
  
  // Décoration après fusion avec Cred
  limit?: number
  docKey?: Uint8Array | null
  opaque?: any | null
  more?: any | null
  alert?: number // 0:safe et db,  1:safe pas db, 2: limit dépassée

  constructor (obj?: Object) {
    if (obj)
      for (const p of CredSafe.lp1) this[p] = obj[p] || null
    if (!this.credId) this.credId = Crypt.rnd(15)
  }

  get toObj () : Object {
    const obj = {}
    for (const p of CredSafe.lp1) obj[p] = this[p] || null
    return obj
  }

  async enrichFromCred (cred: Cred) {
    this.docKey = null
    this.opaque = null
    if (cred.docKey) try {
        this.docKey = await Crypt.decrypt(stores.safe.keyK, cred.docKey)
        if (cred.opaque) try {
          // @ts-expect-error
          const x = await Crypt.decrypt(this.docKey, cred.opaque)
          this.opaque = decode(x)
        } catch (e) {
          console.log(e)
        }
      } catch (e) {
        console.log(e)
      }
    this.limit = cred.limit
    this.more = cred.more || null
  }

  get toJson () : string { return JSON.stringify(this.toObj, null, '\t') }

  async dispMore () { 
    const ui = stores.ui
    await ui.diagDisplay($t('CRRmore', [JSON.stringify(this.more, null, '\t')]))
  }

  async dispLimit () { 
    const ui = stores.ui
    const dh = dhcool((this.limit || 0) * 1000)
    await ui.diagDisplay($t('CRRlimit', [dh]))
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
Registry.registerD(CredSafe)

class Cred_Topic extends CredSafe {
  constructor (obj?: Object) {
    super(obj)
  }

  /* more: propriété `subjects`:
    - absent: le topic n'a pas de sujets.
    - `"a b c "`. Valeurs séparées par un espace.
    - `"@sujet35"` : ID du _singleton_ (du service) portant cette liste.
    - `"$sujet35"` : ID du _Property_ (de l'organisation) portant cette liste.
    - `"DocCl/alias"` : nom de classe des documents dont `alias` est la propriété définissant un code externe.
  */
  async dispMore () {
    const ui = stores.ui
    const s = this.more.subjects
    if (!s)
      await ui.diagDisplay($t('CRRtopic1'))
    else if (s.startsWith('@'))
      await ui.diagDisplay($t('CRRtopic3', [s.substring(1)]))
    else if (s.startsWith('$'))
      await ui.diagDisplay($t('CRRtopic4', [s.substring(1)]))
    else {
      const i = s.indexOf('/')
      if (i === -1)
        await ui.diagDisplay($t('CRRtopic2', [s]))
      else
        await ui.diagDisplay($t('CRRtopic5', [s.substring(i + 1), s.substring(0, i)]))
    }
  }
}
Registry.registerD(Cred_Topic)

export type CaseData = {
  chk: string // SHA raccourci des données immuables `caseId, userId topicId subject svc org`. Permet de vérifier que la demande vient bien d'un détenteur légitime (session ou opération).
  svc: string //
  org: string // service détenteur de l'ardoise.
  topicId: string // topic du _cas_.
  subject: string // sujet du cas si requis.
  status: number // 0 1 2 3
  aboutU: Uint8Array | null // texte crypté de commentaire pour le seul usage de l'utilisateur.
  lv: number // dernière version _lue_ par U. La comparaison avec `v` permet de savoir si U a eu connaissance de la dernière évolution produite par le service.

  caseId?: string
  v?: number
}

export type CaseMin = {
  svc: string, 
  org: string, 
  topicId: string, 
  subject: string, 
  userId?: string
}

export type MsgVal = {
  ok: boolean
  txt: string // texte de l'erreur
  docCl: string
  docId: string
}

/********************************************************
 * Case "générique": des classes spécifiques "Case_TTT"
 * ont des méthodes particulières par topic TTT.
 */
export class Case {

  svc: string = ''
  org: string = ''
  userId: string = ''
  topicId: string = ''
  caseId: string = '' // clé primaire dans ZZCASES `userId topicId caseId`.
  v: number = 0 // version du document dans la DB du service. Elle détermine aussi la limite de validité du cas.
  status: number = 0 // 0-annulé 1-actif-U 2-actif-S 3-finalisé
  lv: number = 0 // dernière version _lue_ par U. La comparaison avec `v` permet de savoir si U a eu connaissance de la dernière évolution produite par le service.

  // Propriétés obtenues du document correspondant
  subject?: string
  tab?: string // texte de l'ardoise décrypté par `X`
  about?: string = '' // texte de commentaire pour le seul usage de l'utilisateur.
  etc?: Object // objet qui ne peut être écrit configuré que par une opération d'un _helper_ autorisé.

  static async newFromMD (cd: CaseData) {
    const sf = stores.safe
    const obj = { svc: cd.svc, org: cd.org, topicId: cd.topicId, subject: cd.subject}
    const c = Registry.newCase(obj)
    c.caseId = cd.caseId || ''
    c.status = cd.status
    c.v = cd.v || 0
    c.lv = cd.lv
    // @ts-expect-error
    c.about = cd.aboutU ? decoder.decode(await Crypt.decrypt(sf.keyK, cd.aboutU)) : ''
    return c
  }

  constructor (obj: CaseMin) {
    this.svc = obj.svc; this.org = obj.org; this.topicId = obj.topicId; this.subject = obj.subject || ''
    this.userId = obj.userId || stores.safe.userId
  }

  get byU () : boolean { return this.status !== 2 }

  get subjectEd () : string {
    return hasMessage('SUBJECT_' + this.topicId + '_' + this.subject) || this.subject || ''
  }

  chk () { 
    return Crypt.shaS([this.caseId, this.userId, this.topicId, this.subject, this.svc, this.org].join('/'))
  }

  // Méthodes surchargées pour chaque topic ******************************************
  /* Retourne un "état" MD affichable du etc */
  editEtc () : string { return '' }

  /* Retourne un message d'erreur disant pourquoi le "sponsor"
  ne peut pas intervenir sur l'invitation.
  Logique applicative choisie ici:
  - un "manager" est toujours un sponsor valide.
  - un utilisateur qui a un credential Sponsor pour le "major" de l'invitation
    est un sponsor valide (quelque soit le "minor").
  - un utilisateur qui a un credential Sponsor pour le "major.minor" de l'invitation
    est un sponsor valide (à condition bien sur que l'invitation ait un minor).
  */
  msgVal () : MsgVal {
    return { ok: false, txt: 'KO', docCl: '', docId: ''}
  }

  /* validation du case. Retourne: 
  - 0 : si OK
  - -1 : en cas d'exception de l'opération
  - 1..99 : status SFST d'une erreur retournée par une opération
  */
  async validate (args: any) : Promise<number> {
    return 0
  }
  
  /* export type TopicDef = {
    id: string
    categ: string
    key: string
    subjects: string
    pubC: Uint8Array
  }
  */
  async encryptTab (tab: string) : Promise<Uint8Array | null> {
    if (!tab) return null
    const sf = stores.safe
    const svc = stores.service
    const td = svc.getTopic(this.svc, this.topicId)
    const aes = await Crypt.getAESKey( td.pubC, keyFromB64(sf.auth.D))
    return await Crypt.crypt(aes, encoder.encode(tab))
  }

  async decryptTab (tabX: Uint8Array | null) : Promise<string> {
    if (!tabX) return ''
    const sf = stores.safe
    const svc = stores.service
    const td = svc.getTopic(this.svc, this.topicId)
    const aes = await Crypt.getAESKey(td.pubC, keyFromB64(sf.auth.D))
    // @ts-expect-error
    return decoder.decode(await Crypt.decrypt(aes, tabX))
  }

  async createByU (tab: string, about: string) : Promise<boolean> {
    const sf = stores.safe
    const ui = stores.ui
    const now = Date.now()
    this.caseId = Crypt.rnd(15)
    this.tab = tab
    this.about = about
    this.status = 1
    this.lv = 0
    this.v = Date.now()
    this.etc = {}
    const aboutU = about ? await Crypt.crypt(sf.keyK, encoder.encode(about)) : null

    const caseObj = { // pour le _document_
      caseId: this.caseId,
      userId: this.userId,
      topicId: this.topicId,
      subject: this.subject,
      tabX: await this.encryptTab(tab),
    }

    const caseData: CaseData = {
      caseId: this.caseId,
      svc: this.svc,
      org: this.org,
      topicId: this.topicId,
      subject: this.subject || '',
      status: this.status,
      lv: now,
      aboutU,
      chk: this.chk()
    }

    const mdop = new MDOperation('$mdCaseNew')
    mdop.args['caseId'] = this.caseId
    mdop.args['userId'] = this.userId
    mdop.args['v'] = now
    mdop.args['caseData'] = caseData
    try {
      await mdop.post()
      const op = new Operation('CaseCreateByU', this.svc, this.org)
      op.args['caseObj'] = caseObj
      try {
        const res = await op.post()
        if (res.status !== 0) {
          await ui.diagDisplay($t('CASST_' + res.status))
          return false
        }
        return true
      } catch (e: any) {
        op.ko(e)
        return false
      }
    } catch (e: any) {
      mdop.ko(e)
      return false
    }
  }
}

// "Document" Case obtenu du service pour cette organisation
export type DocCase = {
  caseId: string  // ID universel généré aléatoirement à la création.
  v: number  // version du document. Elle détermine aussi la limite de validité du document.
  userId: string // ID de l'utilisateur détenteur du cas. Depuis une opération du service la clé publique de cryptage `CU` est donc accessible.
  topicId: string // ID du topic auquel le cas se rapporte.
  subject: string // code (facultatif) désignant une cible plus précise permettant à un utilisateur _sponsor_ de se concentrer sur un sujet précis. 
  status: number // 0-annulé 1-actif-U 2-actif-H 3-finalisé.
  tabX: Uint8Array | null // texte de l'ardoise crypté par `X`
  etc: any  // objet qui ne peut être écrit configuré que par une opération d'un _sponsor_ autorisé.
  maxLife: number // epoch en MINUTES

  svc?: string
  org?: string
}
