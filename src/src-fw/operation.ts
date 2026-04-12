// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import { AuthRecord } from './credsafe'
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
  // Map - clé: SVC - valeur Map de clé $OP donnat l'URL
  static services : Map<string, Map<string, string>> = new Map()

  static async loadServices () {
    const os = Operation.services
    const lsvc = Array.from(Object.keys(stores.config.K.SERVICES))
    lsvc.push('SAFE')
    const safeop = new SafeOperation('$GetSvcUrls', '')
    safeop.args = { lsvc }
    const res = await safeop.post()
    const urls = res.urls
    if (urls) for(const svc in urls) {
      let e = os.get(svc)
      if (!e) { e = new Map(); os.set(svc, e) }
      const ops = urls[svc]
      for (const op in ops) e.set(op, ops[op])
    }
  }

  // Map - clé: org - valeur Map de clé SVC donnant £OP
  static orgs : Map<string, Map<string, string>> = new Map()

  static async loadOrg (org: string) : Promise<Map<string, string>> {
    const safeop = new SafeOperation('$GetOrgSvcs', '')
    safeop.args = { org }
    const res = await safeop.post()
    const svcs = res.svcs
    const e : Map<string, string> = new Map()
    Operation.orgs.set(org, e)
    if (svcs) for (const svc in svcs) e.set(svc, svcs[svc])
    return e
  }

  static urlOfSvcOp = (svc: string, op: string) : string => {
    const x = Operation.services.get(svc)
    return !x ? '' : (x.get(op) || '')
  }

  /*
  // Map - clé: 'SVC/$OP', valeur: url]
  static svcOpUrl: Map<string, string> = new Map()

  // Map - clé: 'SVC/org', valeur: [url, opérateur]
  static svcOrgUrl: Map<string, [string, string]> = new Map()
  */

  opName: string
  url: string = ''
  controller: AbortController | null = null
  aborted: boolean = false
  background: boolean

  args: OpArgs | any
  authRecord: AuthRecord
  SVC: string

  async $GetSvcOpUrl () : Promise<string> {
    if (!this.args.$OP || !this.SVC) return ''
    const os = Operation.services
    if (!Operation.services.size) await Operation.loadServices()
    const e = os.get(this.SVC)
    return !e ? '' : (e.get(this.args.$OP) || '')
  }

  async $GetSvcOrgUrl () : Promise<string> {
    if (!this.args.org || !this.SVC) return ''
    let e = Operation.orgs.get(this.args.org)
    if (!e) e = await Operation.loadOrg(this.args.org)
    const op = e.get(this.SVC)
    return !op ? '' : Operation.urlOfSvcOp(this.SVC, op)
  }

  /*
  async $GetSvcOpUrl2 () : Promise<string | null> {
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

  async $GetSvcOrgUrl2 () : Promise<string> {
    const sf = stores.safe
    let uo = Operation.svcOrgUrl.get(this.SVC + '/' + this.args.org)
    if (uo) return uo[0]
    const safeop = new SafeOperation('$GetSvcOrgUrl', sf.mySafeStore)
    safeop.args = { SVC: this.SVC, org: this.args.org }
    const res = await safeop.post()
    if (res.urlOp[0]) Operation.svcOrgUrl.set(this.SVC + '/' + this.args.org, res.urlOp)
    return res.urlOp[0]
  }
  */

  constructor (opName: string, SVC: string, org?: string, $OP?: string, background?: boolean) {
    this.opName = opName
    this.args = {}
    if (org) this.args.org = org
    else if ($OP) this.args.$OP = $OP
    this.background = background || false
    this.SVC = SVC
    if (this.SVC !== 'SAFE' && !stores.config.K.SERVICES[this.SVC])
      throw new AppExc({code: 1009, label: 'svc unknown for application', opName: this.opName, args: [this.SVC] })
    this.authRecord = new AuthRecord()
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async getBaseUrl () : Promise<string> {
    if (this.args.$OP) {
      const u = this.args.$OP === 'MASTERDIR' ? stores.config.K.MASTERDIR_URL :
        await this.$GetSvcOpUrl()
      if (u) return u
      throw new AppExc({code: 1007, label: 'svcopurl not found', opName: this.opName, args: [this.SVC, this.args.$OP] })
    }
    if (!this.args.org)
      throw new AppExc({code: 2001, label: 'missing org and $OP', opName: this.opName })
    const u = await this.$GetSvcOrgUrl()
    if (u) return u
    throw new AppExc({code: 1008, label: 'svcorgurl not found', opName: this.opName, args: [this.args.org, this.SVC] })
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
      let u = await this.getBaseUrl()
      if (!u.endsWith('/')) u += '/'
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
    } catch (e: any) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc({ code: 10000, label: 'Interrupted', opName: this.opName})
      throw new AppExc({ code:11002, label: 'Unexpected network/server/response',
        args:[(this.url || '?'), e.toString()]})
    }
  }

  async ko (e: any) {
    if (this.background) e.background = true
    await stores.ui.displayExc(e)
  }
}

/* Les SafeOperation n'ont pas de AuthRecord"
Le service Safe vérifie les authentifications par les paramètres
comme hp0, hr0, etc.
*/
export class SafeOperation extends Operation {
  safeStore: string = ''

  constructor (opName: string, safeStore: string) {
    super(opName, 'SAFE', '', safeStore || 'MASTERDIR')
    this.safeStore = safeStore
  }

  async post () : Promise<any>{
    const K = stores.config.K
    const u = this.safeStore ? Operation.urlOfSvcOp('SAFE', this.safeStore) : K.MASTERDIR_URL
    if (!u)
      throw new AppExc({code: 1010, label: 'SAFE operator not found', opName: this.opName, args: [this.safeStore] })
    this.url = u + this.opName

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
    } catch (e: any) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc({ code: 10000, label: 'Interrupted', opName: this.opName})
      throw new AppExc({ code:11002, label: 'Unexpected network/server/response',
        args:[(this.url || '?'), e.toString()]})
    }
  }
}

