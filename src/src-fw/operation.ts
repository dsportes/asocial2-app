// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from './util'
import stores from '../stores/all'

/* Opération générique ******************************************/
export class Operation {
  opName: string
  controller: AbortController

  constructor (opName: string) { 
    this.opName = opName 
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    if (this.controller) this.controller.abort()
  }

  async post (args: any) : Promise<any>{
    const config = stores.config
    config.opStart(this)
    const u = config.K.urlsrv + (config.K.urlsrv.endsWith('/') ? '' : '/')
    args.APIVERSION = config.K.APIVERSION
    const body = new Uint8Array(encode(args || {}))
    this.controller = new AbortController()
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
        config.opEnd()
        return x
      }
      if (response.status === 400 || response.status === 401) {
        // @ts-ignore
        const err = await response.bytes()
        const exc = decode(err)
        config.opEnd()
        throw new AppExc(exc)
      }
    } catch (e) {
      this.controller = null
      // if (e.name !== 'AbortError')
      console.log(e.message + (e.stack ? '\n' + e.stack : ''))
      config.opEnd()
      throw e
    }
  }

}
