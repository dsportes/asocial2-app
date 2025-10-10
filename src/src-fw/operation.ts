// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import stores from '../stores/all'
import { onmsg } from './wputil'

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

  async post (args: any) : Promise<any>{
    const org = args.org
    const config = stores.config
    const session = stores.session
    session.opStart(this)
    const u = config.K.urlsrv + (config.K.urlsrv.endsWith('/') ? '' : '/')
    args.APIVERSION = config.K.APIVERSION
    const body = new Uint8Array(encode(args || {}))
    this.controller = new AbortController()
    this.aborted = false
    try {
      const response = await fetch(u + 'op/' + this.opName, {
        method: 'POST',
        headers:{'Content-Type': 'application/octet-stream' },
        signal: this.controller.signal,
        body
      })
      this.controller = null
      if (response.status === 200) {
        // @ts-ignore
        const buf = await response.bytes()
        const x = decode(buf)
        session.opEnd()
        const msg = x['notification']
        if (msg) {
          console.log('Notification received on operation return')
          await onmsg(x) // traitement des notifications sur retour d'opération
        }
        return x
      }
      const serial = await response.bytes()
      if (response.status === 400 || response.status === 401) {
        // 400: AppExc
        // 401: AppExc inattendue
        const obj = decode(serial)
        throw new AppExc(obj)
      }
      // autres status: 500...
      const txt = new TextDecoder().decode(serial)
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
