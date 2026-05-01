import { AppExc } from './util'

const urls = new Map<string, string>()

export async function getData (url: string) : Promise<Uint8Array> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {'Content-Type': 'application/octet-stream' }
    })
    if (response.status === 200) return await response.bytes()
    throw new AppExc(8, 'HTTP_not_200', 'getData', ['' + response.status, response.statusText])
  } catch (e: any) {
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
      throw new AppExc(8, 'HTTP_not_200', 'putData', ['' + response.status, response.statusText])
  } catch (e: any) {
    console.log(e.message + (e.stack ? '\n' + e.stack : ''))
    throw e
  }
}

export function arrayBuffer (u8: Uint8Array) {
  // https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
  return u8 ? u8.buffer.slice(u8.byteOffset, u8.byteLength + u8.byteOffset) : null
}
