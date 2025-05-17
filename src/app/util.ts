// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { K } from './constants'

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

const encoder = new TextEncoder()

let controller: AbortController

export let config: any = null
export let $t: any
export let $q: any

export function setConfig (_config: any, _$t, _$q) {
  config = _config
  $t = _$t
  $q = _$q
}

export function sty (sz?: string) {
  if (!sz) return $q.dark.isActive ? 'dark ' : 'clear '
  return ($q.dark.isActive ? 'dark bsfdark pw' : 'clear bsclear pw') + sz
}

export function sleep (delai: number) {
  if (delai <= 0) return
  return new Promise((resolve: Function) => { setTimeout(() => resolve(), delai) })
}

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

export function openHelp (page: string) {
  const ph = config.getHelpPages()
  if (!ph.has(page)) {
    $q.dialog({
      // title: 'Alert',
      message: $t('HLPaidebd', [page]),
      ok: { label: $t('gotit'), flat:true, color: "primary" }
    }).onOk(() => { }).onCancel(() => { }).onDismiss(() => { })
  }
  else {
    // TODO
    console.log('Ouverture page aide ', page)
    return 
  }
}

export function urlFromText (text: string, type?: string) : string {
  const blob = new Blob([encoder.encode(text)], { type: type || 'text/html' })
  return URL.createObjectURL(blob)
}

export function reloadPage () {
  const hr = window.location.href
  const t =  `<html><head><meta charset="utf-8">
<script>
setTimeout(() => { window.location.href = "${hr}" }, 2000)
</script>
<style>div {font-size:18px;margin:12px;font-family:sans-serif;text-align:center;};</style>
</head><body>
<div>Application reloading, please wait 2s.</div>
<div>Rechargement de l'application, merci d'attendre 2s.</div>
</body></html>`
  window.location.href = urlFromText(t)
}

/*
export function b64ToU8 (s) {
  const diff = s.length % 4
  let x = s
  if (diff) {
    const pad = '===='.substring(0, 4 - diff)
    x = s + pad
  }
  return toByteArray(x.replace(/-/g, '+').replace(/_/g, '/'))
}
*/