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

/* Opération générique ******************************************/
export class Operation {
  opName: string
  controller: AbortController
  aborted: boolean
  background: boolean

  constructor (opName: string, background?: boolean) {
    this.opName = opName
    this.background = background || false
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async post (args: any, service?: string) : Promise<any> {
    const config = stores.config
    const session = stores.session
    const svc = service || config.K.DEFAULT_SERVICE
    const urlapi = config.K.SERVICES[svc]
    if (!urlapi)
      throw new AppExc({ code:11002, label: 'Unknown service', args:[this.opName, svc]})
    const u = urlapi.url + 'op/' + (args.org || 'ADMIN') + '/' + this.opName
    try {
      session.opStart(this)
      args.APIVERSION = urlapi.api
      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(u, {
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
        args:[(u || '?'), e.toString()]})
    }
  }

  async ko (e: AppExc) {
    await stores.ui.displayExc(e, this.background)
  }
}

export class SafeOperation extends Operation {
  static urlx: string

  constructor (opName: string) {
    super(opName)
  }

  /* Declare que désormais le repository des safes
  est un site Web disposant d'un script PHP 'safe.php'
  si url est vide, retour au repository par défaut (standard)
  */
  /*static setSafeUrl (url: string) {
    SafeOperation.urlx = url + '/safe.php?'
  }
  */

  async post (args: any, safe: string) : Promise<any>{
    const config = stores.config
    const session = stores.session
    let u = config.K.SAFE_URL
    if (safe) {
      let x = config.K.SAFE_URLS[safe]
      if (x) u = x
      else {
        x = safe
        if (!x.startsWith('http')) x = 'HTTPS://' + x
        if (!x.endsWith('.php?')) x += '/safe.php?'
        u = x
      }
    }
    try {
      session.opStart(this)
      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(u + this.opName, {
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
        args:[response.status, (u || '?'), txt]})
    } catch (e) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc({ code: 10000, label: 'Interrupted', opName: this.opName})
      throw new AppExc({ code:11002, label: 'Unexpected network/server/response',
        args:[(u || '?'), e.toString()]})
    }
  }
}

