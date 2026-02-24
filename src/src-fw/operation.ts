// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import stores from '../stores/all'
import { onPushMsg } from '../../src-pwa/register-service-worker'

export type AuthRecord = {
  orguserId: string
  sessionId: string
  time: number
  tokens: []
}

const svcOpUrl: Map<string, string> = new Map()
const svcOrgUrl: Map<string, [string, string]> = new Map()

export async function $GetSvcOpUrl (opName: string, SVC: string, $OP: string )
: Promise<string> {
  if (!stores.config.K.SERVICES[SVC])
    throw new AppExc({code: 1009, label: 'svc unknown for application', opName, args: [SVC] })
  const sf = stores.safe
  let u = svcOpUrl.get(SVC + '/' + $OP)
  if (u) return u
  const safeop = new SafeOperation('$GetSvcOpUrl', sf.mySafeStore)
  try {
    const res = await safeop.post({ SVC, $OP })
    if (!res.url)
      throw new AppExc({code: 1007, label: 'svcopurl not found', opName, args: [SVC, $OP] })
    svcOpUrl.set(SVC + '/' + $OP, res.url)
    return res.url
  } catch (e) {
    this.ko(e)
    return ''
  }
}

export async function $GetSvcOrgUrl (opName: string, SVC: string, org: string )
: Promise<[string, string]> {
  if (!stores.config.K.SERVICES[SVC])
    throw new AppExc({code: 1009, label: 'svc unknown for application', opName, args: [SVC] })
  const sf = stores.safe
  let uo = svcOrgUrl.get(SVC + '/' + org)
  if (uo) return uo
  const safeop = new SafeOperation('$GetSvcOrgUrl', sf.mySafeStore)
  try {
    const res = await safeop.post({ SVC, org })
    if (!res.url)
      throw new AppExc({code: 1008, label: 'svcorgurl not found', opName, args: [org, SVC] })
    svcOrgUrl.set(SVC + '/' + org, [res.url, res.$OP])
    return [res.url, res.$OP]
  } catch (e) {
    this.ko(e)
    throw(e)
  }
}

/* Opération générique ******************************************/
export class Operation {
  opName: string
  controller: AbortController
  aborted: boolean
  background: boolean
  $OP: string
  org: string
  SVC: string
  url: string

  constructor (opName: string, SVC?: string, background?: boolean) {
    this.opName = opName
    this.background = background || false
    this.SVC = SVC || stores.config.K.DEFAULT_SERVICE
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async post (args: any) : Promise<any> {
    const config = stores.config
    const session = stores.session
    this.org = args.org
    this.$OP = args.$OP
    try {
      session.opStart(this)
      let u: string
      if (this.$OP) u = await $GetSvcOpUrl(this.opName, this.SVC, this.$OP)
      else {
        const x = await $GetSvcOrgUrl(this.opName, this.SVC, this.org)
        u = x[0]
        this.$OP = x[1]
      }
      this.url = u + 'op/' + (this.$OP || this.org) + '/' + this.opName
      args.APIVERSION = config.K.SERVICES[this.SVC].api
      const body = new Uint8Array(encode(args))

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

export class SafeOperation extends Operation {
  static urlx: string

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
    } else this.url = K.SAFE_URL + opName
  }

  /* Declare que désormais le repository des safes
  est un site Web disposant d'un script PHP 'safe.php'
  si url est vide, retour au repository par défaut (standard)
  */
  /*static setSafeUrl (url: string) {
    SafeOperation.urlx = url + '/safe.php?'
  }
  */

  async post (args: any) : Promise<any>{
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
        body: new Uint8Array(encode(args || {}))
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

