// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { AppExc, config } from './util'
import { K } from './constants'

let controller: AbortController

export function abortPostOp() {
  // console.log('Abort ' + config.opEncours);
  if (controller) controller.abort()
}

export async function postOp (opName: string, args: any) : Promise<any>{
  config.opStart(opName)
  const u = K.urlsrv + (K.urlsrv.endsWith('/') ? '' : '/')
  args.APIVERSION = K.APIVERSION
  const body = new Uint8Array(encode(args || {}))
  controller = new AbortController()
  try {
    const response = await fetch(u + 'op/' + opName, {
      method: 'POST',
      headers:{'Content-Type': 'application/octet-stream' },
      signal: controller.signal,
      body
    })
    controller = null
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
    controller = null
    // if (e.name !== 'AbortError')
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    config.opEnd()
    throw e
  }
}

export async function getData (url: string) : Promise<Uint8Array> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {'Content-Type': 'application/octet-stream' }
    })
    if (response.status === 200) {
      // @ts-ignore
      const buf = await response.bytes()
      return buf
    }
    throw new AppExc({ code: response.status, label: response.statusText, args: ['getData'] })
  } catch (e) {
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    throw e
  }
}

export async function putData (url: string, data: Uint8Array) : Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(data)
    })
    if (response.status !== 200)
      throw new AppExc({ code: response.status, label: response.statusText, args: ['putData'] })
  } catch (e) {
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    throw e
  }
}
