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

export async function post (opName: string, args: any) {
  const body = new Uint8Array(encode(args || {}))
  try {
    const response = await fetch('http://localhost:8080/op/' + opName, {
      method: 'POST',
      headers:{'Content-Type': 'application/octet-stream' },    
      body
    })
    if (response.status === 200) {
      // @ts-ignore
      const buf = await response.bytes()
      return decode(buf)
    } 
    if (response.status === 400 || response.status === 401) { 
      // @ts-ignore
      const err = await response.bytes()
      const exc = decode(err)
      throw new AppExc(exc)
    }
  } catch (e) {
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    throw e
  }
}
