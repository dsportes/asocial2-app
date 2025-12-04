// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import { getUrl } from './net'
import stores from '../stores/all'
import { onPushMsg } from '../../src-pwa/register-service-worker'

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
    const config = stores.config
    const session = stores.session
    let u = '?'
    try {
      const org = args.org
      u = await getUrl(org)
      session.opStart(this)
      if (args) args.APIVERSION = config.K.APIVERSION
      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(u + 'op/' + this.opName, {
        method: 'POST',
        headers:{'Content-Type': 'application/octet-stream' },
        signal: this.controller.signal,
        body: new Uint8Array(encode(args || {}))
      })
      this.controller = null
      const buf = await response.bytes()
      const obj = decode(buf)
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
