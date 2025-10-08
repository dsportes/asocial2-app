// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import stores from '../stores/all'
import { AppExc } from './util'

let controller: AbortController

export function abortPostOp() {
  if (controller) controller.abort()
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
