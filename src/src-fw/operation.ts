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

class AOperation {
  // Map - clé: SVC - valeur Map de clé $OP donnat l'URL
  static services : Map<string, Map<string, string>> = new Map()

  static async loadServices () {
    const os = AOperation.services
    const op = new MDOperation('$GetSvcUrls')
    op.args.lsvc = Array.from(Object.keys(stores.config.K.SERVICES))
    const res = await op.post()
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
    const safeop = new MDOperation('$GetOrgSvcs')
    safeop.args.org = org
    const res = await safeop.post()
    const svcs = res.svcs
    const e : Map<string, string> = new Map()
    Operation.orgs.set(org, e)
    if (svcs) for (const svc in svcs) e.set(svc, svcs[svc])
    return e
  }

  opName: string
  url: string = ''
  controller: AbortController | null = null
  aborted: boolean = false
  background: boolean = false
  args: OpArgs | any = {}

  constructor (opName: string) {
    this.opName = opName
  }

  urlOfSvcOp = async (svc: string, op: string) : Promise<string> => {
    const os = AOperation.services
    if (os.size === 0) await AOperation.loadServices()
    const x = os.get(svc)
    return !x ? '' : (x.get(op) || '')
  }

  async ko (e: any) {
    if (this.background) e.background = true
    await stores.ui.displayExc(e)
  }
}

/* Opération générique ******************************************/
export class Operation extends AOperation {

  authRecord: AuthRecord
  SVC: string

  async GetSvcOrgUrl () : Promise<string> {
    let e = AOperation.orgs.get(this.args.org)
    if (!e) e = await AOperation.loadOrg(this.args.org)
    const $OP = e ? e.get(this.SVC) : ''
    return !$OP ? '' : await this.urlOfSvcOp(this.SVC, $OP)
  }

  constructor (opName: string, SVC: string, org?: string, $OP?: string, background?: boolean) {
    super(opName)
    if (!SVC || (!org && !$OP))
      throw new AppExc({code: 1007, label: 'svc / org / $OP not found', opName: this.opName, args: [] })

    if (org) this.args.org = org
    else if ($OP) this.args.$OP = $OP
    this.background = background || false
    this.SVC = SVC
    this.authRecord = new AuthRecord()
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async getBaseUrl () : Promise<string> {
    if (this.args.$OP) {
      const u = await this.urlOfSvcOp(this.SVC, this.args.$OP)
      if (u) return u
      throw new AppExc({code: 1011, label: 'svcopurl not found', opName: this.opName, args: [this.SVC, this.args.$OP] })
    } else {
      let e = AOperation.orgs.get(this.args.org)
      if (!e) e = await AOperation.loadOrg(this.args.org)
      const $OP = e ? e.get(this.SVC) : ''
      const u = !$OP ? '' : await this.urlOfSvcOp(this.SVC, $OP)
      if (u) return u
      throw new AppExc({code: 1008, label: 'svcorgurl not found', opName: this.opName, args: [this.args.org, this.SVC] })
    }
  }

  /* Ajoute au AuthRecord une signature pour ce role / docId */
  async sign (role: string, docId?: string) {
    await this.authRecord.sign(this.SVC, this.args.org, role, docId || '')
  }

  /* Si noAuth est true, l'opération N'INCLUE PAS 
  la signature du user dans AuthRecord.
  */
  async post (noAuth?: boolean) : Promise<any> {
    const config = stores.config
    const session = stores.session
    try {

      let u = await this.getBaseUrl()
      if (!u.endsWith('/')) u += '/'
      this.url = u + 'op/' + (this.args.$OP || this.args.org) + '/' + this.opName
      this.args.APIVERSION = config.K.SERVICES[this.SVC].api

      session.opStart(this)
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

}

abstract class A2Operation extends AOperation {
  safeStore: string = ''

  urlSafeStore = async () : Promise<string> => {
    const os = AOperation.services
    if (os.size === 0) await AOperation.loadServices()
    const x = os.get('SAFE')
    const u = x?.get(this.safeStore)
    if (!u)
      throw new AppExc({code: 1012, label: 'safeStore url not found', opName: this.opName, args: [this.safeStore] })
    return u
  }

  constructor (opName: string) {
    super(opName)
  }

  async post () : Promise<any>{
    const session = stores.session
    try {
      session.opStart(this)
      if (!this.url) 
        this.url = await this.urlSafeStore()
      this.url += this.opName
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

/* Les SafeOperation n'ont pas de AuthRecord"
Le service Safe vérifie les authentifications par les paramètres
comme hp0, hr0, etc.
*/
export class SafeOperation extends A2Operation {

  constructor (opName: string, safeStore: string) {
    super(opName)
    if (!safeStore) this.url = stores.config.K.STDSAFE_URL
    else this.safeStore = safeStore
  }

}

export class MDOperation extends A2Operation {

  constructor (opName: string) {
    super(opName)
    this.url = stores.config.K.MASTERDIR_URL
  }

}
