import { AppExc } from './util'
import stores from '../stores/all'

const urls = new Map<string, string>()

// Retourne l'URL du serveur hébergeant org
export async function getUrl (org: string) : Promise<string> {
  const config = stores.config
  let u = urls.get(org)
  if (!u) {
    const url = config.K.DIRECTORY_URL + 'url/' + org
    let response
    try {
      response = await fetch(url)
    } catch (e) {
      throw new AppExc({ code:11007, label: 'Unserved org', args:[(org || '?'), e.toString()]})
    }
    if (!response.ok) 
      throw new AppExc({ code:11007, label: 'Unserved org', args:[(org || '?'), response.statusText]})
    u = await response.text()
    if (u.startsWith('$')) 
      throw new AppExc({ code:11007, label: 'Unserved org', args:[(org || '?'), u]})
    urls.set(org, u)
  }
  return u
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

export function arrayBuffer (u8: Uint8Array) {
  // https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
  return u8 ? u8.buffer.slice(u8.byteOffset, u8.byteLength + u8.byteOffset) : null
}
