// @ts-ignore
import { decode } from '@msgpack/msgpack'
import { Crypt } from '../src-fw/crypt'
import { DocRegistry } from '../src-fw/docregistry'
import { keyToB64, keyFromB64 } from '../src-fw/b64'
import stores from '../stores/all'
import { $t, dhcool } from '../src-fw/util'

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
export class CredSafeA {
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
      for (const p of CredSafeA.lp1) this[p] = obj[p] || null
    if (!this.credId) this.credId = Crypt.rnd(15)
  }

  get toObj () : Object {
    const obj = {}
    for (const p of CredSafeA.lp1) obj[p] = this[p] || null
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

class CredTopic extends CredSafeA {
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

/********************************************************
 * Case "générique": des classes spécifiques "CaseTTT"
 * ont des méthodes particulières par topic TTT.
 */
export class Case {
  static lp1 = [ 'svc', 'org', 'userId', 'topicId', 'caseId', 'aboutU' ]

  svc: string = ''
  org: string = ''
  userId: string = ''
  topicId: string = ''
  caseId: string = '' // clé primaire dans ZZCASES `userId topicId caseId`.
  v: number = 0 // version du document dans la DB du service. Elle détermine aussi la limite de validité du cas.
  status: number = 0 // 0-annulé 1-actif-U 2-actif-H 3-finalisé
  aboutU: string = '' // texte crypté de commentaire pour le seul usage de l'utilisateur.
  lv: number = 0 // dernière version _lue_ par U. La comparaison avec `v` permet de savoir si U a eu connaissance de la dernière évolution produite par le service.

  // Propriétés obtenues du document correspondant
  subject?: string
  tab?: string // texte de l'ardoise décrypté par `X`
  etc?: Object // objet qui ne peut être écrit configuré que par une opération d'un _helper_ autorisé.

  async enrichFromDocCase (dc: DocCase, topicPubc: Uint8Array) {
    /* La clé _virtuelle_ `X` d'un _case_ est une clé symétrique qui est obtenue indifféremment,
    - depuis `[du, topicPubc]` dans une session de l'application:
      - `du` : clé privée de decryptage de U détenue par la session.
      - `topicPubc` : clé publique de cryptage du topic obtenu en session par la configuration des topics chargée en début de session.
    */
    this.subject = dc.subject
    this.etc = dc.etc
    this.v = dc.v // pertinence ?
    this.status = dc.status // pertinence ?
    if (!dc.tabX) this.tab = ''
    else {
      const du = keyFromB64(stores.safe.auth.D)
      const aes = await Crypt.getAESKey(topicPubc, du)
      // @ts-expect-error
      this.tab = decoder.decode(await Crypt.decrypt(aes, dc.tabX))
    }
  }
}

// "Document" Case obtenu du service pour cette organisation
export type DocCase = {
  topicId: string
  subject: string
  caseId: string // clé primaire du document `topicId subject caseId`.
  userId: string // Index en DB
  v: number // version du document dans la DB du service. Elle détermine aussi la limite de validité du cas.
  status: number // 0-annulé 1-actif-U 2-actif-H 3-finalisé
  tabX: Uint8Array | null // texte de l'ardoise crypté par `X` (en base 64).
  etc: Object // objet qui ne peut être écrit configuré que par une opération d'un _helper_ autorisé.

}
