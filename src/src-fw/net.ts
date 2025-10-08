// @ts-ignore
// import { encode, decode } from '@msgpack/msgpack'
// import stores from '../stores/all'

import { AppExc, u8ToB64 } from './util'
const decoder = new TextDecoder('utf-8')
// const encoder = new TextEncoder('utf-8')

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

export function arrayBuffer (u8: Uint8Array) {
  // https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
  return u8 ? u8.buffer.slice(u8.byteOffset, u8.byteLength + u8.byteOffset) : null
}

export async function res (name: string) {
  // const url = new URL('/' + name, import.meta.url).href
  const url = './' + name
  let buf: Uint8Array
  try {
    buf = new Uint8Array(await getData(url))
  } catch (e) {
    console.log(e)
    return null
  }
  const t = name.substring(name.lastIndexOf('.') + 1)
  if (t === 'json') {
    const txt = decoder.decode(buf)
    return JSON.parse(txt)
  }
  if (t === 'txt')
    return decoder.decode(buf)
  if (t === 'md') {
    const txt = decoder.decode(buf)
    return txt
  }
  if (t === 'jpg' || t === 'png')
    return 'data:image/' + t + ';base64,' + u8ToB64(buf)
  return buf
}
