// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

export class AppExc {
  /* code
  1000: erreurs fonctionnelles FW
  2000: erreurs fonctionnelles APP
  3000: asserions FW
  4000: asserions APP
  8000: asserions FW - transmises à l'administrateur
  9000: asserions APP - transmises à l'administrateur
*/
  public code: number
  public label: string
  public opName: string
  public org: string
  public stack: string
  public args: string[]
  public message: string

  constructor ( arg: any ) {
    this.label = arg.label || ''
    this.code = arg.code || 0
    this.opName = arg.opName || ''
    this.org = arg.org || ''
    this.args = arg.args || []
    this.stack = arg.stack || ''
    this.message = 'AppExc: ' + this.code + ':' + this.label +
      (this.opName ? '@' + this.opName + ':': '') + JSON.stringify(this.args || [])
  }
}

export let config: any = null
export let $t: any
export let $q: any

export function setConfig (_config: any, _$t, _$q) {
  config = _config
  $t = _$t
  $q = _$q
}

// const urlsrv = 'http://localhost:8080/'
const urlsrv = 'https://europe-west1-asocial2.cloudfunctions.net/asocialgcf/'

const controller = new AbortController()

export function abortPostOp() {
  // console.log('Abort ' + config.opEncours);
  controller.abort()
}

export async function postOp (opName: string, args: any) : Promise<any>{
  const u = urlsrv + (urlsrv.endsWith('/') ? '' : '/')
  config.opStart(opName)
  const body = new Uint8Array(encode(args || {}))
  try {
    const signal = controller.signal
    const response = await fetch(u + 'op/' + opName, {
      method: 'POST',
      headers:{'Content-Type': 'application/octet-stream' },
      signal: signal,
      body
    })
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
    if (e.name !== 'AbortError')
      console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    config.opEnd()
    throw e
  }
}

export async function getData (url: string) : Promise<Uint8Array> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers:{'Content-Type': 'application/octet-stream' }
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
      headers:{'Content-Type': 'application/octet-stream' },
      body: data
    })
    if (response.status !== 200)
      throw new AppExc({ code: response.status, label: response.statusText, args: ['putData'] })
  } catch (e) {
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    throw e
  }
}

export interface fileDescr {
  size?: number
  name: string
  type?: string
  b64?: string
  u8?: Uint8Array
}

export async function readFile (file: any, bin: boolean) : Promise<fileDescr> {
  return new Promise((resolve, reject) => {
    const fd: fileDescr = { size: file.size, name: file.name }
    if (!file.type) {
      fd.type = file.name.endsWith('.md') || file.name.endsWith('.markdown') ? 'text/markdown' : 'application/octet-stream'
    } else fd.type = file.type

    const reader = new FileReader()
    reader.addEventListener('load', (event: any) => {
      if (!bin) {
        fd.b64 = event.target.result
      } else {
        fd.u8 = new Uint8Array(event.target.result)
      }
      resolve(fd)
    })
    reader.onerror = (error) => reject(error)
    if (!bin) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}
