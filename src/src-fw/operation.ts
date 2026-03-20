// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import { AuthRecord } from './credential'
import stores from '../stores/all'
import { onPushMsg } from '../../src-pwa/register-service-worker'

export type OpArgs = {
  org?: string
  $OP?: string
  SVC?: string
  APIVERSION?: string
  authRecord?: Object
}

/* Opération générique ******************************************/
export class Operation {
  static svcOpUrl: Map<string, string> = new Map()
  static svcOrgUrl: Map<string, [string, string]> = new Map()

  opName: string
  args: OpArgs | any
  controller: AbortController
  aborted: boolean
  background: boolean
  authRecord: AuthRecord
  $OP: string
  org: string
  SVC: string
  url: string

  async $GetSvcOpUrl () : Promise<string> {
    const sf = stores.safe
    let u = Operation.svcOpUrl.get(this.SVC + '/' + this.args.$OP)
    if (u) return u
    const safeop = new SafeOperation('$GetSvcOpUrl', sf.mySafeStore)
    safeop.args = { SVC: this.SVC, $OP: this.args.$OP }
    const res = await safeop.post()
    if (!res.url) return null
    Operation.svcOpUrl.set(this.SVC + '/' + this.args.$OP, res.url)
    return res.url
  }

  async $GetSvcOrgUrl () : Promise<[string, string]> {
    const sf = stores.safe
    let uo = Operation.svcOrgUrl.get(this.SVC + '/' + this.args.org)
    if (uo) return uo
    const safeop = new SafeOperation('$GetSvcOrgUrl', sf.mySafeStore)
    safeop.args = { SVC: this.SVC, org: this.args.org }
    const res = await safeop.post()
    if (res.urlOp[0]) Operation.svcOrgUrl.set(this.SVC + '/' + this.args.org, res.urlOp)
    return res.urlOp
  }

  constructor (opName: string, SVC?: string, org?: string, $OP?: string, background?: boolean) {
    this.opName = opName
    this.args = {}
    if (org) this.args.org = org
    else if ($OP) this.args.$OP = $OP
    this.background = background || false
    this.SVC = SVC || stores.config.K.DEFAULT_SERVICE
    if (!stores.config.K.SERVICES[this.SVC])
      throw new AppExc({code: 1009, label: 'svc unknown for application', opName: this.opName, args: [this.SVC] })
    this.authRecord = new AuthRecord()
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async getBaseUrl () : Promise<string> {
    let u: string
    if (this.args.$OP) {
      u = await this.$GetSvcOpUrl()
      if (!u)
        throw new AppExc({code: 1007, label: 'svcopurl not found', opName: this.opName, args: [this.SVC, this.args.$OP] })
    } else {
      if (!this.args.org)
        throw new AppExc({code: 2001, label: 'missing org and $OP', opName: this.opName })
      const [u1, op] = await this.$GetSvcOrgUrl()
      if (!u1)
        throw new AppExc({code: 1008, label: 'svcorgurl not found', opName: this.opName, args: [this.args.org, this.SVC] })
      u = u1
      this.$OP = op
    }
    return u
  }

  /* Ajoute au AuthRecord une signature pour ce role / docId */
  async sign (role: string, docId?: string) {
    await this.authRecord.sign(this.SVC, this.args.org, role, docId || '')
  }

  /* Si noAuth est true, l'opération N'INCLUE PAS de AuthRecord
  elle est "publique" sans authentification.
  */
  async post (noAuth?: boolean) : Promise<any> {
    const config = stores.config
    const session = stores.session
    try {
      session.opStart(this)
      const u = await this.getBaseUrl()
      this.url = u + 'op/' + (this.args.$OP || this.args.org) + '/' + this.opName
      this.args.APIVERSION = config.K.SERVICES[this.SVC].api
      if (!noAuth) 
        await this.authRecord.signUser()
      this.args.authRecord = this.authRecord.toObj
      const body = new Uint8Array(encode(this.args))

      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',  // sent request
          'Accept':       'application/octet-stream'   // expected data sent back
        },
        signal: this.controller.signal,
        body,
      })
      this.controller = null
      const buf = await response.bytes()
      const obj = new decode(buf)
      if (response.status === 200) {
        session.opEnd()
        const ntf = obj['notification']
        if (ntf) {
          if (config.mondebug) console.log('Notification received on operation return')
          await onPushMsg(ntf) // traitement des notifications sur retour d'opération
        }
        return obj
      }
      if (response.status === 400 || response.status === 401) // 400: AppExc - 401: AppExc inattendue
        throw new AppExc(obj)
      // autres status: 500...
      const txt = new TextDecoder().decode(buf)
      throw new AppExc({ code:11001, label: 'Unexpected from server',
        args:[response.status, (u || '?'), txt]})
    } catch (e) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc({ code: 10000, label: 'Interrupted', opName: this.opName})
      throw new AppExc({ code:11002, label: 'Unexpected network/server/response',
        args:[(this.url || '?'), e.toString()]})
    }
  }

  async ko (e: AppExc) {
    await stores.ui.displayExc(e, this.background)
  }
}

/* Les SafeOperation n'ont pas de AuthRecord"
Le service Safe vérifie les authentifications par les paramètres
comme hp0, hr0, etc.
*/
export class SafeOperation extends Operation {

  constructor (opName: string, safeStore: string) {
    const K = stores.config.K
    super(opName)
    if (safeStore) {
      let x = K.SAFE_URLS[safeStore]
      if (!x) {
        x = safeStore
        if (!x.startsWith('http')) x = 'HTTPS://' + x
        if (!x.endsWith('.php?')) x += '/safe.php?'
      }
      this.url = x + opName
    } else this.url = K.MASTERDIR_URL + opName
  }

  async post () : Promise<any>{
    const config = stores.config
    const session = stores.session
    try {
      session.opStart(this)
      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',  // sent request
          'Accept':       'application/octet-stream'   // expected data sent back
        },
        signal: this.controller.signal,
        body: new Uint8Array(encode(this.args || {}))
      })
      this.controller = null
      const buf = await response.bytes()
      const obj = decode(buf)
      if (response.status === 200) {
        session.opEnd()
        return obj
      }
      if (response.status === 400 || response.status === 401) // 400: AppExc - 401: AppExc inattendue
        throw new AppExc(obj)
      // autres status: 500...
      const txt = new TextDecoder().decode(buf)
      throw new AppExc({ code:11001, label: 'Unexpected from server',
        args:[response.status, (this.url || '?'), txt]})
    } catch (e) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc({ code: 10000, label: 'Interrupted', opName: this.opName})
      throw new AppExc({ code:11002, label: 'Unexpected network/server/response',
        args:[(this.url || '?'), e.toString()]})
    }
  }
}

